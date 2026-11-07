# Import necessary modules
from machine import Pin, ADC
import time
import math

from XRPLib.servo import Servo
from XRPLib.encoded_motor import EncodedMotor
from pestolink_adapted import PestoLinkAgent

# --- BGA servo configuration ---
# Servo n on pin GPn follows BGA n: servos 1-4 are the port (left) side,
# 5-8 the starboard (right) side. List index = packet slot (0-7 = BGA 1-8).
# Same pins as iss-mimic-test/calibration.py.
BGA_SERVO_PINS = ["GP1", "GP2", "GP3", "GP4", "GP5", "GP6", "GP7", "GP8"]

# --- SARJ motor configuration ---
# Set to True once the SARJs are on encoded DC motors. Left off by default so the
# motor driver and encoder pins are never claimed while only servos are wired up.
SARJ_ENABLED = False

# (packet slot, XRP motor port 1-4). Slot 8 is starboard SARJ (S0000003),
# slot 9 is port SARJ (S0000004). Ports 1/2 are the left/right drive motors,
# 3/4 the extra motor ports.
SARJ_MOTOR_PORTS = [
    (8, 1),  # Starboard SARJ
    (9, 2),  # Port SARJ
]

# Motor revolutions per one full turn of the joint (1.0 = joint is on the motor shaft).
SARJ_GEAR_RATIO = 1.0

# Position control tuning (error is in joint degrees)
SARJ_KP = 0.01          # effort per degree of error
SARJ_MIN_EFFORT = 0.15  # smallest effort that still overcomes friction
SARJ_MAX_EFFORT = 0.6
SARJ_TOLERANCE = 2      # degrees; inside this the motor brakes and holds

# The joint angle is measured from where the encoder reads zero, which is wherever
# the joint sits when the robot boots. Power on with both SARJs at 0 degrees.


def set_bga_servo(servo, angle):
    """
    Servos only reach 0-180, so angles past 180 are mirrored back.
    :return: The angle the servo was actually commanded to
    """
    servo_angle = angle if angle <= 180 else 360 - angle
    servo.set_angle(servo_angle)
    return servo_angle


def joint_angle(motor):
    """Current joint angle in degrees (unbounded, can exceed 360 or go negative)."""
    return motor.get_position() * 360.0 / SARJ_GEAR_RATIO


def drive_sarj_toward(motor, target_degrees):
    """
    Take one non-blocking control step moving the joint toward an absolute angle.
    Called every loop so new telemetry is picked up immediately instead of waiting
    for a blocking move to finish.

    :param motor: EncodedMotor instance
    :param target_degrees: Absolute target angle, 0-360
    """
    # Shortest signed path to the target, in (-180, 180], so a SARJ crossing
    # 360 -> 0 keeps rotating forward instead of unwinding a full turn.
    error = (target_degrees - joint_angle(motor) + 180) % 360 - 180

    if abs(error) < SARJ_TOLERANCE:
        motor.set_effort(0)
        motor.brake()
        return

    effort = SARJ_KP * error
    if abs(effort) < SARJ_MIN_EFFORT:
        effort = math.copysign(SARJ_MIN_EFFORT, effort)
    effort = min(max(effort, -SARJ_MAX_EFFORT), SARJ_MAX_EFFORT)
    motor.set_effort(effort)


def stop_sarjs():
    for _, motor in sarj_motors:
        motor.set_effort(0)
        motor.brake()


bga_servos = [Servo(pin) for pin in BGA_SERVO_PINS]
# Last angle each servo was commanded to (None until the first packet), reported back
# to the browser. Hobby servos have no position feedback, so this is the best we know.
servo_commanded = [None] * len(bga_servos)

sarj_motors = []
if SARJ_ENABLED:
    sarj_motors = [(slot, EncodedMotor.get_default_encoded_motor(port))
                   for slot, port in SARJ_MOTOR_PORTS]

#Choose the name your robot shows up as in the Bluetooth paring menu
#Name should be 8 characters max!
robot_name = "IssMimic"

# Create an instance of the PestoLinkAgent class
pestolink = PestoLinkAgent(robot_name)

# Start an infinite loop. Short sleep so the SARJ position control stays responsive.
# Angles outside 0-360 (including "no data yet") are skipped, so that joint holds still.
while True:
    time.sleep(0.02)
    # If the live page went silent (browser gone, Windows still holding the link),
    # disconnect and advertise again so Chrome can find the robot
    pestolink.drop_stale_link()
    if pestolink.is_connected(): # Check if a BLE connection is established
        # BGA angles drive the servos
        for slot, servo in enumerate(bga_servos):
            angle = pestolink.get_angle(slot)
            if angle >= 0 and angle <= 360:
                servo_commanded[slot] = set_bga_servo(servo, angle)

        # SARJ angles drive the encoded motors to an absolute position
        for slot, motor in sarj_motors:
            target = pestolink.get_angle(slot)
            if target >= 0 and target <= 360:
                drive_sarj_toward(motor, target)

        # Both telemetry sends rate-limit themselves to one every 500 ms
        batteryVoltage = (ADC(Pin("BOARD_VIN_MEASURE")).read_u16())/(1024*64/14)
        pestolink.telemetryPrintBatteryVoltage(batteryVoltage)

        # Report what the mini ISS is doing: commanded servo angles and, when the
        # SARJ motors are driven, their measured (encoder) angles.
        sarj_measured = [None, None]
        for slot, motor in sarj_motors:
            sarj_measured[slot - 8] = joint_angle(motor)
        pestolink.telemetrySendJointAngles(servo_commanded, sarj_measured)
    else: #default behavior when no BLE connection is open: servos hold, SARJs brake
        stop_sarjs()
