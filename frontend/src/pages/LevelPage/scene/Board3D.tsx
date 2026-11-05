import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, advance, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as THREE from 'three';
import type { LevelMapData } from '../types';
import { cameraFraming, paletteOf } from './palette';
import { makeSkyGradient } from './procedural';
import { Backdrop, Terrain, Weather } from './Terrain';
import { Entities, type EntitiesProps } from './Entities';
import { FxLayer } from './Fx';

/** Рендерим кадр по требованию и сохраняем PNG: так сцену видно глазами даже без живого rAF. */
export const CaptureBridge = () => {
  const state = useThree();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as Record<string, unknown>;
    let seconds = 0;
    const bridge = {
      render: (time?: number) => {
        seconds = time ?? seconds + 1 / 30;
        advance(seconds, true, state);
      },
      /** Камера вручную: драг мышью без живого rAF не доходит до OrbitControls, потому что тот обновляется в цикле. */
      pose: (azimuth: number, polar: number) => {
        const controls = state.controls as unknown as ControlsLike | null;
        const target = controls?.target ?? new THREE.Vector3();
        const radius = state.camera.position.distanceTo(target);
        state.camera.position.set(
          target.x + radius * Math.sin(polar) * Math.sin(azimuth),
          target.y + radius * Math.cos(polar),
          target.z + radius * Math.sin(polar) * Math.cos(azimuth),
        );
        state.camera.lookAt(target);
        controls?.update();
      },
      capture: async (name: string, time?: number) => {
        seconds = time ?? seconds + 1 / 30;
        advance(seconds, true, state);
        const canvas = state.gl.domElement as HTMLCanvasElement;
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) return 'no-blob';
        await fetch(`http://127.0.0.1:8791/save?name=${encodeURIComponent(name)}`, { method: 'POST', body: blob });
        return `${canvas.width}x${canvas.height} ${Math.round(blob.size / 1024)}kb`;
      },
    };
    w.__robocode3d = bridge;
    return () => {
      if (w.__robocode3d === bridge) delete w.__robocode3d;
    };
  }, [state]);
  return null;
};

type Framing = ReturnType<typeof cameraFraming>;

/** Туман привязан к фактическому расстоянию камеры: при другом соотношении сторон CameraFit отлетает назад и доска тонула в сером. */
const Fog = ({ map }: { map: LevelMapData }) => {
  const palette = paletteOf(map.biome);
  const { span } = cameraFraming(map.width, map.height);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const fog = useMemo(() => new THREE.Fog(palette.fog, 0, 1), [palette]);

  useEffect(() => {
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene, fog]);

  useFrame(() => {
    const distance = camera.position.length();
    fog.near = distance - span * 0.4;
    fog.far = distance + span * 2.6;
  });

  return null;
};

const Atmosphere = ({ map, framing }: { map: LevelMapData; framing: Framing }) => {
  const palette = paletteOf(map.biome);
  const { span } = framing;
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);

  const sky = useMemo(() => makeSkyGradient(palette.sky, palette.fog, palette.soilDark), [palette]);

  // Комнатная карта окружения даёт металлу отражения; без него броня робота чёрная.
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new RoomEnvironment();
    const target = pmrem.fromScene(envScene, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.5;
    scene.environmentRotation = new THREE.Euler(0, 0.6, 0);
    envScene.dispose?.();
    return () => {
      target.dispose();
      pmrem.dispose();
      if (scene.environment === target.texture) scene.environment = null;
    };
  }, [gl, scene]);

  useEffect(() => () => sky.dispose(), [sky]);

  return (
    <>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[span * 4 + 30, 32, 16]} />
        <meshBasicMaterial map={sky} side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
      {/* Противосвет: тени не должны быть провалом в чёрный. */}
      <directionalLight position={[-span * 0.4, span * 0.35, -span * 0.6]} intensity={0.55} color={palette.hemiSky} />
    </>
  );
};

const KeyLight = ({ map }: { map: LevelMapData }) => {
  const palette = paletteOf(map.biome);
  const { span } = cameraFraming(map.width, map.height);
  const position = useMemo<[number, number, number]>(() => {
    const radius = span * 1.5 + 8;
    const el = palette.keyElevation;
    return [
      Math.cos(palette.keyAzimuth) * Math.cos(el) * radius,
      Math.sin(el) * radius + 2,
      Math.sin(palette.keyAzimuth) * Math.cos(el) * radius,
    ];
  }, [palette, span]);

  return (
    <>
      <directionalLight
        position={position}
        intensity={palette.keyIntensity}
        color={palette.keyLight}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0007}
        shadow-normalBias={0.03}
        shadow-camera-near={0.5}
        shadow-camera-far={span * 4 + 24}
        shadow-camera-left={-span * 1.15}
        shadow-camera-right={span * 1.15}
        shadow-camera-top={span * 1.15}
        shadow-camera-bottom={-span * 1.15}
      />
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]} />
      <ambientLight intensity={palette.ambient} color={palette.hemiSky} />
      {(map.biome === 'cave' || map.biome === 'volcano') && (
        <>
          <pointLight
            position={[-span * 0.42, 1.5, span * 0.42]}
            intensity={6}
            distance={span * 0.9}
            decay={2}
            color={palette.accent}
          />
          <pointLight position={[span * 0.42, 1.2, -span * 0.3]} intensity={5} distance={span * 0.9} decay={2} color={palette.accent} />
        </>
      )}
    </>
  );
};

interface ControlsLike {
  update: () => void;
  minDistance: number;
  maxDistance: number;
  target: THREE.Vector3;
}

/** Доска должна влезать в кадр при любом соотношении сторон панели, а не только в широком стенде. */
const CameraFit = ({ framing }: { framing: Framing }) => {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const controls = useThree((state) => state.controls) as unknown as ControlsLike | null;

  useEffect(() => {
    camera.position.set(0, framing.y, framing.z);
    camera.fov = framing.fov;
    camera.near = 0.1;
    camera.far = framing.span * 8 + 60;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (controls) {
      controls.minDistance = framing.radius * 0.35;
      controls.maxDistance = framing.radius * 2.8;
      controls.update();
    }
  }, [camera, controls, framing]);

  return null;
};

export interface BoardSceneProps extends EntitiesProps {
  occupied: Set<string>;
}

/** Всё, что живёт внутри WebGL-корня: и в окне приложения, и в отладочном стенде. */
export const SceneContent = ({ scene, showWeather = true, preview = false }: { scene: BoardSceneProps; showWeather?: boolean; preview?: boolean }) => {
  const { map, occupied } = scene;
  const palette = paletteOf(map.biome);
  const aspect = useThree((state) => state.size.width / Math.max(1, state.size.height));
  const framing = useMemo(() => cameraFraming(map.width, map.height, aspect), [map.width, map.height, aspect]);

  return (
    <>
      <color attach="background" args={[palette.sky]} />
      <Fog map={map} />
      <CameraFit framing={framing} />
      <Atmosphere map={map} framing={framing} />
      <KeyLight map={map} />
      <Suspense fallback={null}>
        <Terrain map={map} occupied={occupied} />
        <Backdrop map={map} />
        <Entities {...scene} />
        <FxLayer
          map={map}
          bossFx={scene.bossFx}
          bossAim={scene.bossAim}
          bossMark={scene.bossMark}
          bossRaging={scene.bossRaging}
          hazards={scene.hazards}
        />
        {showWeather && <Weather map={map} />}
      </Suspense>
      {!preview && (
        <OrbitControls
          makeDefault
          target={[0, 0.2, 0]}
          enablePan={false}
          minPolarAngle={0.1}
          // 1.3, а не горизонт: ниже камера оказывается выше пояса силуэтов, и лес вставает стеной между взглядом и доской.
          maxPolarAngle={1.3}
          dampingFactor={0.08}
        />
      )}
    </>
  );
};

type Board3DProps = BoardSceneProps;

export const Board3D = (props: Board3DProps) => {
  const { map } = props;
  const palette = paletteOf(map.biome);
  const { span, y, z, fov } = cameraFraming(map.width, map.height);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, y, z], fov, near: 0.1, far: span * 8 + 60 }}
      gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = palette.exposure;
      }}
    >
      <SceneContent scene={props} />
      <CaptureBridge />
    </Canvas>
  );
};
