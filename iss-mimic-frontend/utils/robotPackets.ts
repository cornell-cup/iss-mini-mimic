/**
 * Creates an XRP robot control packet with support for 0-360 degree angles
 * 
 * @param angles Object with angle values (0-360 degrees)
 * @param buttons Object with button state bytes
 * @param keyboardKeys Array of keyboard key codes (optional)
 * @returns Uint8Array packet ready to send
 */
export function createRobotPacket({
  angles = { angle0: 0, angle1: 0, angle2: 0, angle3: 0, angle4: 0, angle5: 0 },
  buttons = { byte0: 0, byte1: 0 },
  keyboardKeys = []
}: {
  angles?: { angle0?: number; angle1?: number; angle2?: number; angle3?: number; angle4?: number; angle5?: number };
  buttons?: { byte0?: number; byte1?: number };
  keyboardKeys?: number[];
} = {}): Uint8Array {
  // Create packet - increased size to accommodate 2 bytes per angle
  const packet = new Uint8Array(26).fill(0);
  
  // Set packet version
  packet[0] = 0x02; // Updated version to indicate 6-angle format
  
  // Ensure angles are within valid range and convert to integers
  const angle0 = Math.min(360, Math.max(0, Math.floor(angles.angle0 ?? 0)));
  const angle1 = Math.min(360, Math.max(0, Math.floor(angles.angle1 ?? 0)));
  const angle2 = Math.min(360, Math.max(0, Math.floor(angles.angle2 ?? 0)));
  const angle3 = Math.min(360, Math.max(0, Math.floor(angles.angle3 ?? 0)));
  const angle4 = Math.min(360, Math.max(0, Math.floor(angles.angle4 ?? 0)));
  const angle5 = Math.min(360, Math.max(0, Math.floor(angles.angle5 ?? 0)));
  
  // Set angle values (each angle uses 2 bytes: low byte first, then high byte)
  packet[1] = angle0 & 0xFF;         // Angle 0 - low byte
  packet[2] = (angle0 >> 8) & 0xFF;  // Angle 0 - high byte
  packet[3] = angle1 & 0xFF;         // Angle 1 - low byte
  packet[4] = (angle1 >> 8) & 0xFF;  // Angle 1 - high byte
  packet[5] = angle2 & 0xFF;         // Angle 2 - low byte
  packet[6] = (angle2 >> 8) & 0xFF;  // Angle 2 - high byte
  packet[7] = angle3 & 0xFF;         // Angle 3 - low byte
  packet[8] = (angle3 >> 8) & 0xFF;  // Angle 3 - high byte
  packet[9] = angle4 & 0xFF;         // Group 1 - low byte
  packet[10] = (angle4 >> 8) & 0xFF; // Group 1 - high byte
  packet[11] = angle5 & 0xFF;        // Group 2 - low byte
  packet[12] = (angle5 >> 8) & 0xFF; // Group 2 - high byte
  
  
  // Set button states
  packet[13] = buttons.byte0 !== undefined ? buttons.byte0 : 0;
  packet[14] = buttons.byte1 !== undefined ? buttons.byte1 : 0;
  
  // Set keyboard keys (if any)
  for (let i = 0; i < Math.min(keyboardKeys.length, 15); i++) {
    packet[15 + i] = keyboardKeys[i];
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
 * For backward compatibility with axis-based systems (maps 0-255 to 0-360)
 * 
 * @param axisValue Axis value (0-255)
 * @returns Equivalent angle (0-360)
 */
export function axisToAngle(axisValue: number): number {
  // Map 0-255 to 0-360
  return Math.floor((axisValue * 360) / 255);
}

/**
 * Example usage patterns
 */
export const examplePackets = {
  // Set all angles to 0
  zeroAngles: createRobotPacket(),
  
  // Set specific angles
  setAngles: createRobotPacket({ 
    angles: { angle0: 90, angle1: 180, angle2: 270, angle3: 360 } 
  }),
  
  // Set first angle to 45 degrees
  setAngle0: createRobotPacket({ angles: { angle0: 45 } }),
  
  // Set second angle to 135 degrees
  setAngle1: createRobotPacket({ angles: { angle1: 135 } }),
  
  // Press first button
  pressButton0: createRobotPacket({ buttons: { byte0: 1 } }), // 2^0 = 1
  
  // Press second button
  pressButton1: createRobotPacket({ buttons: { byte0: 2 } }), // 2^1 = 2
  
  // Press multiple buttons
  pressMultipleButtons: createRobotPacket({ buttons: { byte0: 7 } }), // 1+2+4 = 7 (buttons 0, 1, and 2)
}