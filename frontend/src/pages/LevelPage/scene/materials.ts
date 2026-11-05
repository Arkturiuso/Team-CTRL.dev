import * as THREE from 'three';
import type { BiomePalette } from './palette';
import { makeShadowBlob, makeSurface } from './procedural';

export type SurfaceKind = 'ground' | 'bark' | 'rock' | 'metal' | 'ice' | 'magma' | 'cloth' | 'foliage';

export interface MatOpts {
  tint?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  flatShading?: boolean;
  normalScale?: number;
  /** Для тонких листов (перепонки крыльев): с одной стороной крыло исчезает при взгляде снизу. */
  doubleSided?: boolean;
}

const cache = new Map<string, THREE.MeshStandardMaterial>();
let blob: THREE.Texture | null = null;

const DEFAULT_METAL: Record<SurfaceKind, number> = {
  ground: 0.02,
  bark: 0,
  rock: 0.04,
  metal: 0.82,
  ice: 0.1,
  magma: 0.12,
  cloth: 0,
  foliage: 0,
};

const DEFAULT_ROUGH: Record<SurfaceKind, number> = {
  ground: 0.95,
  bark: 0.98,
  rock: 0.9,
  metal: 0.38,
  ice: 0.22,
  magma: 0.85,
  cloth: 0.92,
  foliage: 0.88,
};

/** Материалы кешу по ключу: одна поверхность на все однотипные предметы, а не новый материал на mesh. */
export const surfaceMaterial = (kind: SurfaceKind, palette: BiomePalette, opts: MatOpts = {}) => {
  const key = `${kind}|${palette.soil}|${palette.rock}|${palette.metal}|${JSON.stringify(opts)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const repeat = kind === 'ground' ? 0.45 : 1;
  const surface = makeSurface(kind, palette, kind === 'ground' ? 3 : 11, repeat);
  const material = new THREE.MeshStandardMaterial({
    map: surface.map,
    normalMap: surface.normalMap,
    roughnessMap: surface.roughnessMap,
    emissiveMap: surface.emissiveMap,
    color: opts.tint ?? '#ffffff',
    metalness: opts.metalness ?? DEFAULT_METAL[kind],
    roughness: opts.roughness ?? DEFAULT_ROUGH[kind],
    emissive: opts.emissive ?? (surface.emissiveMap ? '#ff6a2c' : '#000000'),
    emissiveIntensity: opts.emissiveIntensity ?? (surface.emissiveMap ? 1.3 : 0),
    transparent: opts.opacity !== undefined && opts.opacity < 1,
    opacity: opts.opacity ?? 1,
    flatShading: opts.flatShading ?? false,
    side: opts.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    normalScale: new THREE.Vector2(opts.normalScale ?? 1.2, opts.normalScale ?? 1.2),
  });
  cache.set(key, material);
  return material;
};

const plainCache = new Map<string, THREE.MeshStandardMaterial>();

export const plainMaterial = (color: string, opts: MatOpts = {}) => {
  const key = `plain|${color}|${JSON.stringify(opts)}`;
  const cached = plainCache.get(key);
  if (cached) return cached;
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: opts.metalness ?? 0,
    roughness: opts.roughness ?? 0.8,
    emissive: opts.emissive ?? '#000000',
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.opacity !== undefined && opts.opacity < 1,
    opacity: opts.opacity ?? 1,
    flatShading: opts.flatShading ?? false,
    side: opts.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  });
  plainCache.set(key, material);
  return material;
};

/** Мягкое тёмное пятно под предметом: без него модель «парит» над плиткой. */
export const contactShadow = (opacity: number) => {
  if (!blob) blob = makeShadowBlob();
  return new THREE.MeshBasicMaterial({ map: blob, transparent: true, opacity, depthWrite: false });
};

const shadowCache = new Map<number, THREE.MeshBasicMaterial>();

export const shadowMaterial = (opacity: number) => {
  const key = Math.round(opacity * 100);
  const cached = shadowCache.get(key);
  if (cached) return cached;
  const material = contactShadow(opacity);
  shadowCache.set(key, material);
  return material;
};
