/**
 * Watermark Engine Main Module
 *
 * This module is ported from gemini-watermark-remover by journey-ad (Jad),
 * itself based on GeminiWatermarkTool by AllenK (Kwyshell).
 * Original: https://github.com/journey-ad/gemini-watermark-remover/blob/main/src/core/watermarkEngine.js
 * License: MIT - Copyright (c) 2025 Jad; Copyright (c) 2024 AllenK (Kwyshell)
 * Full retained notice: see /THIRD_PARTY_NOTICES.md
 *
 * Coordinates watermark detection, alpha map calculation, and removal operations.
 */
import { calculateAlphaMap } from './alphaMap';
// Import watermark background capture images - Vite will bundle these
import BG_48_IMPORT from './assets/bg_48.png';
import BG_96_IMPORT from './assets/bg_96.png';
import BG_96_20260520_IMPORT from './assets/bg_96_20260520.png';
import { type WatermarkPosition, removeWatermark } from './blendModes';

// For content scripts, we need to use chrome.runtime.getURL to resolve asset paths
// The imported paths are relative to the bundle, which works in extension context
const getBgPath = (importedPath: string): string => {
  // If it's already a data URL, use it directly
  if (importedPath.startsWith('data:')) {
    return importedPath;
  }
  // For file paths, use chrome.runtime.getURL in extension context
  try {
    // Extract just the filename from the path
    const filename = importedPath.split('/').pop() || importedPath;
    return chrome.runtime.getURL(`assets/${filename}`);
  } catch {
    // Fallback to the original path
    return importedPath;
  }
};

export interface WatermarkConfig {
  logoSize: number;
  marginRight: number;
  marginBottom: number;
  alphaVariant?: WatermarkAlphaVariant;
}

export interface WatermarkInfo {
  size: number;
  position: WatermarkPosition;
  config: WatermarkConfig;
}

export type WatermarkAlphaVariant = '20260520';

type WatermarkLogoSize = 48 | 96;
type WatermarkAlphaMapKey = WatermarkLogoSize | `${WatermarkLogoSize}-${WatermarkAlphaVariant}`;
export interface WatermarkAnchorOption {
  config: WatermarkConfig;
  alphaMap: Float32Array;
}

const LEGACY_LARGE_IMAGE_MIN_EDGE = 1024;
const WATERMARK_ALPHA_MIN = 0.01;
const WATERMARK_ALPHA_HIGH = 0.35;
const WATERMARK_ALPHA_LOW = 0.08;
const WATERMARK_ANCHOR_SWITCH_EVIDENCE_GAP = 8;
const WATERMARK_MAX_REMOVAL_PASSES = 3;
const WATERMARK_REPEAT_EVIDENCE_MIN = 20;
const WATERMARK_REPEAT_LUMINANCE_DELTA_MIN = 12;
/** Negative high-vs-low alpha luminance delta beyond this ⇒ dark (black) logo. */
const WATERMARK_DARK_POLARITY_DELTA_MAX = -4;
/**
 * Newer Gemini marks are often weaker than the historical bg_* captures.
 * Try several gains (inspired by journey-ad/gemini-watermark-remover 2026 params)
 * and keep the residual-minimizing choice.
 */
const WATERMARK_ALPHA_GAIN_CANDIDATES = [0.25, 0.35, 0.45, 0.6, 0.75, 0.9, 1.0, 1.15] as const;
const WATERMARK_RESIDUAL_FILL_MIN_ALPHA = 0.02;
const WATERMARK_RESIDUAL_FILL_STRENGTH = 0.92;
const WATERMARK_RESIDUAL_FILL_PAD = 10;
const WATERMARK_RESIDUAL_FILL_EVIDENCE_MIN = 8;

interface WatermarkEvidence {
  score: number;
  luminanceDelta: number;
}

const LEGACY_96_WATERMARK_CONFIG: WatermarkConfig = {
  logoSize: 96,
  marginRight: 64,
  marginBottom: 64,
};

const LEGACY_48_WATERMARK_CONFIG: WatermarkConfig = {
  logoSize: 48,
  marginRight: 32,
  marginBottom: 32,
};

const NEW_96_WATERMARK_CONFIG: WatermarkConfig = {
  logoSize: 96,
  marginRight: 192,
  marginBottom: 192,
  alphaVariant: '20260520',
};

const NEW_48_WATERMARK_CONFIG: WatermarkConfig = {
  logoSize: 48,
  marginRight: 96,
  marginBottom: 96,
  alphaVariant: '20260520',
};

/** Recent Gemini 48px marks sit closer to the corner (~24px margins). */
const TIGHT_48_WATERMARK_CONFIG: WatermarkConfig = {
  logoSize: 48,
  marginRight: 24,
  marginBottom: 24,
};

const NEW_WATERMARK_CONFIG_BY_SIZE: Record<WatermarkLogoSize, WatermarkConfig> = {
  48: NEW_48_WATERMARK_CONFIG,
  96: NEW_96_WATERMARK_CONFIG,
};

const areSameWatermarkConfig = (a: WatermarkConfig, b: WatermarkConfig): boolean =>
  a.logoSize === b.logoSize &&
  a.marginRight === b.marginRight &&
  a.marginBottom === b.marginBottom &&
  a.alphaVariant === b.alphaVariant;

function isAnchorInBounds(
  imageWidth: number,
  imageHeight: number,
  config: WatermarkConfig,
): boolean {
  const position = calculateWatermarkPosition(imageWidth, imageHeight, config);
  return position.x >= 0 && position.y >= 0;
}

function collectAlternateAnchorConfigs(
  baseConfig: WatermarkConfig,
  imageWidth: number,
  imageHeight: number,
): WatermarkConfig[] {
  if (baseConfig.logoSize !== 48 && baseConfig.logoSize !== 96) return [];

  const candidates: WatermarkConfig[] =
    baseConfig.logoSize === 48
      ? [TIGHT_48_WATERMARK_CONFIG, NEW_WATERMARK_CONFIG_BY_SIZE[48]]
      : [NEW_WATERMARK_CONFIG_BY_SIZE[96]];

  return candidates.filter(
    (candidate) =>
      !areSameWatermarkConfig(baseConfig, candidate) &&
      isAnchorInBounds(imageWidth, imageHeight, candidate),
  );
}

/**
 * Detect watermark configuration based on image size
 * @param imageWidth - Image width
 * @param imageHeight - Image height
 * @returns Watermark configuration {logoSize, marginRight, marginBottom}
 */
export function detectWatermarkConfig(imageWidth: number, imageHeight: number): WatermarkConfig {
  if (imageWidth > LEGACY_LARGE_IMAGE_MIN_EDGE && imageHeight > LEGACY_LARGE_IMAGE_MIN_EDGE) {
    return { ...LEGACY_96_WATERMARK_CONFIG };
  }

  return { ...LEGACY_48_WATERMARK_CONFIG };
}

export function getWatermarkConfigOptions(
  imageWidth: number,
  imageHeight: number,
): WatermarkConfig[] {
  const baseConfig = detectWatermarkConfig(imageWidth, imageHeight);
  const alternates = collectAlternateAnchorConfigs(baseConfig, imageWidth, imageHeight);
  return [baseConfig, ...alternates];
}

/**
 * Calculate watermark position in image based on image size and watermark configuration
 * @param imageWidth - Image width
 * @param imageHeight - Image height
 * @param config - Watermark configuration {logoSize, marginRight, marginBottom}
 * @returns Watermark position {x, y, width, height}
 */
export function calculateWatermarkPosition(
  imageWidth: number,
  imageHeight: number,
  config: WatermarkConfig,
): WatermarkPosition {
  const { logoSize, marginRight, marginBottom } = config;

  return {
    x: imageWidth - marginRight - logoSize,
    y: imageHeight - marginBottom - logoSize,
    width: logoSize,
    height: logoSize,
  };
}

function calculateLuminance(data: Uint8ClampedArray, index: number): number {
  return data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
}

function measureWatermarkEvidenceDetails(
  imageData: ImageData,
  alphaMap: Float32Array,
  position: WatermarkPosition,
): WatermarkEvidence {
  let count = 0;
  let alphaSum = 0;
  let luminanceSum = 0;
  let alphaSquaredSum = 0;
  let luminanceSquaredSum = 0;
  let alphaLuminanceSum = 0;
  let highAlphaLuminanceSum = 0;
  let highAlphaCount = 0;
  let lowAlphaLuminanceSum = 0;
  let lowAlphaCount = 0;

  const { data, width: imageWidth, height: imageHeight } = imageData;
  const { x, y, width, height } = position;

  for (let row = 0; row < height; row++) {
    const pixelY = y + row;
    if (pixelY < 0 || pixelY >= imageHeight) continue;

    for (let col = 0; col < width; col++) {
      const alpha = alphaMap[row * width + col] ?? 0;
      if (alpha < WATERMARK_ALPHA_MIN) continue;

      const pixelX = x + col;
      if (pixelX < 0 || pixelX >= imageWidth) continue;

      const imageIndex = (pixelY * imageWidth + pixelX) * 4;
      const luminance = calculateLuminance(data, imageIndex);

      count++;
      alphaSum += alpha;
      luminanceSum += luminance;
      alphaSquaredSum += alpha * alpha;
      luminanceSquaredSum += luminance * luminance;
      alphaLuminanceSum += alpha * luminance;

      if (alpha > WATERMARK_ALPHA_HIGH) {
        highAlphaLuminanceSum += luminance;
        highAlphaCount++;
      } else if (alpha < WATERMARK_ALPHA_LOW) {
        lowAlphaLuminanceSum += luminance;
        lowAlphaCount++;
      }
    }
  }

  if (count === 0) {
    return { score: Number.NEGATIVE_INFINITY, luminanceDelta: Number.NEGATIVE_INFINITY };
  }

  const alphaMean = alphaSum / count;
  const luminanceMean = luminanceSum / count;
  const covariance = alphaLuminanceSum / count - alphaMean * luminanceMean;
  const alphaVariance = alphaSquaredSum / count - alphaMean * alphaMean;
  const luminanceVariance = luminanceSquaredSum / count - luminanceMean * luminanceMean;
  const correlation =
    covariance / (Math.sqrt(Math.max(alphaVariance, 0) * Math.max(luminanceVariance, 0)) + 1e-9);
  const luminanceDelta =
    highAlphaCount > 0 && lowAlphaCount > 0
      ? highAlphaLuminanceSum / highAlphaCount - lowAlphaLuminanceSum / lowAlphaCount
      : 0;

  return {
    score: correlation * 100 + luminanceDelta,
    luminanceDelta,
  };
}

function measureWatermarkEvidence(
  imageData: ImageData,
  alphaMap: Float32Array,
  position: WatermarkPosition,
): number {
  return measureWatermarkEvidenceDetails(imageData, alphaMap, position).score;
}

/** Absolute evidence strength so dark (negative-score) marks compete with light ones. */
function evidenceStrength(score: number): number {
  return Number.isFinite(score) ? Math.abs(score) : 0;
}

function detectLogoValue(evidence: WatermarkEvidence): number {
  return evidence.luminanceDelta <= WATERMARK_DARK_POLARITY_DELTA_MAX ? 0 : 255;
}

function isDarkLogo(logoValue: number): boolean {
  return logoValue < 128;
}

/** Either residual signal is still strong → treat as full-strength / stacked for gain choice. */
function looksLikeFullStrengthResidual(evidence: WatermarkEvidence, logoValue: number): boolean {
  if (isDarkLogo(logoValue)) {
    return (
      evidence.luminanceDelta <= -WATERMARK_REPEAT_LUMINANCE_DELTA_MIN ||
      evidence.score <= -WATERMARK_REPEAT_EVIDENCE_MIN
    );
  }
  return (
    evidence.luminanceDelta >= WATERMARK_REPEAT_LUMINANCE_DELTA_MIN ||
    evidence.score >= WATERMARK_REPEAT_EVIDENCE_MIN
  );
}

/** Both residual signals remain strong → another removal pass is warranted. */
function looksLikeStackedWatermark(evidence: WatermarkEvidence, logoValue: number): boolean {
  if (isDarkLogo(logoValue)) {
    return (
      evidence.luminanceDelta <= -WATERMARK_REPEAT_LUMINANCE_DELTA_MIN &&
      evidence.score <= -WATERMARK_REPEAT_EVIDENCE_MIN
    );
  }
  return (
    evidence.luminanceDelta >= WATERMARK_REPEAT_LUMINANCE_DELTA_MIN &&
    evidence.score >= WATERMARK_REPEAT_EVIDENCE_MIN
  );
}

function looksLikeGainMismatch(evidence: WatermarkEvidence, logoValue: number): boolean {
  if (isDarkLogo(logoValue)) {
    // Wrong/over gain on a dark mark pushes high-alpha pixels too bright.
    return (
      evidence.luminanceDelta > 4 ||
      (evidence.luminanceDelta > -WATERMARK_REPEAT_LUMINANCE_DELTA_MIN / 2 &&
        Math.abs(evidence.score) >= WATERMARK_RESIDUAL_FILL_EVIDENCE_MIN)
    );
  }
  return (
    evidence.luminanceDelta < -4 ||
    (evidence.luminanceDelta < WATERMARK_REPEAT_LUMINANCE_DELTA_MIN / 2 &&
      Math.abs(evidence.score) >= WATERMARK_RESIDUAL_FILL_EVIDENCE_MIN)
  );
}

export function chooseWatermarkAnchorOption(
  imageData: ImageData,
  options: WatermarkAnchorOption[],
): WatermarkAnchorOption {
  if (options.length <= 1) {
    return options[0];
  }

  const baseOption = options[0];
  const basePosition = calculateWatermarkPosition(
    imageData.width,
    imageData.height,
    baseOption.config,
  );
  const baseStrength = evidenceStrength(
    measureWatermarkEvidence(imageData, baseOption.alphaMap, basePosition),
  );

  let strongestOption = baseOption;
  let strongestStrength = baseStrength;

  for (const option of options.slice(1)) {
    const position = calculateWatermarkPosition(imageData.width, imageData.height, option.config);
    const strength = evidenceStrength(
      measureWatermarkEvidence(imageData, option.alphaMap, position),
    );
    if (strength > strongestStrength) {
      strongestOption = option;
      strongestStrength = strength;
    }
  }

  return strongestStrength - baseStrength >= WATERMARK_ANCHOR_SWITCH_EVIDENCE_GAP
    ? strongestOption
    : baseOption;
}

function cloneImageDataPixels(imageData: ImageData): Uint8ClampedArray {
  return new Uint8ClampedArray(imageData.data);
}

function scoreRemovalResidual(
  imageData: ImageData,
  alphaMap: Float32Array,
  position: WatermarkPosition,
  logoValue = 255,
): number {
  const evidence = measureWatermarkEvidenceDetails(imageData, alphaMap, position);
  // Prefer near-zero residual structure. Penalize polarity-wrong overshoot.
  const overshootPenalty = isDarkLogo(logoValue)
    ? evidence.luminanceDelta > 0
      ? Math.abs(evidence.luminanceDelta) * 1.5
      : 0
    : evidence.luminanceDelta < 0
      ? Math.abs(evidence.luminanceDelta) * 1.5
      : 0;
  return Math.abs(evidence.score) + overshootPenalty;
}

/**
 * Fill remaining watermark-shaped residue by sampling nearby clean pixels.
 * Newer Gemini marks embed a "Gemini" wordmark inside the star; reverse blending
 * alone often leaves that texture even when the solid-star alpha is correctly aligned.
 */
export function fillWatermarkResidual(
  imageData: ImageData,
  alphaMap: Float32Array,
  position: WatermarkPosition,
  options: { minAlpha?: number; strength?: number; pad?: number } = {},
): void {
  const minAlpha = options.minAlpha ?? WATERMARK_RESIDUAL_FILL_MIN_ALPHA;
  const strength = options.strength ?? WATERMARK_RESIDUAL_FILL_STRENGTH;
  const pad = options.pad ?? WATERMARK_RESIDUAL_FILL_PAD;
  const { x, y, width, height } = position;
  const { data, width: imageWidth, height: imageHeight } = imageData;

  const sampleX0 = Math.max(0, x - pad);
  const sampleY0 = Math.max(0, y - pad);
  const sampleX1 = Math.min(imageWidth, x + width + pad);
  const sampleY1 = Math.min(imageHeight, y + height + pad);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const alpha = Math.abs(alphaMap[row * width + col] ?? 0);
      if (alpha < minAlpha) continue;

      const pixelX = x + col;
      const pixelY = y + row;
      if (pixelX < 0 || pixelY < 0 || pixelX >= imageWidth || pixelY >= imageHeight) continue;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;

      // Prefer nearby pixels outside the watermark footprint (or very low alpha).
      for (let radius = 2; radius <= pad + 4 && count < 8; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
            const sx = pixelX + dx;
            const sy = pixelY + dy;
            if (sx < sampleX0 || sy < sampleY0 || sx >= sampleX1 || sy >= sampleY1) continue;

            const insideLogo =
              sx >= x && sx < x + width && sy >= y && sy < y + height;
            if (insideLogo) {
              const localRow = sy - y;
              const localCol = sx - x;
              const sampleAlpha = Math.abs(alphaMap[localRow * width + localCol] ?? 0);
              if (sampleAlpha >= minAlpha) continue;
            }

            const sampleIdx = (sy * imageWidth + sx) * 4;
            sumR += data[sampleIdx];
            sumG += data[sampleIdx + 1];
            sumB += data[sampleIdx + 2];
            count++;
            if (count >= 12) break;
          }
          if (count >= 12) break;
        }
      }

      if (count === 0) continue;

      const imgIdx = (pixelY * imageWidth + pixelX) * 4;
      const t = Math.min(1, strength);
      data[imgIdx] = Math.round(data[imgIdx] * (1 - t) + (sumR / count) * t);
      data[imgIdx + 1] = Math.round(data[imgIdx + 1] * (1 - t) + (sumG / count) * t);
      data[imgIdx + 2] = Math.round(data[imgIdx + 2] * (1 - t) + (sumB / count) * t);
    }
  }
}

function chooseAlphaGain(
  imageData: ImageData,
  alphaMap: Float32Array,
  position: WatermarkPosition,
  logoValue = 255,
): number {
  const original = cloneImageDataPixels(imageData);
  let bestGain = 1;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestPixels: Uint8ClampedArray | null = null;

  for (const gain of WATERMARK_ALPHA_GAIN_CANDIDATES) {
    imageData.data.set(original);
    removeWatermark(imageData, alphaMap, position, { alphaGain: gain, logoValue });
    const score = scoreRemovalResidual(imageData, alphaMap, position, logoValue);
    if (score < bestScore) {
      bestScore = score;
      bestGain = gain;
      bestPixels = cloneImageDataPixels(imageData);
    }
  }

  if (bestPixels) {
    imageData.data.set(bestPixels);
  } else {
    imageData.data.set(original);
  }

  return bestGain;
}

export interface RemoveWatermarkResidualOptions {
  /** Override logo channel value (default: detect from evidence; 255 light / 0 dark). */
  logoValue?: number;
}

export function removeWatermarkWithResidualCheck(
  imageData: ImageData,
  alphaMap: Float32Array,
  position: WatermarkPosition,
  options: RemoveWatermarkResidualOptions = {},
): number {
  const originalPixels = cloneImageDataPixels(imageData);
  const preEvidence = measureWatermarkEvidenceDetails(imageData, alphaMap, position);
  const logoValue =
    Number.isFinite(options.logoValue) && options.logoValue !== undefined
      ? options.logoValue
      : detectLogoValue(preEvidence);

  // Probe at capture strength first. A still-present residual usually means
  // stacked full-strength layers (keep gain=1 + multi-pass). Polarity-wrong
  // overshoot or a weak leftover means the live Gemini mark is softer.
  removeWatermark(imageData, alphaMap, position, { alphaGain: 1, logoValue });
  const probe = measureWatermarkEvidenceDetails(imageData, alphaMap, position);

  let alphaGain = 1;
  let passes = 1;

  const looksStackedOrFullStrength = looksLikeFullStrengthResidual(probe, logoValue);
  const looksOverdarkOrWeakMismatch = looksLikeGainMismatch(probe, logoValue);

  if (!looksStackedOrFullStrength && looksOverdarkOrWeakMismatch) {
    imageData.data.set(originalPixels);
    alphaGain = chooseAlphaGain(imageData, alphaMap, position, logoValue);
    passes = 1;
  }

  while (passes < WATERMARK_MAX_REMOVAL_PASSES) {
    const residualEvidence = measureWatermarkEvidenceDetails(imageData, alphaMap, position);
    if (!looksLikeStackedWatermark(residualEvidence, logoValue)) {
      break;
    }

    removeWatermark(imageData, alphaMap, position, { alphaGain, logoValue });
    passes++;
  }

  // Wordmark / texture left after reverse blending — fill from nearby clean pixels.
  // Dark / gradient corners can make luminanceDelta negative even when a ghost
  // remains, so gate only on residual structure score.
  const afterBlend = measureWatermarkEvidenceDetails(imageData, alphaMap, position);
  if (Math.abs(afterBlend.score) >= WATERMARK_RESIDUAL_FILL_EVIDENCE_MIN) {
    fillWatermarkResidual(imageData, alphaMap, position);
  }

  return passes;
}

interface BgCaptures {
  bg48: HTMLImageElement;
  bg96: HTMLImageElement;
  bg96_20260520: HTMLImageElement;
}

/**
 * Watermark engine class
 * Coordinates watermark detection, alpha map calculation, and removal operations
 */
export class WatermarkEngine {
  private bgCaptures: BgCaptures;
  private alphaMaps: Partial<Record<WatermarkAlphaMapKey, Float32Array>>;

  constructor(bgCaptures: BgCaptures) {
    this.bgCaptures = bgCaptures;
    this.alphaMaps = {};
  }

  static async create(): Promise<WatermarkEngine> {
    const bg48 = new Image();
    const bg96 = new Image();
    const bg96_20260520 = new Image();

    const bg48Path = getBgPath(BG_48_IMPORT);
    const bg96Path = getBgPath(BG_96_IMPORT);
    const bg96_20260520Path = getBgPath(BG_96_20260520_IMPORT);

    console.log('[Gemini Voyager] Loading watermark assets:', {
      bg48Path,
      bg96Path,
      bg96_20260520Path,
    });

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        bg48.onload = () => resolve();
        bg48.onerror = (e) =>
          reject(
            new Error(
              `Failed to load bg_48.png from ${bg48Path}: ${e instanceof Event ? 'Image load error' : e}`,
            ),
          );
        // Set crossOrigin before src to prevent canvas tainting in Firefox
        bg48.crossOrigin = 'anonymous';
        bg48.src = bg48Path;
      }),
      new Promise<void>((resolve, reject) => {
        bg96.onload = () => resolve();
        bg96.onerror = (e) =>
          reject(
            new Error(
              `Failed to load bg_96.png from ${bg96Path}: ${e instanceof Event ? 'Image load error' : e}`,
            ),
          );
        // Set crossOrigin before src to prevent canvas tainting in Firefox
        bg96.crossOrigin = 'anonymous';
        bg96.src = bg96Path;
      }),
      new Promise<void>((resolve, reject) => {
        bg96_20260520.onload = () => resolve();
        bg96_20260520.onerror = (e) =>
          reject(
            new Error(
              `Failed to load bg_96_20260520.png from ${bg96_20260520Path}: ${e instanceof Event ? 'Image load error' : e}`,
            ),
          );
        bg96_20260520.crossOrigin = 'anonymous';
        bg96_20260520.src = bg96_20260520Path;
      }),
    ]);

    return new WatermarkEngine({ bg48, bg96, bg96_20260520 });
  }

  /**
   * Get alpha map from background captured image based on watermark size/variant
   * @param size - Watermark size key
   * @returns Alpha map
   */
  async getAlphaMap(size: WatermarkAlphaMapKey): Promise<Float32Array> {
    // If cached, return directly
    if (this.alphaMaps[size]) {
      return this.alphaMaps[size];
    }

    // Select corresponding background capture based on watermark size
    const isVariant = typeof size === 'string';
    const logoSize = (isVariant ? Number(size.split('-')[0]) : size) as WatermarkLogoSize;
    const bgImage = isVariant
      ? this.bgCaptures.bg96_20260520
      : logoSize === 48
        ? this.bgCaptures.bg48
        : this.bgCaptures.bg96;

    // Create temporary canvas to extract ImageData
    const canvas = document.createElement('canvas');
    canvas.width = logoSize;
    canvas.height = logoSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2d context');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bgImage, 0, 0, logoSize, logoSize);

    const imageData = ctx.getImageData(0, 0, logoSize, logoSize);

    // Calculate alpha map
    const alphaMap = calculateAlphaMap(imageData);

    // Cache result
    this.alphaMaps[size] = alphaMap;

    return alphaMap;
  }

  private getAlphaMapKey(config: WatermarkConfig): WatermarkAlphaMapKey {
    const logoSize = config.logoSize === 48 ? 48 : 96;
    if (config.alphaVariant === '20260520') return `${logoSize}-20260520`;
    return logoSize;
  }

  /**
   * Remove watermark from image based on watermark size
   * @param image - Input image
   * @returns Processed canvas
   */
  async removeWatermarkFromImage(
    image: HTMLImageElement | HTMLCanvasElement,
  ): Promise<HTMLCanvasElement> {
    // Create canvas to process image
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2d context');
    }

    // Draw original image onto canvas
    ctx.drawImage(image, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const anchorOptions = await Promise.all(
      getWatermarkConfigOptions(canvas.width, canvas.height).map(async (config) => ({
        config,
        alphaMap: await this.getAlphaMap(this.getAlphaMapKey(config)),
      })),
    );
    const { config, alphaMap } = chooseWatermarkAnchorOption(imageData, anchorOptions);
    const position = calculateWatermarkPosition(canvas.width, canvas.height, config);
    const evidence = measureWatermarkEvidenceDetails(imageData, alphaMap, position);
    const logoValue = detectLogoValue(evidence);

    // Remove watermark from image data. Gemini can stack multiple transparent
    // marks after iterative image edits, so repeat only while the known alpha
    // pattern is still clearly present at the selected anchor.
    removeWatermarkWithResidualCheck(imageData, alphaMap, position, { logoValue });

    // Write processed image data back to canvas
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }

  /**
   * Get watermark information (for display)
   * @param imageWidth - Image width
   * @param imageHeight - Image height
   * @returns Watermark information {size, position, config}
   */
  getWatermarkInfo(imageWidth: number, imageHeight: number): WatermarkInfo {
    const config = detectWatermarkConfig(imageWidth, imageHeight);
    const position = calculateWatermarkPosition(imageWidth, imageHeight, config);

    return {
      size: config.logoSize,
      position: position,
      config: config,
    };
  }
}
