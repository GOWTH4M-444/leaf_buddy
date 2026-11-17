import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Grid,
  Image as ImageIcon,
  Palette,
  RotateCcw,
  ScanSearch,
  Sparkles,
  Upload,
} from 'lucide-react';
import { DiseaseClassId, MODEL_TEST_IMAGE_COUNT, SAMPLE_LEAVES, SampleLeaf } from '../data/leaves';
import {
  applyStageFilterToRgba,
  CnnStageView,
  LeafAnalysisResult,
} from '../utils/cnnPipeline';

export interface CustomLeafPhoto {
  name: string;
  dataUrl: string;
}

interface LeafCheckerViewProps {
  selectedLeaf: SampleLeaf;
  customPhoto: CustomLeafPhoto | null;
  isScanning: boolean;
  scanStepText: string;
  analysisResult: LeafAnalysisResult | null;
  activeStageView: CnnStageView;
  onSelectSample: (id: DiseaseClassId) => void;
  onUploadCustomPhoto: (file: File) => void;
  onClearCustomPhoto: () => void;
  onCheckLeaf: () => void;
  onSelectStageView: (stage: CnnStageView) => void;
  uploadError: string | null;
}

const STAGE_CONTROLS: Array<{
  id: CnnStageView;
  label: string;
  shortLabel: string;
}> = [
  { id: 'original', label: 'Original Photo', shortLabel: 'Original' },
  { id: 'edges', label: '1. Leaf Edges', shortLabel: '1. Edges' },
  { id: 'colors', label: '2. Color Changes', shortLabel: '2. Colors' },
  { id: 'patterns', label: '3. Matching Patterns', shortLabel: '3. Patterns' },
];

export function LeafCheckerView({
  selectedLeaf,
  customPhoto,
  isScanning,
  scanStepText,
  analysisResult,
  activeStageView,
  onSelectSample,
  onUploadCustomPhoto,
  onClearCustomPhoto,
  onCheckLeaf,
  onSelectStageView,
  uploadError,
}: LeafCheckerViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const activeImageSrc = customPhoto ? customPhoto.dataUrl : selectedLeaf.imageUrl;
  const activeImageAlt = customPhoto
    ? `Uploaded leaf photo named ${customPhoto.name}`
    : selectedLeaf.imageAlt;
  const activeTitle = customPhoto ? customPhoto.name : selectedLeaf.name;
  const activeMeta = customPhoto
    ? 'Uploaded Photo · Ready for Leaf Buddy'
    : `Sample Specimen · ${selectedLeaf.plantType}`;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [activeImageSrc]);

  // Render live Canvas CNN stage overlay when a non-original stage is chosen
  useEffect(() => {
    if (activeStageView === 'original') return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const canvas = stageCanvasRef.current;
      if (!canvas) return;
      const w = 480;
      const h = 360;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const filtered = applyStageFilterToRgba(
        imageData.data,
        w,
        h,
        activeStageView
      );
      imageData.data.set(filtered);
      ctx.putImageData(imageData, 0, 0);
    };
    img.src = activeImageSrc;

    return () => {
      cancelled = true;
    };
  }, [activeImageSrc, activeStageView]);

  const confidencePhrase = (score: number): string => {
    if (score >= 90) return 'Very sure';
    if (score >= 72) return 'Pretty sure';
    return 'Close guess — try a clearer photo';
  };

  return (
    <section className="animate-leaf-fade mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Calm Intro */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#243028] [text-wrap:balance] sm:text-4xl">
            Check Your Garden Leaf
          </h1>
          <p className="mt-2 text-base leading-relaxed text-[#5A665E]">
            Pick any of our four sample leaves below—or upload your own leaf
            photo—and click Check My Leaf to see what Leaf Buddy spots.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUploadCustomPhoto(file);
              }
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D5] bg-white px-4 py-2.5 text-sm font-semibold text-[#243028] transition-colors hover:border-[#3A6B52] hover:bg-[#EEF4F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52] whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4 text-[#3A6B52]" aria-hidden="true" />
            <span>Upload Your Own Leaf</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-[#C96A4B]/40 bg-[#FBF1ED] px-4 py-3 text-sm text-[#8F3E24]"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Sample Leaf Gallery */}
      <div id="tour-sample-gallery" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-[#243028]">
            Sample Leaf Gallery
          </h2>
          {customPhoto ? (
            <button
              type="button"
              onClick={onClearCustomPhoto}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C96A4B] hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Return to sample leaves</span>
            </button>
          ) : (
            <span className="text-xs font-medium text-[#5A665E]">
              Click any leaf card to place it on the mat
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLE_LEAVES.map((leaf) => {
            const isSelected = !customPhoto && selectedLeaf.id === leaf.id;
            return (
              <button
                key={leaf.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectSample(leaf.id)}
                className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52] ${
                  isSelected
                    ? 'border-2 border-[#3A6B52] bg-white shadow-sm'
                    : 'border-[#E5E0D5] bg-white hover:border-[#3A6B52]/50'
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[#E5E0D5] bg-[#F9F7F2]">
                  <img
                    src={leaf.imageUrl}
                    alt={leaf.imageAlt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-base font-bold text-[#243028]">
                        {leaf.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-[#3A6B52]"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#5A665E]">
                      {leaf.visualClue}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Inspection & Diagnosis Two-Zone Workspace */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Zone: Leaf Specimen Mat + Check Button */}
        <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
            <div>
              <p className="text-xs font-medium text-[#5A665E]">{activeMeta}</p>
              <h2 className="mt-0.5 font-display text-2xl font-bold text-[#243028]">
                {activeTitle}
              </h2>
            </div>
            {analysisResult && !isScanning && (
              <span
                key={`mat-label-${analysisResult.predictedClass}-${analysisResult.confidence}`}
                data-testid="mat-result-label"
                className={`animate-result-bounce inline-flex items-center gap-1.5 text-sm font-bold ${
                  analysisResult.isHealthy ? 'text-[#3A6B52]' : 'text-[#C96A4B]'
                }`}
              >
                {analysisResult.isHealthy ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{analysisResult.statusLabel}</span>
              </span>
            )}
          </div>

          {/* Specimen Image Frame */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#E5E0D5] bg-[#F9F7F2]">
            {imageLoadFailed ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-[#5A665E]">
                <ImageIcon className="h-8 w-8 text-[#3A6B52]" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#243028]">
                  {activeTitle}
                </p>
                <p className="text-xs">Specimen photo preview unavailable</p>
              </div>
            ) : activeStageView === 'original' ? (
              <img
                src={activeImageSrc}
                alt={activeImageAlt}
                referrerPolicy="no-referrer"
                onError={() => setImageLoadFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <canvas
                ref={stageCanvasRef}
                data-testid="leaf-stage-canvas"
                aria-label={`${activeTitle} viewed with ${activeStageView} filter`}
                className="h-full w-full object-cover"
              />
            )}

            {/* Gentle Scanning Animation */}
            {isScanning && (
              <div
                aria-live="polite"
                className="absolute inset-0 flex flex-col justify-between bg-[#243028]/20 backdrop-blur-[1px]"
              >
                <div className="animate-leaf-scan h-16 w-full bg-gradient-to-b from-transparent via-[#3A6B52]/40 to-transparent border-b-2 border-[#3A6B52]" />
                <div className="m-4 rounded-xl border border-[#E5E0D5] bg-white/95 px-4 py-3 text-center shadow-sm">
                  <p className="text-sm font-semibold text-[#243028]">
                    {scanStepText}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Interactive CNN Stage Lens Switcher (after check) */}
          {analysisResult && !isScanning && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#5A665E]">
                <span className="font-semibold text-[#243028]">
                  See through Leaf Buddy’s eyes:
                </span>
                <span>Tap a stage to switch view</span>
              </div>
              <div
                className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#E5E0D5] bg-[#F9F7F2] p-1 sm:grid-cols-4"
                role="group"
                aria-label="CNN visual lens stages"
              >
                {STAGE_CONTROLS.map((ctrl) => {
                  const active = activeStageView === ctrl.id;
                  return (
                    <button
                      key={ctrl.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSelectStageView(ctrl.id)}
                      className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52] ${
                        active
                          ? 'bg-[#3A6B52] text-white'
                          : 'text-[#5A665E] hover:bg-white hover:text-[#243028]'
                      }`}
                    >
                      {ctrl.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E0D5] pt-5">
            <p className="text-sm text-[#5A665E]">
              {isScanning
                ? 'Checking edges, colors, and spot patterns...'
                : analysisResult
                  ? 'Want to run the check again or pick another leaf?'
                  : 'Ready! Tap the green button to run the leaf check.'}
            </p>
            <button
              type="button"
              disabled={isScanning}
              onClick={onCheckLeaf}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3A6B52] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2F5843] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52] whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>
                {isScanning
                  ? 'Checking Leaf...'
                  : analysisResult
                    ? 'Check Leaf Again'
                    : 'Check My Leaf'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Zone: Health Result + Model Accuracy + 3-Stage Breakdown */}
        <div className="space-y-5 lg:col-span-5">
          {!analysisResult ? (
            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-6">
              <h2 className="font-display text-xl font-bold text-[#243028]">
                Ready to Look Closer
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5A665E]">
                When you click <strong className="text-[#243028]">Check My Leaf</strong>,
                our CNN plant helper checks this leaf in three quick steps:
              </p>
              <ol className="mt-4 divide-y divide-[#E5E0D5] text-sm">
                <li className="flex items-start gap-3 py-3">
                  <ScanSearch
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#3A6B52]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-[#243028]">
                      1. Finding leaf edges
                    </p>
                    <p className="text-xs text-[#5A665E]">
                      Traces the leaf shape and veins.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 py-3">
                  <Palette
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#C96A4B]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-[#243028]">
                      2. Spotting color changes
                    </p>
                    <p className="text-xs text-[#5A665E]">
                      Looks for brown spots, white dust, or yellow rust.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 pt-3">
                  <Grid
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#3A6B52]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-[#243028]">
                      3. Matching patterns
                    </p>
                    <p className="text-xs text-[#5A665E]">
                      Compares clues against thousands of garden photos.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          ) : (
            <div
              key={`${analysisResult.predictedClass}-${analysisResult.confidence}`}
              className="animate-leaf-fade space-y-5"
            >
              {/* Card 1: Health Diagnosis & Care Steps */}
              <div
                id="tour-health-result"
                data-testid="health-result-card"
                className="rounded-2xl border border-[#E5E0D5] bg-white p-6"
              >
                <div
                  key={`card-label-${analysisResult.predictedClass}-${analysisResult.confidence}`}
                  className="flex items-center gap-2 text-sm font-bold"
                >
                  {analysisResult.isHealthy ? (
                    <span
                      data-testid="card-result-label"
                      className="animate-result-bounce inline-flex items-center gap-1.5 text-[#3A6B52]"
                    >
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      <span>{analysisResult.statusLabel}</span>
                    </span>
                  ) : (
                    <span
                      data-testid="card-result-label"
                      className="animate-result-bounce inline-flex items-center gap-1.5 text-[#C96A4B]"
                    >
                      <AlertCircle className="h-5 w-5" aria-hidden="true" />
                      <span>{analysisResult.statusLabel}</span>
                    </span>
                  )}
                </div>

                <h3 className="mt-2 font-display text-xl font-extrabold text-[#243028]">
                  {analysisResult.headline}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5A665E]">
                  {analysisResult.kidFriendlySummary}
                </p>

                <div className="mt-5 border-t border-[#E5E0D5] pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#3A6B52]">
                    What You Can Do Today
                  </h4>
                  <ol className="mt-2.5 space-y-2">
                    {analysisResult.careSteps.map((step, index) => (
                      <li
                        key={step}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-[#243028]"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEF4F0] text-xs font-bold text-[#3A6B52] tabular-nums">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Card 2: Model Accuracy & Confidence */}
              <div
                id="tour-model-accuracy"
                data-testid="model-accuracy-card"
                className="rounded-2xl border border-[#E5E0D5] bg-white p-6"
              >
                <h3 className="font-display text-lg font-bold text-[#243028]">
                  Model Accuracy & Confidence
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-4 border-b border-[#E5E0D5] pb-4">
                  <div>
                    <p className="text-xs font-medium text-[#5A665E]">
                      CNN Test Accuracy
                    </p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-[#3A6B52] tabular-nums">
                      {analysisResult.modelAccuracy}%
                    </p>
                    <p className="text-xs text-[#5A665E] tabular-nums">
                      On {MODEL_TEST_IMAGE_COUNT.toLocaleString()} test leaves
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#5A665E]">
                      This Leaf Confidence
                    </p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-[#243028] tabular-nums">
                      {analysisResult.confidence}%
                    </p>
                    <p className="text-xs font-semibold text-[#C96A4B]">
                      {confidencePhrase(analysisResult.confidence)}
                    </p>
                  </div>
                </div>

                {/* Friendly Confidence Meter & 4-Class Breakdown */}
                <div className="mt-4 space-y-2.5">
                  <p className="text-xs font-semibold text-[#5A665E]">
                    How Leaf Buddy scored each possibility:
                  </p>
                  {analysisResult.classBreakdown.map((item, idx) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={
                            idx === 0
                              ? 'font-bold text-[#243028]'
                              : 'font-medium text-[#5A665E]'
                          }
                        >
                          {item.label}
                        </span>
                        <span
                          className={`tabular-nums ${
                            idx === 0
                              ? 'font-bold text-[#243028]'
                              : 'text-[#5A665E]'
                          }`}
                        >
                          {item.percent}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F9F7F2] border border-[#E5E0D5]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            idx === 0
                              ? analysisResult.isHealthy
                                ? 'bg-[#3A6B52]'
                                : 'bg-[#C96A4B]'
                              : 'bg-[#D6D0C4]'
                          }`}
                          style={{ width: `${Math.max(item.percent, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: How the CNN Looked at This Leaf */}
              <div className="rounded-2xl border border-[#E5E0D5] bg-white p-6">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-[#243028]">
                    How the CNN Looked at This Leaf
                  </h3>
                  <span className="text-xs text-[#5A665E]">Tap a step</span>
                </div>

                <div className="mt-3 divide-y divide-[#E5E0D5]">
                  <button
                    type="button"
                    onClick={() => onSelectStageView('edges')}
                    className={`flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-[#F9F7F2] px-2 -mx-2 rounded-lg ${
                      activeStageView === 'edges' ? 'bg-[#EEF4F0]' : ''
                    }`}
                  >
                    <ScanSearch
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#3A6B52]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#243028]">
                        1. Finding leaf edges
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#5A665E]">
                        {analysisResult.whatCnnNoticed.edges}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectStageView('colors')}
                    className={`flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-[#F9F7F2] px-2 -mx-2 rounded-lg ${
                      activeStageView === 'colors' ? 'bg-[#EEF4F0]' : ''
                    }`}
                  >
                    <Palette
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#C96A4B]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#243028]">
                        2. Spotting color changes
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#5A665E]">
                        {analysisResult.whatCnnNoticed.colors}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectStageView('patterns')}
                    className={`flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-[#F9F7F2] px-2 -mx-2 rounded-lg ${
                      activeStageView === 'patterns' ? 'bg-[#EEF4F0]' : ''
                    }`}
                  >
                    <Grid
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#3A6B52]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#243028]">
                        3. Matching patterns
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#5A665E]">
                        {analysisResult.whatCnnNoticed.patterns}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
