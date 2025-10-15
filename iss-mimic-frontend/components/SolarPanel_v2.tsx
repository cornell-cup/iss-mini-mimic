'use client';

export default function SolarPanel2(props: any) {
  return (
    <mesh {...props}>
        <boxGeometry args={[1, 0.1, 5]} />
        <meshLambertMaterial color={props.color} />
    </mesh>
  )
}