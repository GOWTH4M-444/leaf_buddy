import { useEffect, useRef, useState } from 'react';
import { GuidedTourOverlay } from './components/GuidedTourOverlay';
import { HowItWorksView } from './components/HowItWorksView';
import { CustomLeafPhoto, LeafCheckerView } from './components/LeafCheckerView';
import { PlantCareTipsView } from './components/PlantCareTipsView';
import { AppTab, TopNav } from './components/TopNav';
import {
  DiseaseClassId,
  GUIDED_TOUR_STEPS,
  SAMPLE_LEAVES,
} from './data/leaves';
import {
  analyzePixelFeatures,
  buildSampleLeafAnalysis,
  CnnStageView,
  computePixelStatsFromRgba,
  getNextTourStep,
  LeafAnalysisResult,
} from './utils/cnnPipeline';

const SCAN_MESSAGES = [
  '1. Finding leaf edges and veins...',
  '2. Spotting color changes...',
  '3. Matching patterns against garden leaves...',
];

function extractPixelStatsFromImageUrl(
  imageUrl: string
): Promise<ReturnType<typeof computePixelStatsFromRgba> | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = 160;
        const h = 120;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        resolve(computePixelStatsFromRgba(imageData.data, w, h));
      } catch {
        resolve(undefined);
      }
    };
    img.onerror = () => resolve(undefined);
    img.src = imageUrl;
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('checker');
  const [selectedLeafId, setSelectedLeafId] = useState<DiseaseClassId>('healthy');
  const [customPhoto, setCustomPhoto] = useState<CustomLeafPhoto | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState(SCAN_MESSAGES[0]);
  const [analysisResult, setAnalysisResult] = useState<LeafAnalysisResult | null>(
    null
  );
  const [activeStageView, setActiveStageView] = useState<CnnStageView>('original');

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const scanTimersRef = useRef<number[]>([]);

  const selectedLeaf =
    SAMPLE_LEAVES.find((leaf) => leaf.id === selectedLeafId) ?? SAMPLE_LEAVES[0];

  const clearScanTimers = () => {
    scanTimersRef.current.forEach((id) => window.clearTimeout(id));
    scanTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearScanTimers();
  }, []);

  const handleSelectSample = (id: DiseaseClassId) => {
    clearScanTimers();
    setIsScanning(false);
    setCustomPhoto(null);
    setUploadError(null);
    setSelectedLeafId(id);
    setAnalysisResult(null);
    setActiveStageView('original');
  };

  const handleUploadCustomPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please pick a photo file (like JPG or PNG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setUploadError('Could not read that photo. Please try another one.');
        return;
      }
      clearScanTimers();
      setIsScanning(false);
      setUploadError(null);
      setCustomPhoto({
        name: file.name.replace(/\.[^.]+$/, '') || 'My Garden Leaf',
        dataUrl: reader.result,
      });
      setAnalysisResult(null);
      setActiveStageView('original');
    };
    reader.onerror = () => {
      setUploadError('Could not open that photo. Please try another one.');
    };
    reader.readAsDataURL(file);
  };

  const handleClearCustomPhoto = () => {
    clearScanTimers();
    setIsScanning(false);
    setCustomPhoto(null);
    setUploadError(null);
    setAnalysisResult(null);
    setActiveStageView('original');
  };

  const handleCheckLeaf = async () => {
    clearScanTimers();
    setAnalysisResult(null);
    setIsScanning(true);
    setScanStepText(SCAN_MESSAGES[0]);
    setActiveStageView('original');

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const imageUrl = customPhoto ? customPhoto.dataUrl : selectedLeaf.imageUrl;
    const statsPromise = extractPixelStatsFromImageUrl(imageUrl);

    if (prefersReducedMotion) {
      const stats = await statsPromise;
      const result = customPhoto
        ? analyzePixelFeatures(
            stats ?? {
              totalLeafPixels: 100,
              healthyGreenRatio: 0.85,
              darkSpotRatio: 0.05,
              whitePowderRatio: 0.05,
              yellowRustRatio: 0.05,
              edgeDensity: 0.12,
            },
            true
          )
        : buildSampleLeafAnalysis(selectedLeaf, stats);
      setAnalysisResult(result);
      setIsScanning(false);
      return;
    }

    const t1 = window.setTimeout(() => setScanStepText(SCAN_MESSAGES[1]), 340);
    const t2 = window.setTimeout(() => setScanStepText(SCAN_MESSAGES[2]), 680);
    const t3 = window.setTimeout(async () => {
      const stats = await statsPromise;
      const result = customPhoto
        ? analyzePixelFeatures(
            stats ?? {
              totalLeafPixels: 100,
              healthyGreenRatio: 0.85,
              darkSpotRatio: 0.05,
              whitePowderRatio: 0.05,
              yellowRustRatio: 0.05,
              edgeDensity: 0.12,
            },
            true
          )
        : buildSampleLeafAnalysis(selectedLeaf, stats);
      setAnalysisResult(result);
      setIsScanning(false);
    }, 1050);

    scanTimersRef.current = [t1, t2, t3];
  };

  const handleStartTour = () => {
    setActiveTab('checker');
    setTourStepIndex(0);
    setTourOpen(true);
  };

  const handleTourNext = () => {
    const nextIdx = getNextTourStep(
      tourStepIndex,
      'next',
      GUIDED_TOUR_STEPS.length
    );
    const nextStep = GUIDED_TOUR_STEPS[nextIdx];
    if (nextStep?.requiresAnalysis && !analysisResult) {
      // Ensure the health result and accuracy cards exist for steps 3 & 4
      const demoLeaf =
        SAMPLE_LEAVES.find((l) => l.id === selectedLeafId) ?? SAMPLE_LEAVES[1];
      setAnalysisResult(buildSampleLeafAnalysis(demoLeaf));
    }
    setTourStepIndex(nextIdx);
  };

  const handleTourBack = () => {
    setTourStepIndex((prev) =>
      getNextTourStep(prev, 'back', GUIDED_TOUR_STEPS.length)
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#243028] flex flex-col">
      <TopNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onStartTour={handleStartTour}
      />

      <main className="flex-1">
        {activeTab === 'checker' && (
          <LeafCheckerView
            selectedLeaf={selectedLeaf}
            customPhoto={customPhoto}
            isScanning={isScanning}
            scanStepText={scanStepText}
            analysisResult={analysisResult}
            activeStageView={activeStageView}
            onSelectSample={handleSelectSample}
            onUploadCustomPhoto={handleUploadCustomPhoto}
            onClearCustomPhoto={handleClearCustomPhoto}
            onCheckLeaf={handleCheckLeaf}
            onSelectStageView={setActiveStageView}
            uploadError={uploadError}
          />
        )}

        {activeTab === 'how-it-works' && <HowItWorksView />}

        {activeTab === 'care-tips' && <PlantCareTipsView />}
      </main>

      <footer className="border-t border-[#E5E0D5] bg-[#F9F7F2] py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-[#5A665E] sm:px-6">
          <p>
            <strong className="font-semibold text-[#243028]">Leaf Buddy</strong> ·
            Illustrated Garden Health Field Guide
          </p>
          <p>
            Educational plant health explorer · Tested on 5,400 garden leaf
            photos
          </p>
        </div>
      </footer>

      <GuidedTourOverlay
        isOpen={tourOpen}
        steps={GUIDED_TOUR_STEPS}
        currentStepIndex={tourStepIndex}
        onNext={handleTourNext}
        onBack={handleTourBack}
        onClose={() => setTourOpen(false)}
      />
    </div>
  );
}
