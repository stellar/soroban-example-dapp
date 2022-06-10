import * as THREE from 'three'
import React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

type BoxProps = JSX.IntrinsicElements['mesh'] & {
  color: string;
};

function Box({color, ...props}: BoxProps) {
  const ref = React.useRef<THREE.Mesh>(null!);
  const [mouse, setMouse] = React.useState({x: 0, y: 1});
  useFrame((state, delta) => {
    const camera = state.camera;
    // ref.current.rotation.x = 0;
    // ref.current.rotation.y = 0;
    const vector = new THREE.Vector3(-mouse.x, -mouse.y, 0.5);
    vector.unproject( camera );
    const dir = vector.sub( camera.position ).normalize();
    const distance = - camera.position.z / dir.z;
    dir.multiplyScalar( distance );
    ref.current.lookAt(dir);
    // camera.position.add( dir.multiplyScalar( distance ) );
  });
  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        setMouse({
          x: (e.clientX / window.innerWidth) * 2 - 1,
          y: - (e.clientY / window.innerHeight) * 2 + 1,
        });
    };
    // When the mouse moves, call the given function
    document.addEventListener('mousemove', onMouseMove, false);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);
  return (
    <mesh
      {...props}
      ref={ref}
      castShadow
      scale={1}>
      <boxGeometry args={[3, 3, 1]} />
      <meshLambertMaterial color={color.slice(0,7)} transparent opacity={Number.parseInt(`0x${color.slice(-2)}`)/255} />
    </mesh>
  );
}

export interface PixelProps {
  color: string;
  style?: React.CSSProperties;
}

export function Pixel({color, style={}}: PixelProps) {
  return (
    <Canvas style={style} shadows>
      <fog attach="fog" args={["white", 0, 40]} />
      <ambientLight intensity={0.5} />
      <spotLight
       castShadow
        intensity={1}
        args={["white", 1, 100]}
        position={[0.5, 0.5, 5]}
        penumbra={0}
        angle={Math.PI/3}
        />
      <Box color={color} position={[0, 0, 0]} />
    </Canvas>
  );
}
