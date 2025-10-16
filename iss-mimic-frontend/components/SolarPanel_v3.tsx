'use client';

export default function SolarPanel3(props: any) {
  return (
    <mesh {...props}>
        <boxGeometry args={[1, 0.1, 2]} />
        <meshLambertMaterial color={props.color} />
    </mesh>
  )
}