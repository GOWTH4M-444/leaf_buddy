import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzePixelFeatures,
  applyStageFilterToRgba,
  buildSampleLeafAnalysis,
  computePixelStatsFromRgba,
  getNextTourStep,
} from './cnnPipeline';
import { SAMPLE_LEAVES } from '../data/leaves';

function makeSolidBuffer(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number
): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = 255;
  }
  return buf;
}

test('computePixelStatsFromRgba recognizes healthy green leaf pixels', () => {
  const buf = makeSolidBuffer(20, 20, 48, 130, 56);
  const stats = computePixelStatsFromRgba(buf, 20, 20);
  assert.ok(stats.totalLeafPixels > 0);
  assert.ok(stats.healthyGreenRatio > 0.9);
  assert.equal(stats.darkSpotRatio, 0);
  assert.equal(stats.whitePowderRatio, 0);
  assert.equal(stats.yellowRustRatio, 0);

  const result = analyzePixelFeatures(stats);
  assert.equal(result.predictedClass, 'healthy');
  assert.equal(result.isHealthy, true);
});

test('analyzePixelFeatures classifies dark spots, white powder, and yellow rust accurately', () => {
  const darkBuf = makeSolidBuffer(20, 20, 45, 38, 30);
  const darkStats = computePixelStatsFromRgba(darkBuf, 20, 20);
  assert.equal(analyzePixelFeatures(darkStats).predictedClass, 'early_blight');

  const whiteBuf = makeSolidBuffer(20, 20, 210, 215, 210);
  const whiteStats = computePixelStatsFromRgba(whiteBuf, 20, 20);
  assert.equal(analyzePixelFeatures(whiteStats).predictedClass, 'powdery_mildew');

  const rustBuf = makeSolidBuffer(20, 20, 215, 165, 35);
  const rustStats = computePixelStatsFromRgba(rustBuf, 20, 20);
  assert.equal(analyzePixelFeatures(rustStats).predictedClass, 'yellow_rust');
});

test('analyzePixelFeatures classBreakdown percentages sum to 100.0', () => {
  const result = analyzePixelFeatures({
    totalLeafPixels: 500,
    healthyGreenRatio: 0.55,
    darkSpotRatio: 0.25,
    whitePowderRatio: 0.1,
    yellowRustRatio: 0.1,
    edgeDensity: 0.2,
  });

  const sum = result.classBreakdown.reduce((acc, item) => acc + item.percent, 0);
  assert.ok(Math.abs(sum - 100) < 0.2, `Expected sum near 100, got ${sum}`);
  assert.equal(result.confidence, result.classBreakdown[0].percent);
});

test('buildSampleLeafAnalysis preserves healthy and diseased metadata for all 4 sample leaves', () => {
  assert.equal(SAMPLE_LEAVES.length, 4);
  for (const leaf of SAMPLE_LEAVES) {
    const analysis = buildSampleLeafAnalysis(leaf);
    assert.equal(analysis.predictedClass, leaf.id);
    assert.equal(analysis.isCustomUpload, false);
    assert.equal(analysis.modelAccuracy, 96.4);
    assert.equal(analysis.careSteps.length, 3);
  }
});

test('applyStageFilterToRgba preserves pixel buffer length across all 4 stages', () => {
  const buf = makeSolidBuffer(24, 24, 60, 130, 70);
  for (const stage of ['original', 'edges', 'colors', 'patterns'] as const) {
    const filtered = applyStageFilterToRgba(buf, 24, 24, stage);
    assert.equal(filtered.length, buf.length);
  }
});

test('getNextTourStep clamps cleanly at boundaries', () => {
  assert.equal(getNextTourStep(0, 'back', 4), 0);
  assert.equal(getNextTourStep(0, 'next', 4), 1);
  assert.equal(getNextTourStep(3, 'next', 4), 3);
  assert.equal(getNextTourStep(2, 'back', 4), 1);
});
