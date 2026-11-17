import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { TourStep } from '../data/leaves';

interface GuidedTourOverlayProps {
  isOpen: boolean;
  steps: TourStep[];
  currentStepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function GuidedTourOverlay({
  isOpen,
  steps,
  currentStepIndex,
  onNext,
  onBack,
  onClose,
}: GuidedTourOverlayProps) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardSize, setCardSize] = useState({ width: 356, height: 230 });

  const currentStep = steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const target = document.getElementById(currentStep.targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
    }

    const measure = () => {
      const el = document.getElementById(currentStep.targetId);
      if (!el) {
        setRect(null);
        return;
      }
      const box = el.getBoundingClientRect();
      const pad = 8;
      const clampedTop = Math.max(8, box.top - pad);
      const clampedLeft = Math.max(8, box.left - pad);
      const maxWidth = Math.min(window.innerWidth - 16, box.width + pad * 2);
      const maxHeight = Math.min(
        window.innerHeight - clampedTop - 8,
        box.height + pad * 2
      );
      setRect({
        top: clampedTop,
        left: clampedLeft,
        width: maxWidth,
        height: Math.max(48, maxHeight),
      });
    };

    const rafId = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 120);

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isOpen, currentStep]);

  useLayoutEffect(() => {
    if (!isOpen || !cardRef.current) return;
    setCardSize({
      width: cardRef.current.offsetWidth || 356,
      height: cardRef.current.offsetHeight || 230,
    });
  }, [isOpen, currentStepIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentStep) return null;

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768;
  const effectiveCardW = Math.min(356, viewportW - 32);
  const effectiveCardH = cardSize.height;

  let cardTop = Math.round((viewportH - effectiveCardH) / 2);
  let cardLeft = Math.round((viewportW - effectiveCardW) / 2);

  if (rect) {
    const spaceBelow = viewportH - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const spaceLeft = rect.left;
    const spaceRight = viewportW - (rect.left + rect.width);

    if (spaceBelow >= effectiveCardH + 24) {
      cardTop = rect.top + rect.height + 16;
      cardLeft = Math.max(
        16,
        Math.min(
          rect.left + rect.width / 2 - effectiveCardW / 2,
          viewportW - effectiveCardW - 16
        )
      );
    } else if (spaceAbove >= effectiveCardH + 24) {
      cardTop = rect.top - effectiveCardH - 16;
      cardLeft = Math.max(
        16,
        Math.min(
          rect.left + rect.width / 2 - effectiveCardW / 2,
          viewportW - effectiveCardW - 16
        )
      );
    } else if (spaceLeft >= effectiveCardW + 24) {
      cardLeft = rect.left - effectiveCardW - 16;
      cardTop = Math.max(
        16,
        Math.min(
          rect.top + rect.height / 2 - effectiveCardH / 2,
          viewportH - effectiveCardH - 16
        )
      );
    } else if (spaceRight >= effectiveCardW + 24) {
      cardLeft = rect.left + rect.width + 16;
      cardTop = Math.max(
        16,
        Math.min(
          rect.top + rect.height / 2 - effectiveCardH / 2,
          viewportH - effectiveCardH - 16
        )
      );
    } else {
      cardTop = Math.max(16, viewportH - effectiveCardH - 16);
      cardLeft = Math.max(16, Math.round((viewportW - effectiveCardW) / 2));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
    >
      {/* Click-outside scrim */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dimmed backdrop with spotlight cutout */}
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-10 rounded-2xl border-2 border-[#C96A4B] transition-all duration-200"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 9999px rgba(36, 48, 40, 0.58)',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-10 bg-[#243028]/58"
        />
      )}

      {/* Floating Tour Card */}
      <div
        ref={cardRef}
        key={currentStep.id}
        style={{
          top: cardTop,
          left: cardLeft,
          width: effectiveCardW,
        }}
        className="animate-leaf-fade fixed z-20 rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-2xl ring-1 ring-[#243028]/10"
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-[#C96A4B] tabular-nums">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tour"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A665E] transition-colors hover:bg-[#F9F7F2] hover:text-[#243028] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <h3
          id="tour-step-title"
          className="mt-2 font-display text-lg font-bold text-[#243028]"
        >
          {currentStep.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#5A665E]">
          {currentStep.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E5E0D5] pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-white px-3.5 py-2 text-sm font-semibold text-[#243028] transition-colors hover:bg-[#F9F7F2] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back</span>
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#3A6B52] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2F5843] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52]"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>Got it!</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#3A6B52] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2F5843] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52]"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
