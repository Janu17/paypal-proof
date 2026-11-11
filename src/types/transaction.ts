export type TransactionStatus = "Verified" | "Pending" | "Flagged";

export type DataOrigin = "Simulated Demo" | "PayPal API";

export interface VerificationEvidence {
  oauthChecked: boolean;
  webhookSignatureValid: boolean;
  amountMatchesInvoice: boolean;
  currencyMatchesInvoice: boolean;
  payerEmailVerified: boolean;
}

export interface Transaction {
  id: string;
  paypalOrderId: string;
  counterparty: string;
  payerEmail: string;
  description: string;
  amount: number;
  expectedAmount: number;
  currency: "USD" | "EUR" | "GBP" | "CAD";
  date: string;
  status: TransactionStatus;
  origin: DataOrigin;
  riskScore: number;
  discrepancyNote?: string;
  evidence: VerificationEvidence;
}

export interface FraudAlert {
  id: string;
  transactionId: string;
  severity: "Critical" | "High" | "Medium";
  title: string;
  description: string;
  detectedAt: string;
  dismissed: boolean;
}

export interface AIInvestigationResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  discrepancies: string[];
  verificationChecks: Array<{
    check: string;
    status: string;
    detail: string;
  }>;
  recommendedActions: string[];
  isSimulatedFallback?: boolean;
  fallbackReason?: string;
}
