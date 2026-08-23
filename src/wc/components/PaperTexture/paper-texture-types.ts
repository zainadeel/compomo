export type PaperTextureFit = 'none' | 'contain' | 'cover';

/**
 * Literal parameters forwarded to Paper Design's paper texture shader.
 * Colors intentionally remain ordinary CSS color strings; they are not token
 * references and are parsed once into shader RGBA uniforms.
 */
export interface PaperTextureConfig {
  image?: HTMLImageElement | string;
  colorFront?: string;
  colorBack?: string;
  contrast?: number;
  roughness?: number;
  fiber?: number;
  fiberSize?: number;
  crumples?: number;
  crumpleSize?: number;
  folds?: number;
  foldCount?: number;
  fade?: number;
  drops?: number;
  seed?: number;
  fit?: PaperTextureFit;
  scale?: number;
  rotation?: number;
  originX?: number;
  originY?: number;
  offsetX?: number;
  offsetY?: number;
  worldWidth?: number;
  worldHeight?: number;
  speed?: number;
  frame?: number;
  minPixelRatio?: number;
  maxPixelCount?: number;
  /** CSS opacity applied after the shader has rendered. */
  opacity?: number;
}

export const DEFAULT_PAPER_TEXTURE_CONFIG: Required<Omit<PaperTextureConfig, 'image'>> = {
  colorFront: '#b8b8b8',
  colorBack: '#ffffff',
  contrast: 0.3,
  roughness: 0.4,
  fiber: 0.3,
  fiberSize: 0.2,
  crumples: 0.3,
  crumpleSize: 0.35,
  folds: 0.65,
  foldCount: 5,
  fade: 0,
  drops: 0.2,
  seed: 5.8,
  fit: 'cover',
  scale: 0.6,
  rotation: 0,
  originX: 0.5,
  originY: 0.5,
  offsetX: 0,
  offsetY: 0,
  worldWidth: 0,
  worldHeight: 0,
  speed: 0,
  frame: 0,
  minPixelRatio: 2,
  maxPixelCount: 1920 * 1080 * 4,
  opacity: 1,
};
