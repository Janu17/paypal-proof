import { Lock, Server, ShieldCheck, FileWarning } from "lucide-react";

export function SecurityArchitecture() {
  const pillars = [
    {
      icon: Server,
      title: "1. Server-Side OAuth2 Token Exchange",
      description:
        "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are stored exclusively in server environment variables. The browser never receives or handles PayPal credentials.",
    },
    {
      icon: ShieldCheck,
      title: "2. Authoritative Orders v2 Lookup",
      description:
        "Before marking any invoice paid, the backend calls GET /v2/checkout/orders/{id} and confirms status === 'COMPLETED' and exact currency/amount match.",
    },
    {
      icon: Lock,
      title: "3. Cryptographic Webhook Verification",
      description:
        "Incoming PayPal webhooks are validated via /v1/notifications/verify-webhook-signature using PAYPAL-TRANSMISSION-SIG, CERT-URL, and TRANSMISSION-ID headers.",
    },
    {
      icon: FileWarning,
      title: "4. Zero Trust for Database-Only Records",
      description:
        "A local database row or client-side redirect is never treated as proof of payment. Unverified records are flagged until PayPal API confirmation succeeds.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100">
          PayPal API Security & Verification Architecture
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          PAYPAL PROOF enforces strict cryptographic and server-to-server verification boundaries so creators and businesses never ship goods on spoofed callbacks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-[#050814] border border-slate-800/80 rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
