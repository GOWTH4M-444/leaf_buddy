import { useEffect, useRef, useState } from 'react';
import { Eye, Grid, Palette, ScanSearch } from 'lucide-react';
import {
  CLASS_BENCHMARK_ACCURACY,
  MODEL_OVERALL_ACCURACY,
  MODEL_TEST_IMAGE_COUNT,
  SAMPLE_LEAVES,
} from '../data/leaves';
import { applyStageFilterToRgba, CnnStageView } from '../utils/cnnPipeline';

const STAGES: Array<{
  id: CnnStageView;
  stepNumber: string;
  title: string;
  shortLabel: string;
  kidExplanation: string;
  whyItMatters: string;
  icon: typeof ScanSearch;
}> = [
  {
    id: 'edges',
    stepNumber: 'Stage 1',
    title: 'Finding Leaf Edges & Veins',
    shortLabel: '1. Leaf Edges',
    kidExplanation:
      'First, Leaf Buddy slides a tiny magnifying window over the photo to trace outlines—like drawing the leaf’s silhouette and veins with a dark green pencil.',
    whyItMatters:
      'Tracing edges helps the computer ignore the background table or paper and focus only on the leaf shape and any sharp spot rings.',
    icon: ScanSearch,
  },
  {
    id: 'colors',
    stepNumber: 'Stage 2',
    title: 'Spotting Color Changes',
    shortLabel: '2. Color Changes',
    kidExplanation:
      'Next, it checks the colors inside the leaf outline. Healthy leaf green stays calm sage, while unusual dark brown, chalky white, or rusty yellow stands out in bright terracotta.',
    whyItMatters:
      'Plant troubles often change a leaf’s color before anything else—white flour dust points to mildew, while golden dots point to rust.',
    icon: Palette,
  },
  {
    id: 'patterns',
    stepNumber: 'Stage 3',
    title: 'Matching Spot Patterns',
    shortLabel: '3. Matching Patterns',
    kidExplanation:
      'Finally, the CNN looks at the whole picture divided into tiny squares and compares those shapes to 5,400 practice leaf photos it studied earlier.',
    whyItMatters:
      'Combining edge shapes and color clues lets Leaf Buddy tell apart big target-like spots from tiny scattered speckles.',
    icon: Grid,
  },
];

export function HowItWorksView() {
  const [activeStage, setActiveStage] = useState<CnnStageView>('edges');
  const [sampleIndex, setSampleIndex] = useState(1); // Start with Early Blight so edges/colors are dramatic
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);

  const selectedSample = SAMPLE_LEAVES[sampleIndex];
  const currentStageInfo =
    STAGES.find((stage) => stage.id === activeStage) ?? STAGES[0];

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = 400;
      const h = 300;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const filtered = applyStageFilterToRgba(imageData.data, w, h, activeStage);
      imageData.data.set(filtered);
      ctx.putImageData(imageData, 0, 0);
      setRenderFailed(false);
    };
    img.onerror = () => {
      if (!cancelled) setRenderFailed(true);
    };
    img.src = selectedSample.imageUrl;

    return () => {
      cancelled = true;
    };
  }, [activeStage, selectedSample.imageUrl]);

  return (
    <section className="animate-leaf-fade mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-[#3A6B52]">
          Inside the Leaf Detective
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-[#243028] [text-wrap:balance] sm:text-4xl">
          How a CNN Looks at a Leaf
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#5A665E]">
          A Convolutional Neural Network (or CNN) is a computer pattern-finder.
          Imagine sliding a tiny magnifying glass across a photo one square at a
          time to spot clues in three easy steps.
        </p>
      </div>

      {/* Interactive 3-Stage Explorer */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-[#E5E0D5] bg-white p-5 sm:p-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[#243028]">
              Live Filter Explorer
            </span>
            <div className="flex items-center gap-1.5">
              {SAMPLE_LEAVES.map((leaf, idx) => (
                <button
                  key={leaf.id}
                  type="button"
                  onClick={() => setSampleIndex(idx)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    idx === sampleIndex
                      ? 'bg-[#3A6B52] text-white'
                      : 'bg-[#F9F7F2] text-[#5A665E] hover:text-[#243028]'
                  }`}
                >
                  {leaf.shortName}
                </button>
              ))}
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E5E0D5] bg-[#F9F7F2]">
            {renderFailed ? (
              <img
                src={selectedSample.imageUrl}
                alt={selectedSample.imageAlt}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <canvas
                ref={canvasRef}
                data-testid="how-it-works-canvas"
                aria-label={`${selectedSample.name} viewed through ${currentStageInfo.title}`}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <p className="text-xs leading-relaxed text-[#5A665E]">
            Showing: <strong className="text-[#243028]">{selectedSample.name}</strong>{' '}
            · View: <strong className="text-[#243028]">{currentStageInfo.title}</strong>
          </p>
        </div>

        <div className="flex flex-col justify-between space-y-5 lg:col-span-6">
          <div className="space-y-2.5">
            {STAGES.map((stage) => {
              const Icon = stage.icon;
              const isActive = activeStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStage(stage.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52] ${
                    isActive
                      ? 'border-[#3A6B52] bg-[#EEF4F0]'
                      : 'border-[#E5E0D5] bg-[#F9F7F2]/60 hover:bg-[#F9F7F2]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isActive
                          ? 'bg-[#3A6B52] text-white'
                          : 'bg-white text-[#3A6B52] border border-[#E5E0D5]'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#5A665E]">
                        <span>{stage.stepNumber}</span>
                      </div>
                      <h2 className="mt-0.5 font-display text-base font-bold text-[#243028]">
                        {stage.title}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-[#5A665E]">
                        {stage.kidExplanation}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-[#E5E0D5] bg-[#F9F7F2] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#243028]">
              <Eye className="h-4 w-4 text-[#C96A4B]" aria-hidden="true" />
              <span>Why this clue helps</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-[#5A665E]">
              {currentStageInfo.whyItMatters}
            </p>
          </div>
        </div>
      </div>

      {/* Model Test Accuracy Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#E5E0D5] bg-white p-6 lg:col-span-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E5E0D5] pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[#243028]">
                Practice Test Accuracy
              </h2>
              <p className="mt-1 text-sm text-[#5A665E]">
                How often Leaf Buddy got the right answer on{' '}
                <span className="font-semibold text-[#243028] tabular-nums">
                  {MODEL_TEST_IMAGE_COUNT.toLocaleString()}
                </span>{' '}
                brand-new test photos it had never seen before.
              </p>
            </div>
            <div className="text-right">
              <span className="font-display text-3xl font-extrabold text-[#3A6B52] tabular-nums">
                {MODEL_OVERALL_ACCURACY}%
              </span>
              <p className="text-xs font-medium text-[#5A665E]">Overall score</p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-[#E5E0D5]">
            {CLASS_BENCHMARK_ACCURACY.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-1 items-center gap-3 py-3 sm:grid-cols-12"
              >
                <div className="sm:col-span-5">
                  <p className="text-sm font-semibold text-[#243028]">
                    {row.label}
                  </p>
                  <p className="text-xs text-[#5A665E]">{row.clue}</p>
                </div>
                <div className="sm:col-span-5">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F9F7F2] border border-[#E5E0D5]">
                    <div
                      className="h-full rounded-full bg-[#3A6B52]"
                      style={{ width: `${row.accuracy}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm sm:col-span-2 sm:justify-end">
                  <span className="text-xs text-[#5A665E] sm:hidden tabular-nums">
                    {row.testedCount.toLocaleString()} photos
                  </span>
                  <span className="font-semibold text-[#243028] tabular-nums">
                    {row.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E0D5] bg-white p-6 lg:col-span-4">
          <h2 className="font-display text-xl font-bold text-[#243028]">
            When Can It Be Tricked?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5A665E]">
            Even a smart leaf detective is not right 100% of the time. Leaf
            Buddy can get confused if:
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#243028]">
            <li className="border-t border-[#E5E0D5] pt-3">
              <strong className="text-[#C96A4B]">The photo is blurry:</strong>{' '}
              Fuzzy pixels hide tiny spot rings and rust dots.
            </li>
            <li className="border-t border-[#E5E0D5] pt-3">
              <strong className="text-[#C96A4B]">Deep shadows cover the leaf:</strong>{' '}
              Dark shade can look like dark brown leaf spots.
            </li>
            <li className="border-t border-[#E5E0D5] pt-3">
              <strong className="text-[#C96A4B]">Mud splashes look like spots:</strong>{' '}
              Always check if a dark speck wipes off gently with a damp cloth!
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
