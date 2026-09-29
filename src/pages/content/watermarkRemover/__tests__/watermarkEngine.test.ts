import { describe, expect, it } from 'vitest';

import {
  type WatermarkAnchorOption,
  type WatermarkConfig,
  calculateWatermarkPosition,
  chooseWatermarkAnchorOption,
  detectWatermarkConfig,
  fillWatermarkResidual,
  getWatermarkConfigOptions,
  removeWatermarkWithResidualCheck,
} from '../watermarkEngine';
import { removeWatermark } from '../blendModes';

const TEST_ALPHA_MAP = Float32Array.from([
  0.02, 0.15, 0.15, 0.02, 0.15, 0.8, 0.8, 0.15, 0.15, 0.8, 0.8, 0.15, 0.02, 0.15, 0.15, 0.02,
]);

function createImageDataWithWatermark(
  config: WatermarkConfig,
  layers = 1,
  logoValue = 255,
): ImageData {
  const width = 24;
  const height = 24;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 80;
    data[i + 1] = 80;
    data[i + 2] = 80;
    data[i + 3] = 255;
  }

  const position = calculateWatermarkPosition(width, height, config);
  for (let row = 0; row < position.height; row++) {
    for (let col = 0; col < position.width; col++) {
      const alpha = TEST_ALPHA_MAP[row * position.width + col];
      let value = 80;
      for (let layer = 0; layer < layers; layer++) {
        value = Math.round(logoValue * alpha + value * (1 - alpha));
      }
      const index = ((position.y + row) * width + position.x + col) * 4;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
    }
  }

  return { data, width, height } as ImageData;
}

function createTestAnchorOption(config: WatermarkConfig): WatermarkAnchorOption {
  return {
    config,
    alphaMap: TEST_ALPHA_MAP,
  };
}

function expectWatermarkAreaNearBase(imageData: ImageData, config: WatermarkConfig): void {
  const position = calculateWatermarkPosition(imageData.width, imageData.height, config);

  for (let row = 0; row < position.height; row++) {
    for (let col = 0; col < position.width; col++) {
      const alpha = TEST_ALPHA_MAP[row * position.width + col];
      if (alpha < 0.08) continue;

      const index = ((position.y + row) * imageData.width + position.x + col) * 4;
      expect(Math.abs(imageData.data[index] - 80)).toBeLessThanOrEqual(1);
      expect(Math.abs(imageData.data[index + 1] - 80)).toBeLessThanOrEqual(1);
      expect(Math.abs(imageData.data[index + 2] - 80)).toBeLessThanOrEqual(1);
    }
  }
}

describe('watermarkEngine config detection', () => {
  it('keeps historical detection as the default for full-size 2816x1536 outputs', () => {
    expect(detectWatermarkConfig(2816, 1536)).toEqual({
      logoSize: 96,
      marginRight: 64,
      marginBottom: 64,
    });
  });

  it('offers old and May 2026 anchors for full-size 2816x1536 outputs', () => {
    const options = getWatermarkConfigOptions(2816, 1536);

    expect(options).toEqual([
      {
        logoSize: 96,
        marginRight: 64,
        marginBottom: 64,
      },
      {
        logoSize: 96,
        marginRight: 192,
        marginBottom: 192,
        alphaVariant: '20260520',
      },
    ]);
    expect(calculateWatermarkPosition(2816, 1536, options[1])).toEqual({
      x: 2528,
      y: 1248,
      width: 96,
      height: 96,
    });
  });

  it('offers tight, old, and May 2026 anchors for half-size 16:9 preview images', () => {
    const options = getWatermarkConfigOptions(1408, 768);

    expect(options).toEqual([
      {
        logoSize: 48,
        marginRight: 32,
        marginBottom: 32,
      },
      {
        logoSize: 48,
        marginRight: 24,
        marginBottom: 24,
      },
      {
        logoSize: 48,
        marginRight: 96,
        marginBottom: 96,
        alphaVariant: '20260520',
      },
    ]);
    expect(calculateWatermarkPosition(1408, 768, options[1])).toEqual({
      x: 1336,
      y: 696,
      width: 48,
      height: 48,
    });
    expect(calculateWatermarkPosition(1408, 768, options[2])).toEqual({
      x: 1264,
      y: 624,
      width: 48,
      height: 48,
    });
  });

  it('offers tight and moved anchors for square outputs', () => {
    expect(getWatermarkConfigOptions(1024, 1024)).toEqual([
      {
        logoSize: 48,
        marginRight: 32,
        marginBottom: 32,
      },
      {
        logoSize: 48,
        marginRight: 24,
        marginBottom: 24,
      },
      {
        logoSize: 48,
        marginRight: 96,
        marginBottom: 96,
        alphaVariant: '20260520',
      },
    ]);
  });

  it('keeps the historical anchor first for other old-rule dimensions', () => {
    expect(getWatermarkConfigOptions(1376, 768)[0]).toEqual({
      logoSize: 48,
      marginRight: 32,
      marginBottom: 32,
    });
    expect(getWatermarkConfigOptions(2708, 1536)[0]).toEqual({
      logoSize: 96,
      marginRight: 64,
      marginBottom: 64,
    });
  });

  it('selects the historical anchor when the actual pixels still contain the old watermark', () => {
    const oldConfig = { logoSize: 4, marginRight: 1, marginBottom: 1 };
    const newConfig = {
      logoSize: 4,
      marginRight: 9,
      marginBottom: 9,
      alphaVariant: '20260520' as const,
    };
    const imageData = createImageDataWithWatermark(oldConfig);

    expect(
      chooseWatermarkAnchorOption(imageData, [
        createTestAnchorOption(oldConfig),
        createTestAnchorOption(newConfig),
      ]).config,
    ).toBe(oldConfig);
  });

  it('selects the May 2026 anchor when the actual pixels contain the moved watermark', () => {
    const oldConfig = { logoSize: 4, marginRight: 1, marginBottom: 1 };
    const newConfig = {
      logoSize: 4,
      marginRight: 9,
      marginBottom: 9,
      alphaVariant: '20260520' as const,
    };
    const imageData = createImageDataWithWatermark(newConfig);

    expect(
      chooseWatermarkAnchorOption(imageData, [
        createTestAnchorOption(oldConfig),
        createTestAnchorOption(newConfig),
      ]).config,
    ).toBe(newConfig);
  });

  it('selects the tight margin-24 anchor for a dark watermark at that position', () => {
    const legacyConfig = { logoSize: 4, marginRight: 1, marginBottom: 1 };
    const tightConfig = { logoSize: 4, marginRight: 0, marginBottom: 0 };
    const imageData = createImageDataWithWatermark(tightConfig, 1, 0);

    expect(
      chooseWatermarkAnchorOption(imageData, [
        createTestAnchorOption(legacyConfig),
        createTestAnchorOption(tightConfig),
      ]).config,
    ).toBe(tightConfig);
  });

  it('removes a single transparent watermark layer in one pass', () => {
    const config = { logoSize: 4, marginRight: 1, marginBottom: 1 };
    const imageData = createImageDataWithWatermark(config);
    const position = calculateWatermarkPosition(imageData.width, imageData.height, config);

    const passes = removeWatermarkWithResidualCheck(imageData, TEST_ALPHA_MAP, position);

    expect(passes).toBe(1);
    expectWatermarkAreaNearBase(imageData, config);
  });

  it('repeats removal while a stacked watermark layer remains', () => {
    const config = { logoSize: 4, marginRight: 1, marginBottom: 1 };
    const imageData = createImageDataWithWatermark(config, 2);
    const position = calculateWatermarkPosition(imageData.width, imageData.height, config);

    const passes = removeWatermarkWithResidualCheck(imageData, TEST_ALPHA_MAP, position);

    expect(passes).toBe(2);
    expectWatermarkAreaNearBase(imageData, config);
  });

  it('fills residual watermark texture from nearby clean pixels', () => {
    const config = { logoSize: 4, marginRight: 1, marginBottom: 1 };
    const imageData = createImageDataWithWatermark(config);
    const position = calculateWatermarkPosition(imageData.width, imageData.height, config);

    // Leave a bright residue in the high-alpha core after a too-weak reverse pass.
    removeWatermark(imageData, TEST_ALPHA_MAP, position, { alphaGain: 0.35 });
    fillWatermarkResidual(imageData, TEST_ALPHA_MAP, position, {
      minAlpha: 0.08,
      strength: 1,
      pad: 4,
    });

    for (let row = 0; row < position.height; row++) {
      for (let col = 0; col < position.width; col++) {
        const alpha = TEST_ALPHA_MAP[row * position.width + col];
        if (alpha < 0.35) continue;
        const index = ((position.y + row) * imageData.width + position.x + col) * 4;
        expect(Math.abs(imageData.data[index] - 80)).toBeLessThanOrEqual(8);
      }
    }
  });

  it('removes a dark-polarity watermark with logoValue 0', () => {
    const config = { logoSize: 4, marginRight: 1, marginBottom: 1 };
    const imageData = createImageDataWithWatermark(config, 1, 0);
    const position = calculateWatermarkPosition(imageData.width, imageData.height, config);

    const passes = removeWatermarkWithResidualCheck(imageData, TEST_ALPHA_MAP, position, {
      logoValue: 0,
    });

    expect(passes).toBe(1);
    expectWatermarkAreaNearBase(imageData, config);
  });

  it('calibrates alpha gain so a weaker watermark is not over-subtracted into black', () => {
    const config = { logoSize: 4, marginRight: 1, marginBottom: 1 };
    const width = 24;
    const height = 24;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 80;
      data[i + 1] = 80;
      data[i + 2] = 80;
      data[i + 3] = 255;
    }

    const position = calculateWatermarkPosition(width, height, config);
    // Simulate a weaker Gemini mark (~45% of capture strength).
    for (let row = 0; row < position.height; row++) {
      for (let col = 0; col < position.width; col++) {
        const alpha = TEST_ALPHA_MAP[row * position.width + col] * 0.45;
        const value = Math.round(255 * alpha + 80 * (1 - alpha));
        const index = ((position.y + row) * width + position.x + col) * 4;
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
      }
    }

    const imageData = { data, width, height } as ImageData;
    removeWatermarkWithResidualCheck(imageData, TEST_ALPHA_MAP, position);

    for (let row = 0; row < position.height; row++) {
      for (let col = 0; col < position.width; col++) {
        const alpha = TEST_ALPHA_MAP[row * position.width + col];
        if (alpha < 0.35) continue;
        const index = ((position.y + row) * width + position.x + col) * 4;
        // Must not collapse toward black (classic over-gain failure mode).
        expect(imageData.data[index]).toBeGreaterThan(40);
        expect(Math.abs(imageData.data[index] - 80)).toBeLessThanOrEqual(25);
      }
    }
  });
});
