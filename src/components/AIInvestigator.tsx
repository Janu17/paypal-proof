import { useState } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { AIInvestigationResult, Transaction } from "../types/transaction";

interface AIInvestigatorProps {
  transactions: Transaction[];
  selectedTransactionId?: string;
}

export function AIInvestigator({
  transactions,
  selectedTransactionId,
}: AIInvestigatorProps) {
  const [selectedId, setSelectedId] = useState<string>(
    selectedTransactionId ||
      transactions.find((t) => t.status === "Flagged")?.id ||
      transactions[0]?.id ||
      ""
  );
  const [customQuery, setCustomQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIInvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTx = transactions.find((t) => t.id === selectedId) || null;

  async function runInvestigation(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: selectedTx,
          customQuery: customQuery.trim() || undefined,
        }),
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `Server returned non-JSON response (${res.status}): ${text.slice(0, 120)}`
        );
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || `Server error (${res.status}) while running investigation.`
        );
      }
      setResult(data.analysis);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request timed out after 20 seconds. Please try again.");
      } else if (err instanceof Error) {
        setError(
          err.message === "Failed to fetch"
            ? "Unable to reach /api/investigate. Please ensure the backend server is running."
            : err.message
        );
      } else {
        setError("Investigation failed due to an unexpected error.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-6 space-y-5 h-fit">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            AI Transaction Investigator
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Analyze discrepancies, missing webhook signatures, and suspicious payment records using server-side Gemini reasoning.
          </p>
        </div>

        <form onSubmit={runInvestigation} className="space-y-4">
          <div>
            <label
              htmlFor="tx-select"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Select Transaction to Inspect
            </label>
            <select
              id="tx-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-[#050814] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {transactions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} · {t.counterparty} ({t.status}) — {t.amount.toFixed(2)}{" "}
                  {t.currency}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="custom-query"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Additional Context or Discrepancy Question (Optional)
            </label>
            <textarea
              id="custom-query"
              rows={3}
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="e.g. Client sent a screenshot of payment, but our webhook never fired. Is it safe to deliver?"
              className="w-full bg-[#050814] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{loading ? "Analyzing Record..." : "Run AI Investigation"}</span>
          </button>
        </form>

        {selectedTx && (
          <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>PayPal Order ID</span>
              <span className="font-mono text-slate-200">
                {selectedTx.paypalOrderId}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Data Origin</span>
              <span className="text-slate-200">{selectedTx.origin}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Risk Score</span>
              <span className="font-mono text-slate-200">
                {selectedTx.riskScore} / 100
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-7 bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-6">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        {!result && !loading && !error && (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-6">
            <ShieldAlert
              className="w-10 h-10 text-blue-400/80 mb-3"
              aria-hidden="true"
            />
            <h3 className="text-base font-semibold text-slate-200">
              Ready for Forensic Analysis
            </h3>
            <p className="text-sm text-slate-400 max-w-md mt-1.5">
              Select a flagged or pending transaction on the left and click{" "}
              <span className="text-slate-200 font-medium">Run AI Investigation</span>{" "}
              to generate a structured discrepancy report.
            </p>
          </div>
        )}

        {loading && (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-300">
              Inspecting payment evidence and webhook integrity...
            </p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6">
            {result.isSimulatedFallback && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 text-xs text-amber-200 leading-relaxed">
                <span className="font-semibold">Simulated Fallback Analysis: </span>
                Live Gemini AI analysis is currently unavailable ({result.fallbackReason || "service unreachable"}). The findings below are generated from local policy rules and are not live AI output.
              </div>
            )}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <div className="text-xs text-slate-400">
                  Forensic Assessment
                </div>
                <h3 className="text-base font-semibold text-slate-100 mt-0.5">
                  Investigation Report
                </h3>
              </div>
              <span
                className={`text-xs font-mono font-semibold px-3 py-1 rounded-md border ${
                  result.riskLevel === "CRITICAL" || result.riskLevel === "HIGH"
                    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    : result.riskLevel === "MEDIUM"
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                }`}
              >
                RISK: {result.riskLevel}
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              {result.summary}
            </p>

            {result.discrepancies?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  Identified Discrepancies
                </h4>
                <ul className="space-y-2">
                  {result.discrepancies.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-300 bg-[#050814] border border-slate-800/80 rounded-lg p-3"
                    >
                      <AlertTriangle
                        className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendedActions?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  Recommended Next Steps
                </h4>
                <ul className="space-y-2">
                  {result.recommendedActions.map((action, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-300 bg-[#050814] border border-slate-800/80 rounded-lg p-3"
                    >
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
