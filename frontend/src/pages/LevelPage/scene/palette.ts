import type { Biome } from '../types';

/** Один биом = набор приглушённых цветов + свет + погода. Никаких неоновых «детских» оттенков. */
export interface BiomePalette {
  soil: string;
  soilLight: string;
  soilDark: string;
  rock: string;
  rockDark: string;
  bark: string;
  foliage: string;
  foliageDark: string;
  metal: string;
  fog: string;
  sky: string;
  keyLight: string;
  keyIntensity: number;
  keyAzimuth: number;
  keyElevation: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  ambient: number;
  accent: string;
  accentIntensity: number;
  weather: 'spore' | 'sand' | 'snow' | 'dust' | 'ash' | 'ember';
  weatherDensity: number;
  roughness: number;
  exposure: number;
  puddle?: string;
  lava?: string;
}

const P = (p: BiomePalette) => p;

export const BIOME_PALETTES: Record<Biome, BiomePalette> = {
  forest: P({
    soil: '#5c4a35',
    soilLight: '#7d6345',
    soilDark: '#33291d',
    rock: '#797670',
    rockDark: '#4f4e49',
    bark: '#5f4a36',
    foliage: '#4c6b42',
    foliageDark: '#31502c',
    metal: '#9ba2a9',
    fog: '#4a534f',
    sky: '#39423f',
    keyLight: '#e2ebee',
    keyIntensity: 3.1,
    keyAzimuth: -0.7,
    keyElevation: 0.8,
    hemiSky: '#8b9c9f',
    hemiGround: '#4a4130',
    hemiIntensity: 0.6,
    ambient: 0.22,
    accent: '#9dcf86',
    accentIntensity: 0.35,
    weather: 'spore',
    weatherDensity: 90,
    roughness: 0.9,
    exposure: 1,
  }),
  desert: P({
    soil: '#9c7f52',
    soilLight: '#c2a06c',
    soilDark: '#6b5334',
    rock: '#b19b73',
    rockDark: '#7d6c50',
    bark: '#7d6242',
    foliage: '#908c53',
    foliageDark: '#6b6841',
    metal: '#b5a68f',
    fog: '#b09570',
    sky: '#8c7656',
    keyLight: '#ffdcaa',
    keyIntensity: 2.8,
    keyAzimuth: 0.9,
    keyElevation: 0.5,
    hemiSky: '#d6c096',
    hemiGround: '#7f6b4c',
    hemiIntensity: 0.6,
    ambient: 0.22,
    accent: '#f0c486',
    accentIntensity: 0.3,
    weather: 'sand',
    weatherDensity: 150,
    roughness: 0.94,
    exposure: 0.98,
  }),
  snow: P({
    soil: '#88959f',
    soilLight: '#b6c6d0',
    soilDark: '#5d6770',
    rock: '#808c95',
    rockDark: '#566068',
    bark: '#5b5a57',
    foliage: '#3b5d55',
    foliageDark: '#294640',
    metal: '#b8c3ca',
    fog: '#82909b',
    sky: '#5a6771',
    keyLight: '#dbeaf6',
    keyIntensity: 2.5,
    keyAzimuth: 0.4,
    keyElevation: 0.32,
    hemiSky: '#a3b9c6',
    hemiGround: '#4a545a',
    hemiIntensity: 0.7,
    ambient: 0.26,
    accent: '#b8e4f5',
    accentIntensity: 0.4,
    weather: 'snow',
    weatherDensity: 260,
    roughness: 0.66,
    exposure: 1,
  }),
  cave: P({
    soil: '#4f4a52',
    soilLight: '#6a6470',
    soilDark: '#332f37',
    rock: '#64646d',
    rockDark: '#424249',
    bark: '#4e4539',
    foliage: '#3c4d3d',
    foliageDark: '#2a372b',
    metal: '#8b9098',
    fog: '#2b2c32',
    sky: '#1d1e22',
    keyLight: '#cbb99c',
    keyIntensity: 1.5,
    keyAzimuth: -0.3,
    keyElevation: 1.05,
    hemiSky: '#5a5f68',
    hemiGround: '#2a2824',
    hemiIntensity: 0.4,
    ambient: 0.16,
    accent: '#f0b071',
    accentIntensity: 0.9,
    weather: 'dust',
    weatherDensity: 70,
    roughness: 0.96,
    exposure: 1.15,
    puddle: '#2c3138',
  }),
  swamp: P({
    soil: '#4c5236',
    soilLight: '#6b7448',
    soilDark: '#2f3524',
    rock: '#64645b',
    rockDark: '#454540',
    bark: '#514330',
    foliage: '#4f6745',
    foliageDark: '#33452c',
    metal: '#939b8a',
    fog: '#556052',
    sky: '#3c443a',
    keyLight: '#dbe1c2',
    keyIntensity: 2,
    keyAzimuth: 0.6,
    keyElevation: 0.9,
    hemiSky: '#8b9980',
    hemiGround: '#3a3e30',
    hemiIntensity: 0.55,
    ambient: 0.2,
    accent: '#9bd48c',
    accentIntensity: 0.45,
    weather: 'spore',
    weatherDensity: 130,
    roughness: 0.88,
    exposure: 1.05,
    puddle: '#37463c',
  }),
  volcano: P({
    soil: '#4b3934',
    soilLight: '#6b4c40',
    soilDark: '#2e211d',
    rock: '#675b54',
    rockDark: '#403733',
    bark: '#503e35',
    foliage: '#604738',
    foliageDark: '#403126',
    metal: '#9c8b81',
    fog: '#4c352d',
    sky: '#2f211d',
    keyLight: '#ffb079',
    keyIntensity: 1.5,
    keyAzimuth: 0.2,
    keyElevation: 1.1,
    hemiSky: '#7d5747',
    hemiGround: '#3a2b26',
    hemiIntensity: 0.35,
    ambient: 0.14,
    accent: '#ff7b3c',
    accentIntensity: 1.6,
    weather: 'ember',
    weatherDensity: 110,
    roughness: 0.92,
    exposure: 1.1,
    lava: '#ff6a28',
  }),
};

export const paletteOf = (biome: Biome | undefined): BiomePalette => BIOME_PALETTES[biome ?? 'forest'];

/** Клетка поля в метрах: держим доску в разумных единицах, чтобы тени и туман не «плыли». */
export const CELL = 1;
export const PLATEAU_H = 0.16;
export const GAP = 0.015;

/** Центр клетки в мировых координатах: строка 0 - дальняя, row height-1 - ближняя к камере. */
export const cellCenter = (x: number, y: number, width: number, height: number) => ({
  x: (x - (width - 1) / 2) * CELL,
  z: (y - (height - 1) / 2) * CELL,
});

export const cameraFraming = (width: number, height: number, aspect = 1.6) => {
  const span = Math.max(width, height);
  // 41° к горизонту: достаточно высоко, чтобы видеть карту, но не вид сверху.
  const pitch = 0.72;
  // Размер доски в кадре держит угол зрения, а не отлёт камеры: иначе на узкой панели модели мельчали.
  const half = span * Math.max(0.34, 0.52 / Math.max(0.4, aspect)) * 1.45;
  const maxFov = 62;
  const radius = Math.max(span * 1.34 + 3.6, half / Math.tan((maxFov * Math.PI) / 360));
  return {
    span,
    radius,
    fov: (2 * Math.atan(half / radius) * 180) / Math.PI,
    y: Math.sin(pitch) * radius + PLATEAU_H,
    z: Math.cos(pitch) * radius,
  };
};
