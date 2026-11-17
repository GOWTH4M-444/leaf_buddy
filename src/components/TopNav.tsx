import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Compass, Sprout } from 'lucide-react';

export type AppTab = 'checker' | 'how-it-works' | 'care-tips';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onStartTour: () => void;
}

const TABS: Array<{ id: AppTab; label: string }> = [
  { id: 'checker', label: 'Leaf Checker' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'care-tips', label: 'Plant Care Tips' },
];

export function TopNav({ activeTab, onSelectTab, onStartTour }: TopNavProps) {
  const navRef = useRef<HTMLElement | null>(null);
  const buttonRefs = useRef<Record<AppTab, HTMLButtonElement | null>>({
    checker: null,
    'how-it-works': null,
    'care-tips': null,
  });
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 4,
    width: 112,
  });

  const updateIndicator = () => {
    const activeBtn = buttonRefs.current[activeTab];
    if (!activeBtn) return;
    setIndicator({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
    });
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  return (
    <header className="border-b border-[#E5E0D5] bg-[#F9F7F2]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-6">
        {/* Zone 1: Single-line brand mark */}
        <button
          type="button"
          onClick={() => onSelectTab('checker')}
          className="flex items-center gap-2.5 text-left text-[#243028] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3A6B52] whitespace-nowrap shrink-0"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3A6B52] text-white">
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0">
            Leaf Buddy
          </span>
        </button>

        {/* Zone 2: 3 Navigation Tabs with sliding indicator */}
        <nav
          ref={navRef}
          id="tour-nav-tabs"
          aria-label="Field guide sections"
          className="relative order-3 flex w-full items-center justify-start gap-1 overflow-x-auto rounded-xl border border-[#E5E0D5] bg-white p-1 md:order-2 md:w-auto"
          role="tablist"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-lg bg-[#3A6B52] transition-transform duration-200 ease-out"
            style={{
              width: indicator.width,
              transform: `translateX(${indicator.left}px)`,
            }}
          />
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  buttonRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.id)}
                className={`relative z-10 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52] whitespace-nowrap shrink-0 sm:px-4 sm:text-sm ${
                  isActive
                    ? 'text-white'
                    : 'text-[#5A665E] hover:text-[#243028]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary header action */}
        <div className="order-2 flex items-center shrink-0 md:order-3">
          <button
            type="button"
            onClick={onStartTour}
            className="inline-flex items-center gap-2 rounded-xl border border-[#C96A4B]/35 bg-[#FBF1ED] px-4 py-2 text-sm font-semibold text-[#A34D32] transition-colors hover:border-[#C96A4B] hover:bg-[#F7E5DD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C96A4B] whitespace-nowrap shrink-0"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>Take a Quick Tour</span>
          </button>
        </div>
      </div>
    </header>
  );
}
