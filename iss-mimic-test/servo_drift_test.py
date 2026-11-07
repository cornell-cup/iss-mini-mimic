# Servo drift / error test for the mini ISS.
#
# Moves each servo through fixed angles, approaching from both directions, so you can
# read the real angle off a protractor and type it in. Run one session per power-on:
# power the robot off and on between sessions and increase the session number.
# At the end it prints tab-separated rows to paste into servo_drift_results.xlsx
# (Data sheet, cell A2 or the first empty row).
#
# Run from XRPCode with the website disconnected. Ctrl+C stops at any time.

from XRPLib.servo import Servo
from machine import Pin, ADC
import time

# Same pins as BGA_SERVO_PINS in iss-mimic-backend/main.py: servo n is on GPn
SERVO_PINS = ["GP1", "GP2", "GP3", "GP4", "GP5", "GP6", "GP7", "GP8"]

TEST_ANGLES = [0, 45, 90, 135, 180]
SETTLE_S = 1.0         # wait after each move before reading
SWEEP_STEP_DELAY_S = 0.02


def battery_volts():
    # Same conversion as main.py. Below ~6 V the servos are likely on USB power only.
    return ADC(Pin("BOARD_VIN_MEASURE")).read_u16() / (1024 * 64 / 14)


def reading_sequence():
    """
    (angle, approach) pairs in the order they are measured. Start parked at 0, go up
    through every angle, then back down, so the middle angles are read from both
    directions (that difference is the servo's backlash / hysteresis).
    """
    up = [(angle, "up") for angle in TEST_ANGLES[1:]]
    down = [(angle, "down") for angle in reversed(TEST_ANGLES[:-1])]
    return up + down


def exercise(servo, sweeps):
    """Full 0-180-0 sweeps, to check whether lots of movement causes drift."""
    for _ in range(sweeps):
        for angle in list(range(0, 181, 5)) + list(range(180, -1, -5)):
            servo.set_angle(angle)
            time.sleep(SWEEP_STEP_DELAY_S)


def ask_int(prompt, default):
    text = input("{} [{}]: ".format(prompt, default)).strip()
    return int(text) if text else default


def ask_measured():
    """Measured angle in degrees, or None if skipped."""
    while True:
        text = input("    measured angle (Enter to skip): ").strip()
        if not text:
            return None
        try:
            return float(text)
        except ValueError:
            print("    Please type a number, e.g. 92 or 88.5")


print("===== MINI ISS SERVO DRIFT TEST =====")
volts = battery_volts()
print("Battery: {:.2f} V".format(volts))
if volts < 6:
    print("WARNING: below 6 V. Turn the XRP power switch on with charged batteries,")
    print("otherwise this measures the power supply, not the servos.")

session = ask_int("Session number (add 1 after each power cycle)", 1)
servo_choice = input("Servo to test (1-8, or 'all') [all]: ").strip().lower() or "all"
cycles = ask_int("Measurement cycles this session", 1)
sweeps = ask_int("Extra full sweeps before each cycle (0 = none)", 0)

if servo_choice == "all":
    servo_numbers = list(range(1, 9))
else:
    servo_numbers = [int(servo_choice)]

results = []  # (session, cycle, servo, commanded, approach, measured, volts)

for servo_number in servo_numbers:
    servo = Servo(SERVO_PINS[servo_number - 1])
    print("\n--- Servo {} ({}) ---".format(servo_number, SERVO_PINS[servo_number - 1]))

    for cycle in range(1, cycles + 1):
        if sweeps:
            print("Cycle {}: {} full sweeps...".format(cycle, sweeps))
            exercise(servo, sweeps)

        # Park at 0 so the first reading (45) is approached from below
        servo.set_angle(TEST_ANGLES[0])
        time.sleep(SETTLE_S)

        for angle, approach in reading_sequence():
            servo.set_angle(angle)
            time.sleep(SETTLE_S)
            volts = battery_volts()
            print("S{} C{} Servo {}: {} deg ({}), battery {:.2f} V".format(
                session, cycle, servo_number, angle, approach, volts))
            measured = ask_measured()
            results.append((session, cycle, servo_number, angle, approach, measured, volts))

    servo.set_angle(90)

print("\n===== RESULTS: copy the lines below into the Data sheet =====")
for session_n, cycle, servo_number, angle, approach, measured, volts in results:
    print("\t".join([
        str(session_n), str(cycle), str(servo_number), str(angle), approach,
        "" if measured is None else str(measured), "{:.2f}".format(volts),
    ]))
print("===== END =====")
