import { useState } from "react";
import { ShieldCheck, Search, Lock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Transaction } from "../types/transaction";

interface VerificationScreenProps {
  transactions: Transaction[];
  initialOrderId?: string;
}

interface VerifyApiResponse {
  verified: boolean;
  demoMode?: boolean;
  paymentId: string;
  status: string;
  message: string;
  checks?: {
    oauthToken: string;
    ordersApiLookup: string;
    webhookSignature: string;
    databaseOnlyTrust: string;
  };
}

export function VerificationScreen({
  transactions,
  initialOrderId = "",
}: VerificationScreenProps) {
  const [orderIdInput, setOrderIdInput] = useState(
    initialOrderId || transactions[0]?.paypalOrderId || ""
  );
  const [loading, setLoading] = useState(false);
  const [apiResult, setApiResult] = useState<VerifyApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxOrder, setSandboxOrder] = useState<{
    orderId: string;
    status: string;
    approvalUrl: string | null;
  } | null>(null);
  const [captureResult, setCaptureResult] = useState<{
    orderId: string;
    status: string;
    captureId: string | null;
    amount: string | null;
    currency: string | null;
  } | null>(null);

  const matchedDemo = transactions.find(
    (t) =>
      t.paypalOrderId.toLowerCase() === orderIdInput.trim().toLowerCase() ||
      t.id.toLowerCase() === orderIdInput.trim().toLowerCase()
  );

  async function verifyOrderId(idToVerify: string) {
    setLoading(true);
    setError(null);
    setApiResult(null);

    try {
      const res = await fetch("/api/paypal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: idToVerify.trim() }),
      });
      const data = await res.json();
      if (!res.ok && !data.status) {
        throw new Error(data.error || "Verification request failed.");
      }
      setApiResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!orderIdInput.trim()) return;
    await verifyOrderId(orderIdInput);
  }

  async function handleCreateSandboxOrder() {
    setSandboxLoading(true);
    setError(null);
    setSandboxOrder(null);
    setCaptureResult(null);
    setApiResult(null);

    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Sandbox order.");
      }
      setSandboxOrder(data);
      setOrderIdInput(data.orderId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create Sandbox order.");
    } finally {
      setSandboxLoading(false);
    }
  }

  async function handleCaptureAndVerify() {
    const targetOrderId = orderIdInput.trim() || sandboxOrder?.orderId;
    if (!targetOrderId) return;
    setSandboxLoading(true);
    setError(null);
    setCaptureResult(null);

    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: targetOrderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to capture PayPal Sandbox order.");
      }
      setCaptureResult(data);
      setSandboxOrder((prev) => (prev ? { ...prev, status: data.status } : null));
      await verifyOrderId(targetOrderId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to capture Sandbox order.");
    } finally {
      setSandboxLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              PayPal Payment Verification
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Verify an Order ID or Capture ID directly against the server-side PayPal Orders v2 endpoint.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Zero-Trust Policy Active</span>
          </div>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="Enter PayPal Order ID (e.g. 8XY49201KL938471M) or TXN ID"
              className="w-full bg-[#050814] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !orderIdInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>{loading ? "Verifying..." : "Verify with Server"}</span>
          </button>
          <button
            type="button"
            onClick={handleCaptureAndVerify}
            disabled={sandboxLoading || loading || !orderIdInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{sandboxLoading ? "Capturing..." : "Capture & Verify Order"}</span>
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>Quick test IDs:</span>
          {transactions.slice(0, 4).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOrderIdInput(t.paypalOrderId)}
              className="font-mono text-slate-300 hover:text-blue-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              {t.paypalOrderId}
            </button>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-200">
              Live PayPal Sandbox Checkout Test ($25.00 USD)
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Create a real Sandbox order, approve it with a Sandbox Personal Buyer account, then capture & verify.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateSandboxOrder}
            disabled={sandboxLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>
              {sandboxLoading ? "Working..." : "Create Sandbox Test Payment"}
            </span>
          </button>
        </div>

        {sandboxOrder && (
          <div className="mt-4 bg-[#050814] border border-slate-800/80 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="text-slate-400">
                Sandbox Order ID:{" "}
                <span className="font-mono text-slate-100 font-semibold">
                  {sandboxOrder.orderId}
                </span>
              </div>
              <div className="text-slate-400">
                Order Status:{" "}
                <span className="font-mono text-blue-400">
                  {sandboxOrder.status}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {sandboxOrder.approvalUrl && (
                <a
                  href={sandboxOrder.approvalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Open PayPal Approval
                </a>
              )}
              <button
                type="button"
                onClick={handleCaptureAndVerify}
                disabled={sandboxLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Capture & Verify Order
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 text-sm text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>{error}</div>
        </div>
      )}

      {captureResult && (
        <div className="bg-[#0A0F1F] border border-emerald-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-emerald-400">
              PayPal Sandbox Capture Result
            </h3>
            <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
              {captureResult.status}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#050814] border border-slate-800/80 rounded-lg p-3">
              <div className="text-slate-400">Capture ID</div>
              <div className="font-mono text-slate-100 mt-1">
                {captureResult.captureId || "N/A"}
              </div>
            </div>
            <div className="bg-[#050814] border border-slate-800/80 rounded-lg p-3">
              <div className="text-slate-400">Order ID</div>
              <div className="font-mono text-slate-100 mt-1">
                {captureResult.orderId}
              </div>
            </div>
            <div className="bg-[#050814] border border-slate-800/80 rounded-lg p-3">
              <div className="text-slate-400">Captured Amount</div>
              <div className="font-mono text-slate-100 mt-1">
                {captureResult.amount ? `${captureResult.amount} ${captureResult.currency ?? ""}` : "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}

      {apiResult && (
        <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <div className="text-xs font-mono text-slate-400">
                Server Verification Response · {apiResult.paymentId}
              </div>
              <h3 className="text-base font-semibold text-slate-100 mt-1">
                {apiResult.verified
                  ? "Cryptographically Verified"
                  : apiResult.demoMode
                  ? "Unverified — Live PayPal Credentials Not Configured"
                  : `Unverified — ${apiResult.status}`}
              </h3>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-md border whitespace-nowrap shrink-0 ${
                apiResult.verified
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : "text-amber-400 bg-amber-500/10 border-amber-500/20"
              }`}
            >
              {apiResult.verified ? (
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{apiResult.status}</span>
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {apiResult.message}
          </p>

          {apiResult.checks && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(apiResult.checks).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-[#050814] border border-slate-800/80 rounded-lg p-3.5"
                >
                  <div className="text-xs text-slate-400 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="text-xs font-mono text-slate-200 mt-1.5">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {matchedDemo && (
        <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
            <div>
              <div className="text-xs text-slate-400">
                Simulated Demo Record · {matchedDemo.id}
              </div>
              <h3 className="text-base font-semibold text-slate-100 mt-0.5">
                {matchedDemo.counterparty} — {matchedDemo.description}
              </h3>
            </div>
            <div className="text-right font-mono text-base font-semibold text-slate-100">
              {matchedDemo.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {matchedDemo.currency}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
            {[
              { label: "OAuth2 Token", ok: matchedDemo.evidence.oauthChecked },
              {
                label: "Webhook Signature",
                ok: matchedDemo.evidence.webhookSignatureValid,
              },
              {
                label: "Amount Match",
                ok: matchedDemo.evidence.amountMatchesInvoice,
              },
              {
                label: "Currency Match",
                ok: matchedDemo.evidence.currencyMatchesInvoice,
              },
              {
                label: "Payer Verified",
                ok: matchedDemo.evidence.payerEmailVerified,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#050814] border border-slate-800/80 rounded-lg p-3 flex items-center justify-between"
              >
                <span className="text-xs text-slate-300">{item.label}</span>
                {item.ok ? (
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-400 shrink-0"
                    aria-label="Passed"
                  />
                ) : (
                  <XCircle
                    className="w-4 h-4 text-rose-400 shrink-0"
                    aria-label="Failed"
                  />
                )}
              </div>
            ))}
          </div>

          {matchedDemo.discrepancyNote && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 text-xs text-amber-200 leading-relaxed">
              <span className="font-semibold">Recorded Discrepancy: </span>
              {matchedDemo.discrepancyNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
