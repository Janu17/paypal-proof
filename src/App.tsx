import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  ListOrdered,
  ShieldCheck,
  Sparkles,
  BellRing,
  Lock,
  Download,
  Search,
  Menu,
  X,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { DEMO_FRAUD_ALERTS, DEMO_TRANSACTIONS } from "./data/demoTransactions";
import { FraudAlert, TransactionStatus } from "./types/transaction";
import { StatusBadge } from "./components/StatusBadge";
import { VolumeChart } from "./components/VolumeChart";
import { VerificationScreen } from "./components/VerificationScreen";
import { AIInvestigator } from "./components/AIInvestigator";
import { SecurityArchitecture } from "./components/SecurityArchitecture";
import {
  downloadCsvAuditReport,
  downloadJsonAuditReport,
} from "./utils/auditReport";

type NavTab =
  | "dashboard"
  | "transactions"
  | "verify"
  | "investigator"
  | "alerts"
  | "security";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TransactionStatus>(
    "All"
  );
  const [alerts, setAlerts] = useState<FraudAlert[]>(DEMO_FRAUD_ALERTS);
  const [selectedOrderIdForVerify, setSelectedOrderIdForVerify] = useState<
    string | undefined
  >(undefined);
  const [selectedTxIdForAI, setSelectedTxIdForAI] = useState<
    string | undefined
  >(undefined);

  const activeAlerts = alerts.filter((a) => !a.dismissed);

  const metrics = useMemo(() => {
    const verified = DEMO_TRANSACTIONS.filter((t) => t.status === "Verified");
    const pending = DEMO_TRANSACTIONS.filter((t) => t.status === "Pending");
    const flagged = DEMO_TRANSACTIONS.filter((t) => t.status === "Flagged");

    return {
      verifiedTotal: verified.reduce((sum, t) => sum + t.amount, 0),
      verifiedCount: verified.length,
      pendingTotal: pending.reduce((sum, t) => sum + t.amount, 0),
      pendingCount: pending.length,
      flaggedTotal: flagged.reduce((sum, t) => sum + t.amount, 0),
      flaggedCount: flagged.length,
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    return DEMO_TRANSACTIONS.filter((t) => {
      const matchesStatus =
        statusFilter === "All" || t.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.paypalOrderId.toLowerCase().includes(q) ||
        t.counterparty.toLowerCase().includes(q) ||
        t.payerEmail.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, statusFilter]);

  function handleNavigate(tab: NavTab) {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  }

  function handleVerifyTransaction(paypalOrderId: string) {
    setSelectedOrderIdForVerify(paypalOrderId);
    setActiveTab("verify");
  }

  function handleInvestigateTransaction(txId: string) {
    setSelectedTxIdForAI(txId);
    setActiveTab("investigator");
  }

  function handleDismissAlert(alertId: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a))
    );
  }

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "transactions", label: "Transactions", icon: ListOrdered },
    { id: "verify", label: "Verify Payment", icon: ShieldCheck },
    { id: "investigator", label: "AI Investigator", icon: Sparkles },
    {
      id: "alerts",
      label: "Fraud Alerts",
      icon: BellRing,
      badge: activeAlerts.length,
    },
    { id: "security", label: "API Security", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#070B19] border-r border-slate-800/80">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
          <span className="font-display text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap">
            PAYPAL <span className="text-blue-400">PROOF</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="text-xs font-mono text-rose-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-lg p-3.5 text-xs">
            <div className="font-semibold text-slate-200">
              Simulated Demo Mode
            </div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Ledger entries are simulated for demonstration. Live PayPal API credentials are not connected.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#070B19]/95 backdrop-blur border-b border-slate-800/80 px-4 flex items-center justify-between">
        <span className="font-display text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
          PAYPAL <span className="text-blue-400">PROOF</span>
        </span>
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          className="p-2 text-slate-300 hover:text-white rounded-lg"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-20 bg-[#050814]/95 backdrop-blur p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                    : "text-slate-300 hover:bg-slate-800/40"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="text-xs font-mono text-rose-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        {/* Top Bar */}
        <div className="border-b border-slate-800/80 bg-[#050814] px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Environment: Simulated Demo Data · Zero-Trust Verification
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadCsvAuditReport(filteredTransactions)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0A0F1F] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export Audit CSV</span>
            </button>
            <button
              onClick={() => handleNavigate("verify")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Verify Order</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
          {/* DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <>
              {/* KPI Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-5">
                  <div className="text-xs text-slate-400">
                    Total Verified Payments (Demo)
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-mono font-semibold text-emerald-400">
                      ${metrics.verifiedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {metrics.verifiedCount} txns
                    </span>
                  </div>
                </div>

                <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-5">
                  <div className="text-xs text-slate-400">
                    Pending Settlement (Demo)
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-mono font-semibold text-amber-400">
                      ${metrics.pendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {metrics.pendingCount} txns
                    </span>
                  </div>
                </div>

                <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-5">
                  <div className="text-xs text-slate-400">
                    Flagged Discrepancies (Demo)
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-mono font-semibold text-rose-400">
                      ${metrics.flaggedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {metrics.flaggedCount} txns
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart + Fraud Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <VolumeChart />
                </div>

                <div className="lg:col-span-5 bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-slate-100">
                      Fraud Warning Notifications
                    </h3>
                    <button
                      onClick={() => handleNavigate("alerts")}
                      className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      View all
                    </button>
                  </div>

                  {activeAlerts.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-slate-400 py-8">
                      No active fraud warnings.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeAlerts.slice(0, 3).map((alert) => (
                        <div
                          key={alert.id}
                          className="bg-[#050814] border border-slate-800/80 rounded-lg p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
                              <AlertTriangle
                                className="w-3.5 h-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span>{alert.severity}</span>
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {alert.transactionId}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-slate-100">
                            {alert.title}
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() =>
                                handleInvestigateTransaction(alert.transactionId)
                              }
                              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                            >
                              <span>AI Investigate</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDismissAlert(alert.id)}
                              className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-100">
                    Recent Transactions
                  </h3>
                  <button
                    onClick={() => handleNavigate("transactions")}
                    className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    Full ledger
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-xs text-slate-400">
                        <th className="py-3 px-5 font-medium">Payment ID</th>
                        <th className="py-3 px-5 font-medium">Counterparty</th>
                        <th className="py-3 px-5 font-medium">Date</th>
                        <th className="py-3 px-5 font-medium text-right">
                          Amount
                        </th>
                        <th className="py-3 px-5 font-medium">Status</th>
                        <th className="py-3 px-5 font-medium text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {DEMO_TRANSACTIONS.slice(0, 5).map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="py-3 px-5 font-mono text-xs text-slate-200 whitespace-nowrap">
                            {tx.id}
                          </td>
                          <td className="py-3 px-5 text-slate-200">
                            <div>{tx.counterparty}</div>
                            <div className="text-xs text-slate-500">
                              {tx.origin}
                            </div>
                          </td>
                          <td className="py-3 px-5 font-mono text-xs text-slate-400 whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="py-3 px-5 font-mono text-right text-slate-100 whitespace-nowrap">
                            {tx.amount.toFixed(2)} {tx.currency}
                          </td>
                          <td className="py-3 px-5">
                            <StatusBadge status={tx.status} />
                          </td>
                          <td className="py-3 px-5 text-right whitespace-nowrap">
                            <button
                              onClick={() =>
                                handleInvestigateTransaction(tx.id)
                              }
                              className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TRANSACTIONS VIEW */}
          {activeTab === "transactions" && (
            <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, PayPal Order ID, or counterparty..."
                    className="w-full bg-[#050814] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-[#050814] border border-slate-800 rounded-lg">
                    {(["All", "Verified", "Pending", "Flagged"] as const).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                            statusFilter === status
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => downloadJsonAuditReport(filteredTransactions)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#050814] hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-xs text-slate-400">
                      <th className="py-3 px-5 font-medium">Payment ID</th>
                      <th className="py-3 px-5 font-medium">PayPal Order ID</th>
                      <th className="py-3 px-5 font-medium">Counterparty</th>
                      <th className="py-3 px-5 font-medium">Date</th>
                      <th className="py-3 px-5 font-medium text-right">
                        Amount
                      </th>
                      <th className="py-3 px-5 font-medium">Status</th>
                      <th className="py-3 px-5 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-sm text-slate-400"
                        >
                          No transactions match your current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="py-3.5 px-5 font-mono text-xs text-slate-200 whitespace-nowrap">
                            {tx.id}
                          </td>
                          <td className="py-3.5 px-5 font-mono text-xs text-slate-400 whitespace-nowrap">
                            {tx.paypalOrderId}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="text-slate-200">
                              {tx.counterparty}
                            </div>
                            <div className="text-xs text-slate-500">
                              {tx.origin} · {tx.payerEmail}
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-mono text-xs text-slate-400 whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="py-3.5 px-5 font-mono text-right text-slate-100 whitespace-nowrap">
                            {tx.amount.toFixed(2)} {tx.currency}
                          </td>
                          <td className="py-3.5 px-5">
                            <StatusBadge status={tx.status} />
                          </td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-3">
                            <button
                              onClick={() =>
                                handleVerifyTransaction(tx.paypalOrderId)
                              }
                              className="text-xs text-slate-300 hover:text-white cursor-pointer"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() =>
                                handleInvestigateTransaction(tx.id)
                              }
                              className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                            >
                              AI Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VERIFY PAYMENT VIEW */}
          {activeTab === "verify" && (
            <VerificationScreen
              transactions={DEMO_TRANSACTIONS}
              initialOrderId={selectedOrderIdForVerify}
            />
          )}

          {/* AI INVESTIGATOR VIEW */}
          {activeTab === "investigator" && (
            <AIInvestigator
              transactions={DEMO_TRANSACTIONS}
              selectedTransactionId={selectedTxIdForAI}
            />
          )}

          {/* FRAUD ALERTS VIEW */}
          {activeTab === "alerts" && (
            <div className="space-y-4">
              {activeAlerts.length === 0 ? (
                <div className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-10 text-center text-sm text-slate-400">
                  All fraud warnings have been reviewed and dismissed.
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-[#0A0F1F] border border-slate-800/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-semibold text-rose-400">
                          {alert.severity}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-slate-400">
                          {alert.transactionId}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-slate-500">
                          {alert.detectedAt}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-100">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-slate-400 max-w-2xl">
                        {alert.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() =>
                          handleInvestigateTransaction(alert.transactionId)
                        }
                        className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
                      >
                        Investigate with AI
                      </button>
                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#050814] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* API SECURITY VIEW */}
          {activeTab === "security" && <SecurityArchitecture />}
        </div>
      </main>
    </div>
  );
}
