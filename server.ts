import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini API on the server side only
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "paypal-proof-api" });
});

function buildFallbackInvestigation(
  transaction: Record<string, unknown> | null | undefined,
  customQuery: string | undefined,
  reason: string
) {
  const status = typeof transaction?.status === "string" ? transaction.status : "Unknown";
  const txId = typeof transaction?.id === "string" ? transaction.id : "Custom Query";
  const note =
    typeof transaction?.discrepancyNote === "string"
      ? transaction.discrepancyNote
      : customQuery || "No specific discrepancy note provided.";

  const riskLevel =
    status === "Flagged" ? "HIGH" : status === "Pending" ? "MEDIUM" : "LOW";

  return {
    riskLevel,
    summary: `[SIMULATED FALLBACK] Automated rule-based review for ${txId} (Status: ${status}). Live Gemini AI analysis was unavailable (${reason}).`,
    discrepancies: [
      note,
      "Live AI reasoning was not executed; findings below are derived from local policy rules only.",
    ],
    verificationChecks: [
      {
        check: "Server-Side PayPal Orders v2 Check",
        status: status === "Verified" ? "PASS" : "REQUIRES_VERIFICATION",
        detail: "A local database record alone is never sufficient proof of payment.",
      },
      {
        check: "Webhook Signature Integrity",
        status: status === "Flagged" ? "WARNING" : "PENDING",
        detail: "Confirm PAYPAL-TRANSMISSION-SIG before releasing goods or services.",
      },
    ],
    recommendedActions: [
      "Verify the Order ID directly in the PayPal Verification screen or PayPal Business Dashboard.",
      "Do not fulfill digital or physical goods until PayPal Orders v2 returns status COMPLETED.",
    ],
    isSimulatedFallback: true,
    fallbackReason: reason,
  };
}

// AI Investigator Endpoint
app.post("/api/investigate", async (req, res) => {
  const { transaction, customQuery } = req.body ?? {};

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      analysis: buildFallbackInvestigation(
        transaction,
        customQuery,
        "GEMINI_API_KEY is not configured on the server"
      ),
    });
  }

  try {
    const prompt = `You are a senior fintech fraud & payment verification investigator for PAYPAL PROOF.
Analyze the following payment record and/or user question.
CRITICAL SECURITY RULE: Never assume or claim a payment was actually received by PayPal unless cryptographic webhook signature verification AND server-to-server PayPal Orders/Payments API confirmation both succeeded. A local database record alone is NEVER proof of payment.

${transaction ? `Transaction Record:\n${JSON.stringify(transaction, null, 2)}` : ""}
${customQuery ? `Investigator Question / Context:\n${customQuery}` : ""}

Provide a concise, authoritative forensic analysis.`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out after 15 seconds")), 15000)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "You are a precise fintech payment forensics expert. Return structured JSON only. Be direct, technical, and actionable for creators, freelancers, and small businesses.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: {
                type: Type.STRING,
                description: "One of: LOW, MEDIUM, HIGH, CRITICAL",
              },
              summary: {
                type: Type.STRING,
                description: "2-3 sentence executive summary of the finding.",
              },
              discrepancies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of specific anomalies, mismatches, or missing proofs.",
              },
              verificationChecks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    check: { type: Type.STRING },
                    status: { type: Type.STRING },
                    detail: { type: Type.STRING },
                  },
                },
                description: "Breakdown of API, webhook, and ledger checks.",
              },
              recommendedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Concrete next steps before fulfilling goods or services.",
              },
            },
          },
        },
      }),
      timeoutPromise,
    ]);

    const rawText = (response.text ?? "{}").trim();
    const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleanedText);
    return res.json({ analysis: { ...parsed, isSimulatedFallback: false } });
  } catch (error: unknown) {
    console.error("AI Investigation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to run AI investigation.";
    return res.json({
      analysis: buildFallbackInvestigation(transaction, customQuery, message),
    });
  }
});

const PAYPAL_SANDBOX_BASE_URL = "https://api-m.sandbox.paypal.com";

async function getPayPalSandboxToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal Sandbox credentials are not configured on the server.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch(`${PAYPAL_SANDBOX_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) {
    throw new Error(`PayPal Sandbox OAuth2 failed (${tokenRes.status}).`);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };
  return tokenData.access_token;
}

// Create a $25.00 USD PayPal Sandbox Order
app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const envAppUrl = process.env.APP_URL?.trim();
    const isValidEnvUrl =
      Boolean(envAppUrl) &&
      !envAppUrl!.includes("MY_APP_URL") &&
      !envAppUrl!.includes("localhost");

    const forwardedProto = (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() || "https";
    const forwardedHost = (req.headers["x-forwarded-host"] as string)?.split(",")[0]?.trim() || req.get("host");
    const derivedOrigin =
      (req.headers.origin && !req.headers.origin.includes("localhost") ? req.headers.origin : null) ||
      (forwardedHost ? `${forwardedProto}://${forwardedHost}` : "https://ais-dev-eqiglmvharjuqffyaq7llo-129415821728.us-east5.run.app");

    const baseUrl = (isValidEnvUrl ? envAppUrl! : derivedOrigin).replace(/\/+$/, "");

    const accessToken = await getPayPalSandboxToken();
    const orderRes = await fetch(`${PAYPAL_SANDBOX_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: "PAYPAL PROOF Sandbox Verification Test ($25.00 USD)",
            amount: {
              currency_code: "USD",
              value: "25.00",
            },
          },
        ],
        application_context: {
          return_url: `${baseUrl}/?paypal=approved`,
          cancel_url: `${baseUrl}/?paypal=cancelled`,
          user_action: "PAY_NOW",
        },
      }),
    });

    const orderData = (await orderRes.json()) as {
      id?: string;
      status?: string;
      links?: Array<{ rel?: string; href?: string }>;
      message?: string;
    };

    if (!orderRes.ok || !orderData.id) {
      return res.status(orderRes.status || 502).json({
        error: orderData.message || "Failed to create PayPal Sandbox order.",
      });
    }

    const approvalUrl =
      orderData.links?.find((l) => l.rel === "approve")?.href ?? null;

    return res.json({
      orderId: orderData.id,
      status: orderData.status ?? "CREATED",
      approvalUrl,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create Sandbox order.";
    return res.status(500).json({ error: message });
  }
});

// Capture an approved PayPal Sandbox Order
app.post("/api/paypal/capture-order", async (req, res) => {
  const { orderId } = req.body ?? {};
  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ error: "A valid PayPal Order ID is required." });
  }

  try {
    const accessToken = await getPayPalSandboxToken();
    const captureRes = await fetch(
      `${PAYPAL_SANDBOX_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId.trim())}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = (await captureRes.json()) as {
      id?: string;
      status?: string;
      message?: string;
      purchase_units?: Array<{
        payments?: {
          captures?: Array<{
            id?: string;
            status?: string;
            amount?: { value?: string; currency_code?: string };
          }>;
        };
      }>;
    };

    if (!captureRes.ok) {
      return res.status(captureRes.status || 502).json({
        error: captureData.message || "Failed to capture PayPal Sandbox order.",
        status: captureData.status ?? "CAPTURE_FAILED",
      });
    }

    const firstCapture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

    return res.json({
      orderId: captureData.id ?? orderId.trim(),
      status: captureData.status ?? "UNKNOWN",
      captureId: firstCapture?.id ?? null,
      amount: firstCapture?.amount?.value ?? null,
      currency: firstCapture?.amount?.currency_code ?? null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to capture Sandbox order.";
    return res.status(500).json({ error: message });
  }
});

// Secure PayPal API Verification Scaffold
// Never exposes client secrets to the frontend; never marks DB-only records as verified.
app.post("/api/paypal/verify", async (req, res) => {
  const { paymentId } = req.body;

  if (!paymentId || typeof paymentId !== "string") {
    return res.status(400).json({ error: "A valid PayPal Payment or Order ID is required." });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const paypalBaseUrl =
    process.env.PAYPAL_ENV === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  if (!clientId || !clientSecret) {
    return res.status(200).json({
      verified: false,
      demoMode: true,
      paymentId: paymentId.trim(),
      status: "UNVERIFIED_DEMO_MODE",
      message:
        "Live PayPal API credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are not configured on the server. In accordance with PAYPAL PROOF security policy, this payment cannot be marked as verified.",
      checks: {
        oauthToken: "SKIPPED_NO_CREDENTIALS",
        ordersApiLookup: "NOT_EXECUTED",
        webhookSignature: "NOT_VERIFIED",
        databaseOnlyTrust: "REJECTED_BY_POLICY",
      },
    });
  }

  try {
    // 1. Obtain OAuth2 access token server-side
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      return res.status(502).json({
        verified: false,
        error: "Failed to authenticate with PayPal OAuth2 endpoint.",
      });
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    // 2. Query PayPal Orders v2 API
    const orderRes = await fetch(
      `${paypalBaseUrl}/v2/checkout/orders/${encodeURIComponent(paymentId.trim())}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!orderRes.ok) {
      return res.status(404).json({
        verified: false,
        paymentId: paymentId.trim(),
        status: "NOT_FOUND_IN_PAYPAL",
        message: "Order ID was not found in PayPal's authoritative ledger.",
      });
    }

    const orderData = (await orderRes.json()) as {
      id: string;
      status: string;
      purchase_units?: Array<{ amount?: { currency_code?: string; value?: string } }>;
    };

    const isCompleted = orderData.status === "COMPLETED";

    return res.json({
      verified: isCompleted,
      demoMode: false,
      paymentId: orderData.id,
      status: orderData.status,
      amount: orderData.purchase_units?.[0]?.amount ?? null,
      message: isCompleted
        ? "Payment cryptographically confirmed via PayPal Orders v2 API."
        : `PayPal returned status '${orderData.status}'. Do not fulfill until status is COMPLETED.`,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "PayPal verification request failed.";
    return res.status(500).json({ verified: false, error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PAYPAL PROOF server running on http://localhost:${PORT}`);
  });
}

startServer();
