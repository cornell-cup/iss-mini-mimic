from machine import Pin, ADC
import time
import uasyncio as asyncio
from XRPLib.defaults import *
from pestolink_adapted import PestoLinkAgent

robot_name = "IssMimic"
pestolink = PestoLinkAgent(robot_name)

print("Simple test - no gantry")
print(f"Bluetooth: {robot_name}")

async def main():
    global pestolink

    last_x, last_y = 0, 0

    while True:
        await asyncio.sleep_ms(100)

        if pestolink.is_connected():
            x, y = pestolink.get_position()
            print(f"Position: ({x}, {y}), Bytes: {pestolink._byte_list[:17]}")

            if (x > 0 or y > 0) and (x != last_x or y != last_y):
                print(f">>> NEW POSITION: ({x}, {y}) <<<")
                last_x, last_y = x, y

        batteryVoltage = (ADC(Pin("BOARD_VIN_MEASURE")).read_u16())/(1024*64/14)
        pestolink.telemetryPrintBatteryVoltage(batteryVoltage)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Stopped")
