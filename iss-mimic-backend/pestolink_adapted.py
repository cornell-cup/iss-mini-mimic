from micropython import const
import bluetooth
import random
import struct
import time


_IRQ_CENTRAL_CONNECT = const(1)
_IRQ_CENTRAL_DISCONNECT = const(2)
_IRQ_GATTS_WRITE = const(3)

_FLAG_READ = const(0x0002)
_FLAG_WRITE_NO_RESPONSE = const(0x0004)
_FLAG_WRITE = const(0x0008)
_FLAG_NOTIFY = const(0x0010)

_RX_BUFFER_SIZE = const(64)

# Returned by get_angle when there is no data for that slot. Anything outside
# 0-360 is ignored by main.py, so the servo or motor just holds its position.
NO_ANGLE = const(0xFFFF)

# First byte of the joint-angle telemetry packet sent back to the browser
_JOINT_TELEMETRY_ID = const(0xA1)

# Number of 2-byte angles carried by each packet version
_ANGLE_COUNT = {0x01: 4, 0x02: 6, 0x03: 10}

# Packet state before any (valid) data: version 0 carries no angles
_NO_DATA = (0,) * 20

# The live page resends every second; this much silence means it is gone
_LIVE_TIMEOUT_MS = const(5000)

_UART_UUID = bluetooth.UUID("27df26c5-83f4-4964-bae0-d7b7cb0a1f54")
_UART_TX = (
    bluetooth.UUID("266d9d74-3e10-4fcd-88d2-cb63b5324d0c"),
    _FLAG_READ | _FLAG_NOTIFY,
)
_UART_RX = (
    bluetooth.UUID("452af57e-ad27-422c-88ae-76805ea641a9"),
    _FLAG_WRITE | _FLAG_WRITE_NO_RESPONSE,
)
_UART_SERVICE = (
    _UART_UUID,
    (_UART_TX, _UART_RX),
)

_ADV_TYPE_FLAGS = const(0x01)
_ADV_TYPE_NAME = const(0x09)
_ADV_TYPE_UUID16_COMPLETE = const(0x3)
_ADV_TYPE_UUID32_COMPLETE = const(0x5)
_ADV_TYPE_UUID128_COMPLETE = const(0x7)
_ADV_TYPE_UUID16_MORE = const(0x2)
_ADV_TYPE_UUID32_MORE = const(0x4)
_ADV_TYPE_UUID128_MORE = const(0x6)
_ADV_TYPE_APPEARANCE = const(0x19)


# Generate a payload to be passed to gap_advertise(adv_data=...).
def advertising_payload(limited_disc=False, br_edr=False, name=None, services=None, appearance=0):
    payload = bytearray()

    def _append(adv_type, value):
        nonlocal payload
        payload += struct.pack("BB", len(value) + 1, adv_type) + value

    _append(
        _ADV_TYPE_FLAGS,
        struct.pack("B", (0x01 if limited_disc else 0x02) + (0x18 if br_edr else 0x04)),
    )

    if name:
        _append(_ADV_TYPE_NAME, name)

    if services:
        for uuid in services:
            b = bytes(uuid)
            if len(b) == 2:
                _append(_ADV_TYPE_UUID16_COMPLETE, b)
            elif len(b) == 4:
                _append(_ADV_TYPE_UUID32_COMPLETE, b)
            elif len(b) == 16:
                _append(_ADV_TYPE_UUID128_COMPLETE, b)

    # See org.bluetooth.characteristic.gap.appearance.xml
    if appearance:
        _append(_ADV_TYPE_APPEARANCE, struct.pack("<h", appearance))

    return payload


def decode_field(payload, adv_type):
    i = 0
    result = []
    while i + 1 < len(payload):
        if payload[i + 1] == adv_type:
            result.append(payload[i + 2 : i + payload[i] + 1])
        i += 1 + payload[i]
    return result


def decode_name(payload):
    n = decode_field(payload, _ADV_TYPE_NAME)
    return str(n[0], "utf-8") if n else ""


def decode_services(payload):
    services = []
    for u in decode_field(payload, _ADV_TYPE_UUID16_COMPLETE):
        services.append(bluetooth.UUID(struct.unpack("<h", u)[0]))
    for u in decode_field(payload, _ADV_TYPE_UUID32_COMPLETE):
        services.append(bluetooth.UUID(struct.unpack("<d", u)[0]))
    for u in decode_field(payload, _ADV_TYPE_UUID128_COMPLETE):
        services.append(bluetooth.UUID(u))
    return services

class PestoLinkAgent:
    def __init__(self, name):
        sliced_name = name[:8] #only use the first 8 characters in the name, otherwise code will crash
        self._ble = bluetooth.BLE()
        self._ble.active(True)
        self._ble.irq(self._irq)
        ((self._handle_tx, self._handle_rx),) = self._ble.gatts_register_services((_UART_SERVICE,))
        # The RX buffer defaults to 20 bytes, which would cut off the 21-byte v3 packet.
        # Also ask for a larger MTU so the browser can send it in one write.
        self._ble.gatts_set_buffer(self._handle_rx, _RX_BUFFER_SIZE)
        try:
            self._ble.config(mtu=_RX_BUFFER_SIZE + 3)
        except Exception:
            pass  # older firmware without MTU config; Windows/Chrome usually negotiate it anyway
        self._connections = set()
        self._payload = advertising_payload(name=sliced_name, services=[_UART_UUID])
        # Version 0 is not a known packet, so every angle reads as NO_ANGLE until the
        # browser sends real data (the old gamepad defaults decoded as angle 0).
        self._byte_list = list(_NO_DATA)
        self._advertise()
        self.last_telemetry_ms = 0
        self.last_joint_telemetry_ms = 0
        # Set once the live page sends a v3 packet; enables drop_stale_link
        self._live_mode = False
        self._last_write_ms = time.ticks_ms()

    def _irq(self, event, data):
        # Track connections so we can send notifications.
        if event == _IRQ_CENTRAL_CONNECT:
            conn_handle, _, _ = data
            #print("New connection")
            self._connections.add(conn_handle)
            self._live_mode = False
        elif event == _IRQ_CENTRAL_DISCONNECT:
            conn_handle, _, _ = data
            #print("Disconnected")
            self._connections.discard(conn_handle)
            # Start advertising again to allow a new connection.
            self._advertise()
        elif event == _IRQ_GATTS_WRITE:
            conn_handle, value_handle = data
            value = self._ble.gatts_read(value_handle)
            if value_handle == self._handle_rx:
                self.on_write(value)

    def send(self, data):
        # A stale connection can fail to notify; drop it instead of crashing the main loop
        for conn_handle in list(self._connections):
            try:
                self._ble.gatts_notify(conn_handle, self._handle_tx, data)
            except OSError:
                self._connections.discard(conn_handle)

    def is_connected(self):
        return len(self._connections) > 0

    def _advertise(self, interval_us=500000):
        #print("Starting advertising")
        self._ble.gap_advertise(interval_us, adv_data=self._payload)

    def drop_stale_link(self, timeout_ms=_LIVE_TIMEOUT_MS):
        """
        Disconnect a live-page connection that has gone silent, then advertise again.

        Windows can keep the Bluetooth link open long after the browser disconnects.
        The robot does not advertise while it thinks it is connected, so it would stay
        invisible to Chrome's device picker. The live page resends its packet every
        second, so silence means the browser is gone. Only applies after a live (v3)
        packet, so the manual pages, which send only on change, are never dropped.
        Call this from the main loop.
        """
        if not self._live_mode or not self._connections:
            return
        if time.ticks_diff(time.ticks_ms(), self._last_write_ms) < timeout_ms:
            return
        for conn_handle in list(self._connections):
            try:
                self._ble.gap_disconnect(conn_handle)
            except OSError:
                pass  # already gone
        self._connections.clear()
        self._live_mode = False
        self._byte_list = list(_NO_DATA)
        self._advertise()


    #Initialiated when data is written to the RX characteristic. Now it all begins in 0.
    def on_write(self, value):
        _raw_byte_list = [byte for byte in value]
        self._last_write_ms = time.ticks_ms()
        if len(_raw_byte_list) > 0 and _raw_byte_list[0] in _ANGLE_COUNT:
            self._byte_list = _raw_byte_list
            if _raw_byte_list[0] == 0x03:
                self._live_mode = True
        else:
            self._byte_list = list(_NO_DATA)

    #GETS THE ANGLES FROM 0 TO 360. 2 bytes per angle (low byte first).
    #v1 packets carry 4 angles, v2 carry 6, v3 (live ISS) carry 10:
    #slots 0-7 = BGA 1-8, slot 8 = starboard SARJ, slot 9 = port SARJ.
    #Returns NO_ANGLE when the current packet has no data for that slot.
    def get_angle(self, angle_num):
        if self._byte_list == None or len(self._byte_list) == 0:
            return NO_ANGLE
        if angle_num < 0 or angle_num >= _ANGLE_COUNT.get(self._byte_list[0], 0):
            return NO_ANGLE
        base_idx = 1 + (angle_num * 2)
        if base_idx + 1 >= len(self._byte_list):
            return NO_ANGLE  # packet was cut short
        # Combine low and high bytes
        return self._byte_list[base_idx] | (self._byte_list[base_idx + 1] << 8)
        
    def get_raw_axis(self, axis_num):
        if axis_num < 0 or axis_num > 3 or self._byte_list == None:
            return 127
        else:
            return self._byte_list[1 + axis_num]

    def get_axis(self, axis_num):
        raw_axis = self.get_raw_axis(axis_num)
        if raw_axis == 127:
            return 0
        else:
            return (raw_axis / 127.5) - 1
    
    #CHANGED IT TO MAKE SPACE FOR 4 ANGLES
    def get_button(self, button_num):
        if self._byte_list == None:
            return False
        
        if self._byte_list[0] == 0x02:  # Extended protocol
            raw_buttons = (self._byte_list[14] << 8) + self._byte_list[13]
        else:  # Original protocol
            raw_buttons = (self._byte_list[10] << 8) + self._byte_list[9]
            
        if ((raw_buttons >> (button_num)) & 0x01):
            return True
        else:
            return False
            
    def telemetryPrint(self, telemetry, hex_code):
        if self.last_telemetry_ms + 500 > time.ticks_ms():
            return

        result = bytearray(11)
        
        # Copy up to 8 characters from telemetry
        for i in range(8):
            if i < len(telemetry):
                result[i] = ord(telemetry[i])
            else:
                result[i] = 0
        
        # Adjust pointer if the hex code starts with "0x"
        if hex_code.startswith("0x"):
            hex_code = hex_code[2:]
        
        try:
            color = int(hex_code, 16)
        except ValueError:
            color = 0  # Default to 0 if conversion fails
        
        #debug: print(str(hex_code) + " " + str(color))
        
        result[8] = (color >> 16) & 0xFF
        result[9] = (color >> 8) & 0xFF
        result[10] = color & 0xFF
        
        self.send(result)  # Assuming BLE characteristic write
        self.last_telemetry_ms = time.ticks_ms()
        
    def telemetryPrintBatteryVoltage(self, battery_voltage):
        voltage_string = "{:.2f} V".format(battery_voltage)
        
        """if battery_voltage >= 7.6:
            self.telemetryPrint(voltage_string, "00FF00")
        elif battery_voltage >= 7:
            self.telemetryPrint(voltage_string, "FFFF00")
        else:"""
        self.telemetryPrint(voltage_string, "FF0000")

    def telemetrySendJointAngles(self, servo_angles, sarj_angles):
        """
        Report what the mini ISS is doing, at most once every 500 ms.

        Packet (13 bytes): [0xA1, servo 1..8 (1 byte each, 0-180, 0xFF = not set yet),
        starboard SARJ, port SARJ (2 bytes each, low byte first, 0-359, 0xFFFF = none)].
        0xA1 is not printable ASCII, so the browser can tell this apart from the
        battery text sent by telemetryPrint.

        :param servo_angles: 8 commanded servo angles, or None where not set yet
        :param sarj_angles: 2 measured SARJ angles in degrees, or None when not driven
        """
        if time.ticks_diff(time.ticks_ms(), self.last_joint_telemetry_ms) < 500:
            return

        result = bytearray(13)
        result[0] = _JOINT_TELEMETRY_ID
        for i in range(8):
            angle = servo_angles[i] if i < len(servo_angles) else None
            result[1 + i] = 0xFF if angle is None else max(0, min(180, int(angle)))
        for i in range(2):
            angle = sarj_angles[i] if i < len(sarj_angles) else None
            value = NO_ANGLE if angle is None else int(angle) % 360
            result[9 + i * 2] = value & 0xFF
            result[10 + i * 2] = (value >> 8) & 0xFF

        self.send(result)
        self.last_joint_telemetry_ms = time.ticks_ms()
