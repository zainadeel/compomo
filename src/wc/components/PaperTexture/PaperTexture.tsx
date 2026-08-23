import { Component, Element, Host, Prop, Watch, h } from '@stencil/core';
import {
  emptyPixel,
  getShaderColorFromString,
  getShaderNoiseTexture,
  paperTextureFragmentShader,
  ShaderFitOptions,
  ShaderMount,
  type ShaderMountUniforms,
} from '@paper-design/shaders';
import { DEFAULT_PAPER_TEXTURE_CONFIG, type PaperTextureConfig } from './paper-texture-types';

let emptyPixelPromise: Promise<HTMLImageElement> | undefined;
let noiseTexturePromise: Promise<HTMLImageElement> | undefined;

function waitForImage(image: HTMLImageElement): Promise<HTMLImageElement> {
  if (image.complete) {
    return image.naturalWidth > 0
      ? Promise.resolve(image)
      : Promise.reject(new Error(`Paper texture image failed to load: ${image.src}`));
  }

  return new Promise((resolve, reject) => {
    const onLoad = () => {
      cleanup();
      resolve(image);
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Paper texture image failed to load: ${image.src}`));
    };
    const cleanup = () => {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
    };

    image.addEventListener('load', onLoad, { once: true });
    image.addEventListener('error', onError, { once: true });
  });
}

function loadImage(source: HTMLImageElement | string | undefined): Promise<HTMLImageElement> {
  if (source instanceof HTMLImageElement) return waitForImage(source);

  const image = new Image();
  if (source && source !== emptyPixel) image.crossOrigin = 'anonymous';
  image.src = source || emptyPixel;
  return waitForImage(image);
}

function loadEmptyPixel(): Promise<HTMLImageElement> {
  emptyPixelPromise ??= loadImage(emptyPixel);
  return emptyPixelPromise;
}

function loadNoiseTexture(): Promise<HTMLImageElement> {
  noiseTexturePromise ??= Promise.resolve(getShaderNoiseTexture()).then(image => {
    if (!image) throw new Error('Paper texture noise texture is unavailable');
    return waitForImage(image);
  });
  return noiseTexturePromise;
}

@Component({
  tag: 'ds-paper-texture',
  styleUrl: 'PaperTexture.css',
  scoped: true,
})
export class PaperTexture {
  @Element() el!: HTMLElement;

  /** Paper Design shader parameters. Set as a JavaScript property. */
  @Prop() config: PaperTextureConfig = {};

  private shaderMount?: ShaderMount;
  private syncGeneration = 0;
  private hasLoaded = false;

  componentDidLoad() {
    this.hasLoaded = true;
    void this.syncShader();
  }

  connectedCallback() {
    if (this.hasLoaded) void this.syncShader();
  }

  disconnectedCallback() {
    this.syncGeneration += 1;
    this.disposeShader();
  }

  @Watch('config')
  onConfigChange() {
    if (this.hasLoaded) void this.syncShader();
  }

  private resolvedConfig(): Required<Omit<PaperTextureConfig, 'image'>> &
    Pick<PaperTextureConfig, 'image'> {
    return {
      ...DEFAULT_PAPER_TEXTURE_CONFIG,
      ...(this.config ?? {}),
    };
  }

  private async syncShader() {
    const generation = ++this.syncGeneration;
    const config = this.resolvedConfig();

    try {
      const [image, noiseTexture] = await Promise.all([
        loadImage(config.image).catch(() => loadEmptyPixel()),
        loadNoiseTexture(),
      ]);

      if (generation !== this.syncGeneration || !this.el.isConnected) return;

      const uniforms = this.buildUniforms(config, image, noiseTexture);
      const mountElement = this.el.querySelector<HTMLElement>('.paper-texture__mount');
      if (!mountElement) return;

      if (!this.shaderMount) {
        this.shaderMount = new ShaderMount(
          mountElement,
          paperTextureFragmentShader,
          uniforms,
          undefined,
          config.speed,
          config.frame,
          config.minPixelRatio,
          config.maxPixelCount,
          ['u_image']
        );
      } else {
        this.shaderMount.setUniforms(uniforms);
        this.shaderMount.setSpeed(config.speed);
        this.shaderMount.setFrame(config.frame);
        this.shaderMount.setMinPixelRatio(config.minPixelRatio);
        this.shaderMount.setMaxPixelCount(config.maxPixelCount);
      }

      this.el.removeAttribute('data-paper-texture-error');
    } catch (error) {
      if (generation !== this.syncGeneration) return;
      this.disposeShader();
      this.el.querySelector<HTMLElement>('.paper-texture__mount')?.replaceChildren();
      this.el.setAttribute('data-paper-texture-error', 'unavailable');
      console.warn('[ds-paper-texture] WebGL2 paper texture unavailable.', error);
    }
  }

  private buildUniforms(
    config: Required<Omit<PaperTextureConfig, 'image'>> & Pick<PaperTextureConfig, 'image'>,
    image: HTMLImageElement,
    noiseTexture: HTMLImageElement
  ): ShaderMountUniforms {
    return {
      u_image: image,
      u_noiseTexture: noiseTexture,
      u_colorFront: getShaderColorFromString(config.colorFront),
      u_colorBack: getShaderColorFromString(config.colorBack),
      u_contrast: config.contrast,
      u_roughness: config.roughness,
      u_fiber: config.fiber,
      u_fiberSize: config.fiberSize,
      u_crumples: config.crumples,
      u_crumpleSize: config.crumpleSize,
      u_foldCount: config.foldCount,
      u_folds: config.folds,
      u_fade: config.fade,
      u_drops: config.drops,
      u_seed: config.seed,
      u_fit: ShaderFitOptions[config.fit],
      u_scale: config.scale,
      u_rotation: config.rotation,
      u_offsetX: config.offsetX,
      u_offsetY: config.offsetY,
      u_originX: config.originX,
      u_originY: config.originY,
      u_worldWidth: config.worldWidth,
      u_worldHeight: config.worldHeight,
    };
  }

  private disposeShader() {
    this.shaderMount?.dispose();
    this.shaderMount = undefined;
  }

  render() {
    const config = this.resolvedConfig();
    return (
      <Host aria-hidden="true" style={{ '--ds-paper-texture-opacity': String(config.opacity) }}>
        <div class="paper-texture__mount" />
      </Host>
    );
  }
}
