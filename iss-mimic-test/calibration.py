from XRPLib.servo import Servo
from time import sleep

# Create servo objects for GPIO 1-8
servos = {
    1: Servo("GP1"),
    2: Servo("GP2"),
    3: Servo("GP3"),
    4: Servo("GP4"),
    5: Servo("GP5"),
    6: Servo("GP6"),
    7: Servo("GP7"),
    8: Servo("GP8")
}

current_servo = 1
current_angle = 90

print("===== MINI ISS CALIBRATION =====")

while True:
    print("\nSelected Servo:", current_servo)
    print("Current Angle:", current_angle)
    print("1 - Select Servo")
    print("2 - Set Angle")
    print("3 - Center Servo (90)")
    print("4 - Sweep Servo")
    print("0 - Exit")

    choice = input("Choose option: ")

    if choice == "1":
        number = int(input("Enter servo number (1-8): "))

        if number >= 1 and number <= 8:
            current_servo = number
            print("Selected Servo:", current_servo)
        else:
            print("Invalid servo number.")

    elif choice == "2":
        angle = int(input("Enter angle (0-180): "))

        if angle >= 0 and angle <= 180:
            current_angle = angle
            servos[current_servo].set_angle(current_angle)
            print("Servo", current_servo, "moved to", current_angle)
        else:
            print("Angle must be between 0 and 180.")

    elif choice == "3":
        current_angle = 90
        servos[current_servo].set_angle(current_angle)
        print("Servo centered.")

    elif choice == "4":
        print("Sweeping Servo", current_servo)

        for angle in range(30, 151, 10):
            servos[current_servo].set_angle(angle)
            sleep(0.15)

        for angle in range(150, 29, -10):
            servos[current_servo].set_angle(angle)
            sleep(0.15)

        current_angle = 90
        servos[current_servo].set_angle(current_angle)

    elif choice == "0":
        print("Exiting calibration.")
        break

    else:
        print("Invalid option.")