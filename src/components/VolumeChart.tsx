import { useState } from "react";
import { WEEKLY_VOLUME_DATA } from "../data/demoTransactions";

export function VolumeChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxTotal = Math.max(
    ...WEEKLY_VOLUME_DATA.map((d) => d.verified + d.pending + d.flagged),
    1
  );

  return (
    <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-100">
            7-Day Verification Volume
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulated demo ledger · USD equivalent
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            Verified
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            Pending
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            Flagged
          </span>
        </div>
      </div>

      <div className="relative h-52 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-800/80">
        {WEEKLY_VOLUME_DATA.map((item, idx) => {
          const total = item.verified + item.pending + item.flagged;
          const verifiedPct = (item.verified / maxTotal) * 100;
          const pendingPct = (item.pending / maxTotal) * 100;
          const flaggedPct = (item.flagged / maxTotal) * 100;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={item.day}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
            >
              {isHovered && (
                <div className="absolute -top-2 -translate-y-full z-10 bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg whitespace-nowrap pointer-events-none">
                  <div className="font-semibold text-slate-100 mb-1">
                    {item.day} · ${total.toLocaleString()}
                  </div>
                  <div className="text-emerald-400 font-mono">
                    Verified: ${item.verified.toLocaleString()}
                  </div>
                  <div className="text-amber-400 font-mono">
                    Pending: ${item.pending.toLocaleString()}
                  </div>
                  <div className="text-rose-400 font-mono">
                    Flagged: ${item.flagged.toLocaleString()}
                  </div>
                </div>
              )}

              <div className="w-full max-w-[38px] flex flex-col-reverse gap-0.5 h-full justify-start">
                {item.verified > 0 && (
                  <div
                    style={{ height: `${verifiedPct}%` }}
                    className="w-full bg-emerald-500/90 group-hover:bg-emerald-400 rounded-t-sm transition-colors"
                  />
                )}
                {item.pending > 0 && (
                  <div
                    style={{ height: `${pendingPct}%` }}
                    className="w-full bg-amber-500/90 group-hover:bg-amber-400 rounded-t-sm transition-colors"
                  />
                )}
                {item.flagged > 0 && (
                  <div
                    style={{ height: `${flaggedPct}%` }}
                    className="w-full bg-rose-500/90 group-hover:bg-rose-400 rounded-t-sm transition-colors"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-4 pt-2.5">
        {WEEKLY_VOLUME_DATA.map((item) => (
          <div
            key={item.day}
            className="flex-1 text-center text-[11px] font-mono text-slate-400"
          >
            {item.day}
          </div>
        ))}
      </div>
    </div>
  );
}
