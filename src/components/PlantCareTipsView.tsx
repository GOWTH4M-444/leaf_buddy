import { useState } from 'react';
import { Check, Leaf, Sun } from 'lucide-react';
import { PLANT_CARE_GUIDES } from '../data/leaves';

type CareFilter = 'all' | 'habits' | 'spots' | 'rust';

const FILTERS: Array<{ id: CareFilter; label: string }> = [
  { id: 'all', label: 'All Guides' },
  { id: 'habits', label: 'Everyday Habits' },
  { id: 'spots', label: 'Spots & Mildew' },
  { id: 'rust', label: 'Rust Care' },
];

export function PlantCareTipsView() {
  const [filter, setFilter] = useState<CareFilter>('all');

  const visibleGuides =
    filter === 'all'
      ? PLANT_CARE_GUIDES
      : PLANT_CARE_GUIDES.filter((entry) => entry.category === filter);

  return (
    <section className="animate-leaf-fade mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#3A6B52]">
            Garden Field Notes
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-[#243028] [text-wrap:balance] sm:text-4xl">
            Simple Plant Care Tips
          </h1>
          <p className="mt-2 text-base leading-relaxed text-[#5A665E]">
            Easy ways to help garden plants feel better and keep healthy leaves
            shining green.
          </p>
        </div>

        {/* Interactive Filter Segmented Control */}
        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-[#E5E0D5] bg-white p-1"
          role="group"
          aria-label="Filter plant care guides"
        >
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6B52] ${
                  active
                    ? 'bg-[#3A6B52] text-white'
                    : 'text-[#5A665E] hover:bg-[#F9F7F2] hover:text-[#243028]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {visibleGuides.map((guide) => (
          <article
            key={guide.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#E5E0D5] bg-white"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[#E5E0D5] bg-[#F9F7F2]">
              <img
                src={guide.imageUrl}
                alt={guide.imageAlt}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#C96A4B]">
                <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{guide.categoryLabel}</span>
              </div>

              <h2 className="mt-1.5 font-display text-xl font-bold text-[#243028]">
                {guide.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5A665E]">
                {guide.summary}
              </p>

              <div className="mt-5 border-t border-[#E5E0D5] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#3A6B52]">
                  What You Can Do
                </h3>
                <ul className="mt-2.5 space-y-2.5">
                  {guide.doThis.map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-[#243028]"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#3A6B52]"
                        aria-hidden="true"
                      />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#E5E0D5] bg-[#F9F7F2] p-3.5 text-xs leading-relaxed text-[#5A665E]">
                <Sun
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#C96A4B]"
                  aria-hidden="true"
                />
                <span>
                  <strong className="text-[#243028]">Detective Clue:</strong>{' '}
                  {guide.watchOutFor}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
