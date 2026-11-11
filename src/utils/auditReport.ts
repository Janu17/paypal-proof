import { Transaction } from "../types/transaction";

export function downloadCsvAuditReport(transactions: Transaction[], filenamePrefix = "paypal-proof-audit") {
  const headers = [
    "Transaction ID",
    "PayPal Order ID",
    "Data Origin",
    "Date",
    "Counterparty",
    "Payer Email",
    "Description",
    "Amount",
    "Expected Amount",
    "Currency",
    "Status",
    "Risk Score",
    "OAuth Checked",
    "Webhook Signature Valid",
    "Discrepancy Note",
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.paypalOrderId,
    t.origin,
    t.date,
    t.counterparty,
    t.payerEmail,
    t.description,
    t.amount.toFixed(2),
    t.expectedAmount.toFixed(2),
    t.currency,
    t.status,
    String(t.riskScore),
    t.evidence.oauthChecked ? "YES" : "NO",
    t.evidence.webhookSignatureValid ? "YES" : "NO",
    t.discrepancyNote ?? "",
  ]);

  const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const csvContent = [
    `# PAYPAL PROOF AUDIT REPORT — GENERATED ${new Date().toISOString()}`,
    `# NOTICE: Records marked "Simulated Demo" are demonstration data, not live PayPal settlements.`,
    headers.map(escapeCell).join(","),
    ...rows.map((r) => r.map(escapeCell).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function downloadJsonAuditReport(transactions: Transaction[], filenamePrefix = "paypal-proof-audit") {
  const payload = {
    reportTitle: "PAYPAL PROOF — Transaction Verification Audit Report",
    generatedAt: new Date().toISOString(),
    securityNotice:
      "Records labeled 'Simulated Demo' are for demonstration only. Never treat a database-only record as proof of payment.",
    recordCount: transactions.length,
    transactions,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  triggerDownload(blob, `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.json`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
