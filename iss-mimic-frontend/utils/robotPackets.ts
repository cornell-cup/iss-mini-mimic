/**
 * Creates an XRP robot control packet
 * 
 * @param axes Object with axis values (0-255, where 127 is center)
 * @param buttons Object with button state bytes
 * @param keyboardKeys Array of keyboard key codes (optional)
 * @returns Uint8Array packet ready to send
 */
export function createRobotPacket({
  axes = { axis0: 127, axis1: 127, axis2: 127, axis3: 127 },
  buttons = { byte0: 0, byte1: 0 },
  keyboardKeys = []
}: {
  axes?: { axis0?: number; axis1?: number; axis2?: number; axis3?: number };
  buttons?: { byte0?: number; byte1?: number };
  keyboardKeys?: number[];
} = {}): Uint8Array {
  // Create packet with default values
  const packet = new Uint8Array(18).fill(0);
  
  // Set packet version
  packet[0] = 0x01;
  
  // Set axis values (with defaults at center position)
  packet[1] = axes.axis0 !== undefined ? axes.axis0 : 127;
  packet[2] = axes.axis1 !== undefined ? axes.axis1 : 127;
  packet[3] = axes.axis2 !== undefined ? axes.axis2 : 127;
  packet[4] = axes.axis3 !== undefined ? axes.axis3 : 127;
  
  // Set button states
  packet[5] = buttons.byte0 !== undefined ? buttons.byte0 : 0;
  packet[6] = buttons.byte1 !== undefined ? buttons.byte1 : 0;
  
  // Set keyboard keys (if any)
  for (let i = 0; i < Math.min(keyboardKeys.length, 11); i++) {
    packet[7 + i] = keyboardKeys[i];
  }
  
  return packet;
}

/**
 * Helper to set a specific button bit
 * 
 * @param currentByte Current button byte value
 * @param buttonIndex Button index (0-7)
 * @param isPressed Whether the button is pressed
 * @returns Updated button byte
 */
export function setButtonBit(currentByte: number, buttonIndex: number, isPressed: boolean): number {
  if (isPressed) {
    return currentByte | (1 << buttonIndex); // Set bit
  } else {
    return currentByte & ~(1 << buttonIndex); // Clear bit
  }
}

/**
 * Example usage patterns
 */
export const examplePackets = {
  // Stop all movement (center all axes)
  stop: createRobotPacket(),
  
  // Move forward (reduce axis1 value)
  moveForward: createRobotPacket({ axes: { axis1: 0 } }),
  
  // Move backward (increase axis1 value)
  moveBackward: createRobotPacket({ axes: { axis1: 255 } }),
  
  // Turn right (increase axis0 value)
  turnRight: createRobotPacket({ axes: { axis0: 255 } }),
  
  // Turn left (decrease axis0 value)
  turnLeft: createRobotPacket({ axes: { axis0: 0 } }),
  
  // Press first button
  pressButton0: createRobotPacket({ buttons: { byte0: 1 } }), // 2^0 = 1
  
  // Press second button
  pressButton1: createRobotPacket({ buttons: { byte0: 2 } }), // 2^1 = 2
  
  // Press third button
  pressButton2: createRobotPacket({ buttons: { byte0: 4 } }), // 2^2 = 4
  
  // Press multiple buttons
  pressMultipleButtons: createRobotPacket({ buttons: { byte0: 7 } }), // 1+2+4 = 7 (buttons 0, 1, and 2)
}