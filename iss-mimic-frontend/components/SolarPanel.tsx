'use client';

export default function SolarPanel(props: any) {
  return (
    <mesh {...props}>
        <boxGeometry args={[1, 0.1, 2]} />
        <meshLambertMaterial color={props.color} />
    </mesh>
  )
}