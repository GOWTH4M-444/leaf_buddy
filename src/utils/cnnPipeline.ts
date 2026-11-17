import {
  CLASS_DISPLAY_NAMES,
  DiseaseClassId,
  MODEL_OVERALL_ACCURACY,
  SAMPLE_LEAVES,
  SampleLeaf,
} from '../data/leaves';

export type CnnStageView = 'original' | 'edges' | 'colors' | 'patterns';

export interface LeafPixelStats {
  totalLeafPixels: number;
  healthyGreenRatio: number;
  darkSpotRatio: number;
  whitePowderRatio: number;
  yellowRustRatio: number;
  edgeDensity: number;
}

export interface LeafAnalysisResult {
  predictedClass: DiseaseClassId;
  statusLabel: string;
  isHealthy: boolean;
  headline: string;
  kidFriendlySummary: string;
  confidence: number;
  modelAccuracy: number;
  classBreakdown: Array<{
    id: DiseaseClassId;
    label: string;
    percent: number;
  }>;
  whatCnnNoticed: {
    edges: string;
    colors: string;
    patterns: string;
  };
  careSteps: string[];
  pixelStats?: LeafPixelStats;
  isCustomUpload: boolean;
}

const ORDERED_CLASSES: DiseaseClassId[] = [
  'healthy',
  'early_blight',
  'powdery_mildew',
  'yellow_rust',
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Extracts leaf color ratios and Sobel edge density directly from an RGBA buffer.
 * Ignores warm cream paper background pixels so analysis focuses on the leaf blade.
 */
export function computePixelStatsFromRgba(
  data: Uint8ClampedArray,
  width: number,
  height: number
): LeafPixelStats {
  if (width < 3 || height < 3 || data.length < width * height * 4) {
    return {
      totalLeafPixels: 0,
      healthyGreenRatio: 1,
      darkSpotRatio: 0,
      whitePowderRatio: 0,
      yellowRustRatio: 0,
      edgeDensity: 0,
    };
  }

  let leafPixels = 0;
  let healthyGreen = 0;
  let darkSpots = 0;
  let whitePowder = 0;
  let yellowRust = 0;
  let strongEdges = 0;

  const luminanceAt = (x: number, y: number): number => {
    const idx = (y * width + x) * 4;
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  };

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a < 20) continue;

      const maxCh = Math.max(r, g, b);
      const minCh = Math.min(r, g, b);
      const saturation = maxCh === 0 ? 0 : (maxCh - minCh) / maxCh;
      const brightness = (r + g + b) / 3;

      // Warm cream paper background has warm beige tone (r - b >= 12) and high brightness
      const isPaperBackground =
        r > 195 &&
        g > 185 &&
        b > 150 &&
        r - b >= 12 &&
        saturation < 0.25 &&
        g <= r + 4;
      if (isPaperBackground) continue;

      leafPixels++;

      const gx =
        -luminanceAt(x - 1, y - 1) +
        luminanceAt(x + 1, y - 1) -
        2 * luminanceAt(x - 1, y) +
        2 * luminanceAt(x + 1, y) -
        luminanceAt(x - 1, y + 1) +
        luminanceAt(x + 1, y + 1);
      const gy =
        -luminanceAt(x - 1, y - 1) -
        2 * luminanceAt(x, y - 1) -
        luminanceAt(x + 1, y - 1) +
        luminanceAt(x - 1, y + 1) +
        2 * luminanceAt(x, y + 1) +
        luminanceAt(x + 1, y + 1);
      const grad = Math.sqrt(gx * gx + gy * gy);
      if (grad > 68) {
        strongEdges++;
      }

      // Check symptom color signatures inside the leaf
      if (brightness > 172 && saturation < 0.24) {
        // Chalky white powdery patch on leaf
        whitePowder++;
      } else if (r > 125 && g > 95 && b < 95 && r >= g - 12) {
        // Golden yellow or orange rust speckles
        yellowRust++;
      } else if (brightness < 78 && g < 88 && r < 95) {
        // Dark brown or necrotic leaf spot center
        darkSpots++;
      } else if (g > r && g >= b && saturation > 0.16) {
        healthyGreen++;
      }
    }
  }

  if (leafPixels === 0) {
    return {
      totalLeafPixels: 0,
      healthyGreenRatio: 0.85,
      darkSpotRatio: 0.05,
      whitePowderRatio: 0.05,
      yellowRustRatio: 0.05,
      edgeDensity: 0.12,
    };
  }

  return {
    totalLeafPixels: leafPixels,
    healthyGreenRatio: clamp(healthyGreen / leafPixels, 0, 1),
    darkSpotRatio: clamp(darkSpots / leafPixels, 0, 1),
    whitePowderRatio: clamp(whitePowder / leafPixels, 0, 1),
    yellowRustRatio: clamp(yellowRust / leafPixels, 0, 1),
    edgeDensity: clamp(strongEdges / leafPixels, 0, 1),
  };
}

/**
 * Classifies a custom uploaded leaf from extracted pixel features using
 * normalized softmax scoring across our 4 classes.
 */
export function analyzePixelFeatures(
  stats: LeafPixelStats,
  isCustomUpload = true
): LeafAnalysisResult {
  const rawLogits: Record<DiseaseClassId, number> = {
    healthy:
      stats.healthyGreenRatio * 4.4 -
      stats.darkSpotRatio * 4.8 -
      stats.whitePowderRatio * 5.2 -
      stats.yellowRustRatio * 5.0 +
      0.6,
    early_blight:
      stats.darkSpotRatio * 10.5 + stats.edgeDensity * 1.6 + stats.yellowRustRatio * 1.1,
    powdery_mildew: stats.whitePowderRatio * 11.2 + stats.healthyGreenRatio * 0.6,
    yellow_rust: stats.yellowRustRatio * 10.8 + stats.edgeDensity * 1.3,
  };

  const maxLogit = Math.max(...Object.values(rawLogits));
  const expScores: Record<DiseaseClassId, number> = {
    healthy: Math.exp(rawLogits.healthy - maxLogit),
    early_blight: Math.exp(rawLogits.early_blight - maxLogit),
    powdery_mildew: Math.exp(rawLogits.powdery_mildew - maxLogit),
    yellow_rust: Math.exp(rawLogits.yellow_rust - maxLogit),
  };

  const expSum =
    expScores.healthy +
    expScores.early_blight +
    expScores.powdery_mildew +
    expScores.yellow_rust;

  const rawPercents: Record<DiseaseClassId, number> = {
    healthy: (expScores.healthy / expSum) * 100,
    early_blight: (expScores.early_blight / expSum) * 100,
    powdery_mildew: (expScores.powdery_mildew / expSum) * 100,
    yellow_rust: (expScores.yellow_rust / expSum) * 100,
  };

  // Round to 1 decimal while ensuring total adds up cleanly to 100.0
  const sortedIds = [...ORDERED_CLASSES].sort(
    (a, b) => rawPercents[b] - rawPercents[a]
  );
  const predictedClass = sortedIds[0];

  const rounded: Record<DiseaseClassId, number> = {
    healthy: roundOneDecimal(rawPercents.healthy),
    early_blight: roundOneDecimal(rawPercents.early_blight),
    powdery_mildew: roundOneDecimal(rawPercents.powdery_mildew),
    yellow_rust: roundOneDecimal(rawPercents.yellow_rust),
  };
  const sumRounded =
    rounded.healthy +
    rounded.early_blight +
    rounded.powdery_mildew +
    rounded.yellow_rust;
  rounded[predictedClass] = roundOneDecimal(rounded[predictedClass] + (100 - sumRounded));

  const template =
    SAMPLE_LEAVES.find((leaf) => leaf.id === predictedClass) ?? SAMPLE_LEAVES[0];

  const classBreakdown = sortedIds.map((id) => ({
    id,
    label: CLASS_DISPLAY_NAMES[id],
    percent: rounded[id],
  }));

  return {
    predictedClass,
    statusLabel: template.statusLabel,
    isHealthy: template.isHealthy,
    headline: template.headline,
    kidFriendlySummary: template.kidFriendlySummary,
    confidence: rounded[predictedClass],
    modelAccuracy: MODEL_OVERALL_ACCURACY,
    classBreakdown,
    whatCnnNoticed: { ...template.whatCnnNoticed },
    careSteps: [...template.careSteps],
    pixelStats: stats,
    isCustomUpload,
  };
}

/**
 * Builds the complete diagnosis payload for one of the 4 pre-loaded sample leaves,
 * optionally blending measured pixel stats from the canvas.
 */
export function buildSampleLeafAnalysis(
  sample: SampleLeaf,
  pixelStats?: LeafPixelStats
): LeafAnalysisResult {
  const sortedIds = [...ORDERED_CLASSES].sort(
    (a, b) => sample.classBreakdown[b] - sample.classBreakdown[a]
  );

  return {
    predictedClass: sample.id,
    statusLabel: sample.statusLabel,
    isHealthy: sample.isHealthy,
    headline: sample.headline,
    kidFriendlySummary: sample.kidFriendlySummary,
    confidence: sample.defaultConfidence,
    modelAccuracy: MODEL_OVERALL_ACCURACY,
    classBreakdown: sortedIds.map((id) => ({
      id,
      label: CLASS_DISPLAY_NAMES[id],
      percent: sample.classBreakdown[id],
    })),
    whatCnnNoticed: { ...sample.whatCnnNoticed },
    careSteps: [...sample.careSteps],
    pixelStats,
    isCustomUpload: false,
  };
}

/**
 * Generates an RGBA pixel visualization for one of the 3 CNN stages:
 * - 'edges': Sobel botanical outline and vein detector on warm cream parchment
 * - 'colors': Highlights non-green spot colors (brown, white powder, yellow rust)
 * - 'patterns': Draws a calm 6x6 CNN receptive-field scanning grid over spotted regions
 */
export function applyStageFilterToRgba(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  stage: CnnStageView
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(source.length);
  if (stage === 'original' || width < 3 || height < 3) {
    out.set(source);
    return out;
  }

  const lumAt = (x: number, y: number): number => {
    const cx = clamp(x, 0, width - 1);
    const cy = clamp(y, 0, height - 1);
    const i = (cy * width + cx) * 4;
    return 0.299 * source[i] + 0.587 * source[i + 1] + 0.114 * source[i + 2];
  };

  const cellW = Math.max(12, Math.floor(width / 8));
  const cellH = Math.max(12, Math.floor(height / 6));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = source[i];
      const g = source[i + 1];
      const b = source[i + 2];
      const a = source[i + 3];

      if (stage === 'edges') {
        const gx =
          -lumAt(x - 1, y - 1) +
          lumAt(x + 1, y - 1) -
          2 * lumAt(x - 1, y) +
          2 * lumAt(x + 1, y) -
          lumAt(x - 1, y + 1) +
          lumAt(x + 1, y + 1);
        const gy =
          -lumAt(x - 1, y - 1) -
          2 * lumAt(x, y - 1) -
          lumAt(x + 1, y - 1) +
          lumAt(x - 1, y + 1) +
          2 * lumAt(x, y + 1) +
          lumAt(x + 1, y + 1);
        const edge = clamp(Math.sqrt(gx * gx + gy * gy) / 260, 0, 1);

        // Blend warm cream paper (#F9F7F2) toward deep sage ink (#2E5A44) on edges
        out[i] = Math.round(249 * (1 - edge) + 46 * edge);
        out[i + 1] = Math.round(247 * (1 - edge) + 90 * edge);
        out[i + 2] = Math.round(242 * (1 - edge) + 68 * edge);
        out[i + 3] = a;
      } else if (stage === 'colors') {
        const maxCh = Math.max(r, g, b);
        const minCh = Math.min(r, g, b);
        const sat = maxCh === 0 ? 0 : (maxCh - minCh) / maxCh;
        const bright = (r + g + b) / 3;
        const isPaper =
          r > 195 &&
          g > 185 &&
          b > 150 &&
          r - b >= 12 &&
          sat < 0.25 &&
          g <= r + 4;

        const isSymptom =
          !isPaper &&
          ((bright > 172 && sat < 0.24) ||
            (r > 125 && g > 95 && b < 95 && r >= g - 12) ||
            (bright < 78 && g < 88 && r < 95));

        if (isSymptom) {
          // Highlight changed-color spots in warm terracotta (#C96A4B)
          out[i] = 201;
          out[i + 1] = 106;
          out[i + 2] = 75;
          out[i + 3] = a;
        } else if (isPaper) {
          out[i] = 249;
          out[i + 1] = 247;
          out[i + 2] = 242;
          out[i + 3] = a;
        } else {
          // Soft calm sage tint for normal green areas
          out[i] = Math.round(r * 0.45 + 58 * 0.55);
          out[i + 1] = Math.round(g * 0.45 + 107 * 0.55);
          out[i + 2] = Math.round(b * 0.45 + 82 * 0.55);
          out[i + 3] = a;
        }
      } else {
        // 'patterns': Receptive-field magnifying grid lines + subtle contrast
        const onGrid = x % cellW === 0 || y % cellH === 0;
        if (onGrid) {
          out[i] = 58;
          out[i + 1] = 107;
          out[i + 2] = 82;
          out[i + 3] = a;
        } else {
          out[i] = Math.round(r * 0.88 + 249 * 0.12);
          out[i + 1] = Math.round(g * 0.88 + 247 * 0.12);
          out[i + 2] = Math.round(b * 0.88 + 242 * 0.12);
          out[i + 3] = a;
        }
      }
    }
  }

  return out;
}

export function getNextTourStep(
  current: number,
  direction: 'next' | 'back',
  total: number
): number {
  if (total <= 0) return 0;
  if (direction === 'next') {
    return Math.min(total - 1, current + 1);
  }
  return Math.max(0, current - 1);
}
