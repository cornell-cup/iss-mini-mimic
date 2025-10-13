'use client';

import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from 'three';

// Room component with consistent dimensions
export function Room({earthImage = '/Equirectangular_Earth.jpg'}) {
  // Load the earth texture
  const texture = useTexture(earthImage);
  
  // Configure texture properties
  useEffect(() => {
    if (texture) {
      // Set appropriate texture properties
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      
      // Use the current API for color space instead of the deprecated encoding
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // Better quality settings
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);

  // Define the dimensions of the room
  const width = 2058/3;
  const depth = 1036/3;
  const height = 10; // Height from floor to ceiling
  
  // Calculate half dimensions for positioning
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  
  // Floor level and ceiling level
  const floorY = -3;
  const ceilingY = 7;
  const wallCenterY = 2; // Midpoint between floor and ceiling

  return (
    <group>
      {/* Floor with Earth texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          map={texture} 
          color="#ffffff" // Use white so the texture shows true colors
        />
      </mesh>
      
      
    </group>
  );
}