# Import necessary modules
from machine import Pin, ADC, Timer
import bluetooth
import time
import math
from XRPLib.pid import PID

from XRPLib.defaults import *
from pestolink_adapted import PestoLinkAgent

#Helper function for motor angle

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


#Choose the name your robot shows up as in the Bluetooth paring menu
#Name should be 8 characters max!
robot_name = "IssMimic"

# Create an instance of the PestoLinkAgent class
pestolink = PestoLinkAgent(robot_name)

throttleThreshold = 0
rotateThreshold = 0.25

servos = [servo_one, servo_two, servo_three, servo_four]

# Start an infinite loop
while True:
    time.sleep(0.1)
    if pestolink.is_connected(): # Check if a BLE connection is established
        for i in range(4):
            if pestolink.get_angle(i) >= 0 and pestolink.get_angle(i) <= 360:
                if pestolink.get_angle(i) <= 180:
                    servos[i].set_angle(pestolink.get_angle(i))
                else:
                    servos[i].set_angle(360-pestolink.get_angle(i))
            batteryVoltage = (ADC(Pin("BOARD_VIN_MEASURE")).read_u16())/(1024*64/14)
            pestolink.telemetryPrintBatteryVoltage(batteryVoltage)

            # if pestolink.get_angle(1) >= 0 and pestolink.get_angle(1) <= 360:
            #     if pestolink.get_angle(1) <= 180:
            #         servo_two.set_angle(pestolink.get_angle(1))
            #     else:
            #         servo_two.set_angle(360-pestolink.get_angle(1))

            # if pestolink.get_angle(2) >= 0 and pestolink.get_angle(2) <= 360:
            #     if pestolink.get_angle(2) <= 180:
            #         servo_three.set_angle(pestolink.get_angle(2))
            #     else:
            #         servo_three.set_angle(360-pestolink.get_angle(2))
        
            # if pestolink.get_angle(3) >= 0 and pestolink.get_angle(3) <= 360:
            #     if pestolink.get_angle(3) <= 180:
            #         servo_four.set_angle(pestolink.get_angle(3))
            #     else:
            #         servo_four.set_angle(360-pestolink.get_angle(3))
            '''       
            TODO: Test with the motors. The current implementation is not the best one.  
            if pestolink.get_angle(5) >= 0 and pestolink.get_angle(5) <= 360:
                move_motor_angles_pid(left_motor, pestolink.get_angle(5))
                    
            if pestolink.get_angle(6) >= 0 and pestolink.get_angle(6) <= 360:
                move_motor_angles_pid(left_motor, pestolink.get_angle(6))
                '''
    else: #default behavior when no BLE connection is open
        drivetrain.arcade(0, 0)
        servo_one.set_angle(70)


