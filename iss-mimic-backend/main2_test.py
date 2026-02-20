print("=== MAIN2.PY STARTING ===")
from machine import Pin, ADC, Timer
import bluetooth
import time
import math
from XRPLib.pid import PID
import uasyncio as asyncio

from XRPLib.defaults import *
from pestolink_adapted import PestoLinkAgent
from xy_motion import XYMotion 

#Choose the name your robot shows up as in the Bluetooth paring menu
#Name should be 8 characters max!
robot_name = "IssMimic"

# Create an instance of the PestoLinkAgent class
pestolink = PestoLinkAgent(robot_name)
xy_motion = XYMotion.get_default_xy()

#set boundaries
xy_motion.x_max = 743.3
xy_motion.y_max = 569.1

#boundary constants 
X_MIN = 0
Y_MIN = 0
X_MAX = xy_motion.x_max
Y_MAX = xy_motion.y_max


throttleThreshold = 0
rotateThreshold = 0.25

print("Hello - Starting async main loop")

# Async main loop
async def main():
    #global xy_motion, pestolink

    # Home and calibrate gantry on startup
    print("Homing gantry...")
    await xy_motion.home()
    print("Finding gantry size...")
#     await xy_motion.find_size()
#    print(f"Gantry calibrated: {xy_motion.x_max} x {xy_motion.y_max} mm")

    last_x, last_y = 0, 0

    while True:
        await asyncio.sleep_ms(100)
        print(pestolink.is_connected())
        if pestolink.is_connected():  # Check if a BLE connection is established
            print(pestolink.get_position())
            print(pestolink._byte_list)
            x, y = pestolink.get_position()

            # Handle position updates for gantry
            if (x > 0 or y > 0) and (x != last_x or y != last_y):
                if x <= X_MAX and x >= X_MIN and y <= Y_MAX and y >= Y_MIN:
                    print(f"Moving to ({x}, {y})")
                    await xy_motion.move_to(x, y)
                    last_x, last_y = x, y

            # Servo control
            #Angles span from -180 to 180 degrees 
            if pestolink.get_angle(0) >= 0 and pestolink.get_angle(0) <= 360:
                if pestolink.get_angle(0) <= 180:
                    servo_one.set_angle(pestolink.get_angle(0))
                #convert to negative angle
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
            
            
        else: #default behavior when no BLE connection is open
            drivetrain.arcade(0, 0)
            servo_one.set_angle(70)

        batteryVoltage = (ADC(Pin("BOARD_VIN_MEASURE")).read_u16())/(1024*64/14)
        pestolink.telemetryPrintBatteryVoltage(batteryVoltage)

time.sleep(1)
try:
  asyncio.run(main())
except KeyboardInterrupt:
  print("Stopped by user")
  xy_motion.stop()
except Exception as e:
  print(f"Error: {e}")
  xy_motion.stop()



