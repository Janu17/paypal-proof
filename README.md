PayPal Proof

AI-powered PayPal payment verification and transaction investigation for creators, freelancers, and small businesses.

About

PayPal Proof helps users verify payment records against PayPal's authoritative Orders v2 API, investigate transaction discrepancies, and maintain more trustworthy payment records.

The project was created to address a common problem: payment dashboards can show a transaction as successful even when the payment has not actually been confirmed by the payment provider.

Key Features

- Server-side PayPal verification: Checks order information directly against PayPal's Orders v2 API.
- Order creation and capture: Supports the PayPal Sandbox checkout and capture workflow.
- Transaction investigation: Provides an investigation interface for reviewing transaction details and discrepancies.
- Risk and discrepancy indicators: Highlights suspicious or inconsistent transaction records.
- Dashboard: Displays payment summaries, flagged transactions, recent activity, and verification trends.
- AI-assisted investigation: Includes an investigation workflow with a rule-based fallback when the AI service is unavailable.

Technology

- React
- TypeScript
- JavaScript
- Node.js
- PayPal REST API
- PayPal Orders v2 API
- Google Gemini API
- Vite

PayPal Integration

PayPal Proof includes server-side endpoints for:

- Checking server health
- Creating PayPal orders
- Capturing approved orders
- Verifying orders and captured payments
- Investigating transaction records

The verified checkout demonstration uses the PayPal Sandbox. Sandbox transactions are test payments and do not represent real-money transfers.

Security

API credentials must remain on the server and must never be committed to the public repository.

Configure credentials through server-side environment variables:

- "PAYPAL_CLIENT_ID"
- "PAYPAL_CLIENT_SECRET"
- "GEMINI_API_KEY"

Use ".env.example" only for placeholder values. Never publish actual credentials.

Getting Started

1. Clone this repository.
2. Install the project dependencies using "npm install".
3. Configure the required server-side environment variables.
4. Start the development server using the project's configured development script.
5. Open the local application URL shown by the development server.

Use PayPal Sandbox credentials for testing. Do not use real payment credentials in development.

Project Status

PayPal Proof is an active hackathon project. PayPal Sandbox order creation, approval, capture, and server-side verification have been demonstrated. AI investigation includes a fallback mode when the Gemini service cannot be reached.

Hackathon

Built for the PayPal AI Hackathon — Build What's Next with PayPal and AI.

License

See the LICENSE file for licensing information.
