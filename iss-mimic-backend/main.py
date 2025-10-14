# Import necessary modules
from machine import Pin, ADC
import bluetooth
import time
import math

from XRPLib.defaults import *
from pestolink import PestoLinkAgent

#Choose the name your robot shows up as in the Bluetooth paring menu
#Name should be 8 characters max!
robot_name = "IssMimic"

# Create an instance of the PestoLinkAgent class
pestolink = PestoLinkAgent(robot_name)

throttleThreshold = 0
rotateThreshold = 0.25


# Start an infinite loop
while True:
    time.sleep(0.1)
    if pestolink.is_connected():  # Check if a BLE connection is established
        
        if pestolink.get_angle(0) >= 0 and pestolink.get_angle(0) <= 360:
            if pestolink.get_angle(0) <= 180:
                servo_one.set_angle(pestolink.get_angle(0))
            else:
                servo_one.set_angle(360-pestolink.get_angle(0))

        if pestolink.get_angle(1) >= 0 and pestolink.get_angle(1) <= 360:
            if pestolink.get_angle(1) <= 180:
                servo_two.set_angle(pestolink.get_angle(1))
            else:
                servo_two.set_angle(360-pestolink.get_angle(1))

        if pestolink.get_angle(2) >= 0 and pestolink.get_angle(2) <= 360:
            if pestolink.get_angle(2) <= 180:
                servo_three.set_angle(pestolink.get_angle(2))
            else:
                servo_three.set_angle(360-pestolink.get_angle(2))

        if pestolink.get_angle(4) >= 0 and pestolink.get_angle(4) <= 360:
            if pestolink.get_angle(4) <= 180:
                servo_four.set_angle(pestolink.get_angle(4))
            else:
                servo_four.set_angle(360-pestolink.get_angle(4))

        
        batteryVoltage = (ADC(Pin("BOARD_VIN_MEASURE")).read_u16())/(1024*64/14)
        pestolink.telemetryPrintBatteryVoltage(batteryVoltage)

    else: #default behavior when no BLE connection is open
        drivetrain.arcade(0, 0)
        servo_one.set_angle(70)

