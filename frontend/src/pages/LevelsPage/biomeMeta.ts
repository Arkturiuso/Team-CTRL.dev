export interface BiomeMeta {
  label: string;
  accent: string;
  floor: string;
  floorAlt: string;
  banner: string;
}

export const BIOME_META: Record<string, BiomeMeta> = {
  forest: {
    label: 'Лес',
    accent: '#3f9142',
    floor: '#d6ebc8',
    floorAlt: '#c8e2b8',
    banner: 'linear-gradient(135deg, #2f6e33, #7fbf68)',
  },
  snow: {
    label: 'Снега',
    accent: '#5b8db8',
    floor: '#e9f2fb',
    floorAlt: '#d9e7f5',
    banner: 'linear-gradient(135deg, #6f9cc4, #dbeaf8)',
  },
  desert: {
    label: 'Пустыня',
    accent: '#b98643',
    floor: '#f4e1b9',
    floorAlt: '#ecd3a1',
    banner: 'linear-gradient(135deg, #c88d2f, #f2d28a)',
  },
  cave: {
    label: 'Пещера',
    accent: '#5b6472',
    floor: '#d9dde4',
    floorAlt: '#c9ced8',
    banner: 'linear-gradient(135deg, #414956, #98a2b3)',
  },
  swamp: {
    label: 'Болото',
    accent: '#65753f',
    floor: '#dfe6c8',
    floorAlt: '#d0d9b2',
    banner: 'linear-gradient(135deg, #4f5f34, #9fb172)',
  },
  volcano: {
    label: 'Вулкан',
    accent: '#b6512e',
    floor: '#ecd9d0',
    floorAlt: '#e2c6ba',
    banner: 'linear-gradient(135deg, #6f2a1b, #d0603a)',
  },
};

export const biomeMeta = (biome?: string | null): BiomeMeta =>
  BIOME_META[biome ?? 'forest'] ?? BIOME_META.forest;
