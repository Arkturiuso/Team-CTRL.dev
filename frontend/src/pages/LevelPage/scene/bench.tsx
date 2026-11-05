import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { advance, createRoot, useFrame, useThree } from '@react-three/fiber';
import { cameraFraming, paletteOf } from './palette';
import { CaptureBridge, SceneContent, type BoardSceneProps } from './Board3D';
import { EnemyModel, RobotModel } from './Models';
import { PortraitContent } from './BossPortrait';
import { makeSurface } from './procedural';
import type { Biome } from '../types';

/**
 * Отладочный стенд: тот же рендер сцены, но в canvas с явным размером.
 * Нужен потому, что в скрытой веб-view не работает rAF, и обычный Canvas
 * там никогда не смонтируется - проверить глазами можно только так.
 */
const WIDTH = 960;
const HEIGHT = 600;

type BenchRoot = ReturnType<typeof createRoot<HTMLCanvasElement>>;

let canvas: HTMLCanvasElement | null = null;
let root: BenchRoot | null = null;
let ready = false;
let lastScene: BoardSceneProps | null = null;
let patch: Partial<BoardSceneProps> | null = null;

const draw = () => {
  if (!root || !lastScene) return;
  root.render(
    <>
      <SceneContent scene={patch ? { ...lastScene, ...patch } : lastScene} preview />
      <CaptureBridge />
    </>,
  );
};

/** Подменить кадр сцены в стенде: эффекты боя длятся меньше секунды и поймать их вживую нельзя. */
export const patchBench = (next: Partial<BoardSceneProps> | null) => {
  patch = next;
  draw();
};

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__robocodeBench = patchBench;
}

export const attachBench = (scene: BoardSceneProps) => {
  lastScene = scene;
  const { map } = scene;
  const { span, y, z, fov } = cameraFraming(map.width, map.height);
  const palette = paletteOf(map.biome);
  const config = {
    size: { width: WIDTH, height: HEIGHT, top: 0, left: 0 },
    dpr: 1 as const,
    frameloop: 'never' as const,
    shadows: true as const,
    camera: { position: [0, y, z] as [number, number, number], fov, near: 0.1, far: span * 8 + 60 },
    gl: { antialias: true, preserveDrawingBuffer: true },
    onCreated: (state: { gl: THREE.WebGLRenderer }) => {
      state.gl.toneMapping = THREE.ACESFilmicToneMapping;
      state.gl.toneMappingExposure = palette.exposure;
    },
  };

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    root = createRoot(canvas);
  }

  if (ready) {
    root?.configure(config).catch(() => undefined);
    draw();
    return;
  }

  root?.configure(config).then(() => {
    ready = true;
    draw();
  });
};

/* ------------------------------------------------------- витрина одной модели */

const SHOW = 720;

interface ShowSpec {
  type?: string;
  avatar?: string;
  biome?: Biome;
  boss?: boolean;
  robot?: boolean;
  portrait?: boolean;
  yaw?: number;
  pitch?: number;
  zoom?: number;
}

let showCanvas: HTMLCanvasElement | null = null;
let showRoot: BenchRoot | null = null;
let showReady = false;
let showSpec: ShowSpec = { avatar: 'forest', boss: true, biome: 'forest' };

/** Кадр по габаритам модели: без него высота камеры фиксирована и босс заполняет весь экран. */
const ShowFrame = ({ target, yaw = 0.55, pitch = 0.24, zoom = 1 }: { target: React.RefObject<THREE.Group | null>; yaw?: number; pitch?: number; zoom?: number }) => {
  const camera = useThree((state) => state.camera);
  const fitted = useRef(false);
  useEffect(() => {
    fitted.current = false;
  }, [target, yaw, pitch, zoom]);

  // Подгонка в первом же кадре: geometry у моделей появляется позже эффекта, а сферический охват обрезал головы.
  useFrame(() => {
    if (fitted.current || !target.current) return;
    fitted.current = true;
    const box = new THREE.Box3().setFromObject(target.current);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const cam = camera as THREE.PerspectiveCamera;
    const halfV = THREE.MathUtils.degToRad(cam.fov) / 2;
    const halfH = Math.atan(Math.tan(halfV) * Math.min(1, cam.aspect));
    const distance = Math.max(size.y / 2 / Math.tan(halfV), Math.max(size.x, size.z) / 2 / Math.tan(halfH)) * 1.12 * zoom;
    const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    camera.position.copy(center).addScaledVector(dir, distance);
    camera.lookAt(center);
    cam.near = Math.max(0.05, distance / 60);
    cam.far = distance * 12;
    cam.updateProjectionMatrix();
  });
  return null;
};

const ShowStage = ({ spec }: { spec: ShowSpec }) => {
  const biome = spec.biome ?? 'forest';
  const palette = paletteOf(biome);
  const model = useRef<THREE.Group>(null);
  const ground = useMemo(() => makeSurface('ground', palette, 5, 3), [palette]);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: ground.map,
        normalMap: ground.normalMap,
        roughnessMap: ground.roughnessMap,
        roughness: 1,
        metalness: 0.02,
      }),
    [ground],
  );
  const key = useMemo(() => {
    const radius = 9;
    return [
      Math.cos(palette.keyAzimuth) * Math.cos(palette.keyElevation) * radius,
      Math.sin(palette.keyElevation) * radius + 2,
      Math.sin(palette.keyAzimuth) * Math.cos(palette.keyElevation) * radius,
    ] as [number, number, number];
  }, [palette]);
  return (
    <>
      <color attach="background" args={['#0e1011']} />
      {/* Свет витрины = свет сцены: иначе модель правится под кадр, которого в игре нет. */}
      <directionalLight
        position={key}
        intensity={palette.keyIntensity}
        color={palette.keyLight}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0007}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]} />
      <ambientLight intensity={palette.ambient} color={palette.hemiSky} />
      <directionalLight position={[-3, 1.6, -2.4]} intensity={0.55} color={palette.hemiSky} />
      {(biome === 'cave' || biome === 'volcano') && (
        <>
          <pointLight position={[-2.4, 1.5, 2.4]} intensity={6} distance={7} decay={2} color={palette.accent} />
          <pointLight position={[2.4, 1.2, -1.8]} intensity={5} distance={7} decay={2} color={palette.accent} />
        </>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={material} receiveShadow>
        <circleGeometry args={[4, 40]} />
      </mesh>
      <group ref={model}>
        {spec.robot ? (
          <RobotModel palette={palette} hasKey />
        ) : (
          <EnemyModel type={spec.type ?? 'golem'} biome={biome} avatar={spec.avatar} boss={spec.boss} palette={palette} />
        )}
      </group>
      <ShowFrame target={model} yaw={spec.yaw} pitch={spec.pitch} zoom={spec.zoom} />
    </>
  );
};

/* ------------------------------------------------------- портрет из панели */

const PortraitStage = ({ spec }: { spec: ShowSpec }) => (
  <>
    <color attach="background" args={['#12161d']} />
    <PortraitContent avatar={spec.avatar ?? (spec.biome ?? 'forest')} biome={spec.biome ?? 'forest'} yaw={spec.yaw} pitch={spec.pitch} />
  </>
);

const ShowBridge = () => {
  const state = useThree();
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__robocodeShow = {
      capture: async (name: string) => {
        advance(0.6, true, state);
        const canvas = state.gl.domElement as HTMLCanvasElement;
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) return 'no-blob';
        await fetch(`http://127.0.0.1:8791/save?name=${encodeURIComponent(name)}`, { method: 'POST', body: blob });
        return `${canvas.width}x${canvas.height} ${Math.round(blob.size / 1024)}kb`;
      },
    };
  }, [state]);
  return null;
};

const drawShow = () => {
  if (!showRoot) return;
  showRoot.render(
    <>
      {/* Портрет снимается тем же контентом, что стоит в панели: иначе проверка витрины описывает другую сцену. */}
      {/* Ключ по спецификации: иначе ShowFrame считает модель уже вписанной и следующий кадр снимает с прежним наездом. */}
      {showSpec.portrait ? (
        <PortraitStage key={`p${showSpec.avatar}${showSpec.biome}`} spec={showSpec} />
      ) : (
        <ShowStage key={`${showSpec.type}${showSpec.biome}${showSpec.boss}`} spec={showSpec} />
      )}
      <ShowBridge />
    </>,
  );
};

/** Одна модель крупным планом: в диораме босс занимает 60 пикселей и судить о нём нельзя. */
export const showModel = (spec: ShowSpec) => {
  showSpec = spec;
  const palette = paletteOf(spec.biome ?? 'forest');
  const config = {
    size: { width: SHOW, height: SHOW, top: 0, left: 0 },
    dpr: 1 as const,
    frameloop: 'never' as const,
    shadows: true as const,
    camera: { position: [1.9, 1.35, 2.4] as [number, number, number], fov: 30, near: 0.05, far: 40 },
    gl: { antialias: true, preserveDrawingBuffer: true },
    onCreated: (state: { gl: THREE.WebGLRenderer; camera: THREE.Camera }) => {
      state.gl.toneMapping = THREE.ACESFilmicToneMapping;
      state.gl.toneMappingExposure = palette.exposure;
      state.camera.lookAt(0, 0.8, 0);
    },
  };

  if (!showCanvas) {
    showCanvas = document.createElement('canvas');
    showCanvas.width = SHOW;
    showCanvas.height = SHOW;
    showRoot = createRoot(showCanvas);
  }

  if (showReady) {
    showRoot?.configure(config).catch(() => undefined);
    drawShow();
    return;
  }

  showRoot?.configure(config).then(() => {
    showReady = true;
    drawShow();
  });
};

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__robocodeShowModel = showModel;
}
