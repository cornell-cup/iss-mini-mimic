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

#Helper function for motor angle
'''
def move_motor_angles_pid(motor, angle_degrees, max_speed=40, tolerance=1, timeout=5):
    """
    Move the motor a certain amount of angles using PID control
    
    :param motor: EncodedMotor instance
    :param angle_degrees: Target angle to move in degrees (positive or negative)
    :param max_speed: Maximum speed in RPM to use while moving
    :param tolerance: Acceptable error in degrees
    :param timeout: Maximum time to try reaching the position in seconds
    :return: True if reached target, False if timed out
    """
    # Convert degrees to revolutions
    angle_revolutions = angle_degrees / 360.0
    
    # Get current position as starting point
    start_position = motor.get_position()
    target_position = start_position + angle_revolutions
    
    # Create a position PID controller
    position_pid = PID(
        kp=4.0,  # Proportional gain
        ki=0.1,  # Integral gain
        kd=0.2,  # Derivative gain
        max_integral=1.0
    )
    
    # Set up timing for timeout
    start_time = time.time()
    
    while True:
        # Check timeout
        if time.time() - start_time > timeout:
            motor.set_effort(0)
            return False
            
        # Get current position
        current_position = motor.get_position()
        
        # Calculate error in revolutions
        error = target_position - current_position
        
        # Convert error to degrees to check against tolerance
        error_degrees = error * 360.0
        
        # If within tolerance, we're done
        if abs(error_degrees) < tolerance:
            motor.set_effort(0)  # Stop the motor
            motor.brake()  # Apply brake to hold position
            return True
            
        # Use PID to calculate effort
        effort = position_pid.update(error)
        
        # Clamp effort between -1 and 1
        effort = min(max(effort, -1.0), 1.0)
        
        # Apply the effort to the motor
        motor.set_effort(effort)
        
        # Short delay
        time.sleep(0.01)
'''

#Choose the name your robot shows up as in the Bluetooth paring menu
#Name should be 8 characters max!
robot_name = "IssMimic"

# Create an instance of the PestoLinkAgent class
pestolink = PestoLinkAgent(robot_name)
xy_motion = XYMotion.get_default_xy()
xy_motion.x_max = 205.8
xy_motion.y_max = 103.6


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
    await xy_motion.find_size()
    print(f"Gantry calibrated: {xy_motion.x_max} x {xy_motion.y_max} mm")

    last_x, last_y = 0, 0

    while True:
        await asyncio.sleep_ms(100)
        print(pestolink.is_connected())
        if pestolink.is_connected():  # Check if a BLE connection is established
            print(pestolink.get_position())
            print(pestolink._byte_list)
            x, y = pestolink.get_position()

            #print((x != last_x or y != last_y))

            # Handle position updates for gantry
            if (x > 0 or y > 0) and (x != last_x or y != last_y):
                #print("in first condition")
                if x <= 205.8 and x >= 0 and y <= 103.6 and y >= 0:
                    print(f"Moving to ({x}, {y})")
                    await xy_motion.move_to(x, y)
                    last_x, last_y = x, y

            # Servo control
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

# Run the async main function
#if __name__ == "__main__":
#    try:
#        asyncio.run(main())
#    except KeyboardInterrupt:
#        print("Stopped by user")
#        xy_motion.stop()
#    except Exception as e:
#        print(f"Error: {e}")
#        xy_motion.stop()