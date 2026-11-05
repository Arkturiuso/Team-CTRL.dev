import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Biome } from '../types';
import { paletteOf } from './palette';
import { EnemyModel } from './Models';

/**
 * Портрет босса = та же модель, что стоит на доске.
 * SVG-значок всегда можно нарисовать неверно; живой рендер расходится только вместе с моделью.
 */

/** Кадр по габаритам: модели разной высоты иначе впишутся в кадр разными масштабами. */
const Rig = ({ target, yaw, pitch }: { target: React.RefObject<THREE.Group | null>; yaw: number; pitch: number }) => {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const group = target.current;
    if (!group || !(camera instanceof THREE.PerspectiveCamera)) return;
    group.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const bounds = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(bounds.x, bounds.y, bounds.z) * 0.5;
    const aspect = size.width / Math.max(1, size.height);
    const halfV = THREE.MathUtils.degToRad(camera.fov) / 2;
    const halfH = Math.atan(Math.tan(halfV) * Math.min(1, aspect));
    const distance = radius / Math.sin(Math.min(halfV, halfH)) + radius;
    // Все боссы смотрят на -z, поэтому ноль разворота - фасад, а не затылок.
    const a = Math.PI + yaw;
    const dir = new THREE.Vector3(Math.sin(a) * Math.cos(pitch), Math.sin(pitch), Math.cos(a) * Math.cos(pitch));
    camera.position.copy(center).addScaledVector(dir, distance);
    camera.lookAt(center);
    camera.near = Math.max(0.05, distance / 60);
    camera.far = distance * 12;
    camera.updateProjectionMatrix();
  }, [target, yaw, pitch, camera, size]);

  return null;
};

const LightRig = ({ biome }: { biome: Biome }) => {
  const palette = paletteOf(biome);
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);

  const key = useMemo(() => {
    const radius = 9;
    return [
      Math.cos(palette.keyAzimuth) * Math.cos(palette.keyElevation) * radius,
      Math.sin(palette.keyElevation) * radius + 2,
      Math.sin(palette.keyAzimuth) * Math.cos(palette.keyElevation) * radius,
    ] as [number, number, number];
  }, [palette]);

  // Отражения из RoomEnvironment: без них броня и лёд читаются как чёрные силуэты.
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new RoomEnvironment();
    const target = pmrem.fromScene(envScene, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.55;
    scene.environmentRotation = new THREE.Euler(0, 0.6, 0);
    envScene.dispose?.();
    return () => {
      target.dispose();
      pmrem.dispose();
      if (scene.environment === target.texture) scene.environment = null;
    };
  }, [gl, scene]);

  return (
    <>
      <directionalLight position={key} intensity={palette.keyIntensity * 1.15} color={palette.keyLight} />
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity * 1.25]} />
      <ambientLight intensity={palette.ambient * 1.4} color={palette.hemiSky} />
      <directionalLight position={[-2.6, 1.4, -2]} intensity={0.75} color={palette.hemiSky} />
      {(biome === 'cave' || biome === 'volcano') && (
        <pointLight position={[0, 1.1, -1.6]} intensity={4} distance={6} decay={2} color={palette.accent} />
      )}
    </>
  );
};

export const PortraitContent = ({
  avatar,
  biome,
  yaw = 0.5,
  pitch = 0.16,
}: {
  avatar: string;
  biome: Biome;
  yaw?: number;
  pitch?: number;
}) => {
  const palette = paletteOf(biome);
  const model = useRef<THREE.Group>(null);
  return (
    <>
      <LightRig biome={biome} />
      <group ref={model}>
        <EnemyModel type="golem" biome={biome} avatar={avatar} boss palette={palette} />
      </group>
      <Rig target={model} yaw={yaw} pitch={pitch} />
    </>
  );
};

/**
 * Дыхание модели живёт в useFrame, но портрет — декорация.
 * Кадр нужен один: иначе два лишних canvas крутят 60 fps ради 66 пикселей.
 */
const Warmup = () => {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
    const handle = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(handle);
  }, [invalidate]);
  return null;
};

export const BossPortrait = (props: { avatar: string; biome: Biome; yaw?: number; pitch?: number }) => {
  const palette = paletteOf(props.biome);
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 2]}
      shadows={false}
      frameloop="demand"
      camera={{ position: [1.6, 1.2, 2.2], fov: 30, near: 0.05, far: 40 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = palette.exposure;
        gl.setClearAlpha(0);
      }}
    >
      <PortraitContent {...props} />
      <Warmup />
    </Canvas>
  );
};
