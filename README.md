# 📦 Delivery Delay Escalator — Autonomous Logistics Agent

An enterprise full-stack Agentic AI logistics application designed to analyze parcel tracking evidence, detect delivery delays and discrepancies, prevent duplicate escalations with cryptographic SHA-256 audit trails, and require strict **Human-in-the-Loop** approval before generating support tickets.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Priya0611R/DeliveryDelayEscalator-1)

---

## 🚀 One-Click Cloud Deployment

### Option 1: Render (Free Web Service)
1. Click the **[Deploy to Render](https://render.com/deploy?repo=https://github.com/Priya0611R/DeliveryDelayEscalator-1)** button above.
2. Sign in with GitHub.
3. Render auto-detects `render.yaml` with the build and start commands (`node server.js`).
4. Click **Apply** to deploy your live public URL (e.g. `https://delivery-delay-escalator.onrender.com`).

### Option 2: Railway
1. Go to [railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `Priya0611R/DeliveryDelayEscalator-1`.
4. Railway will build the `Dockerfile` automatically and provide a public domain.

### Option 3: Docker Local/Cloud
```bash
docker build -t delivery-delay-escalator .
docker run -p 3000:3000 delivery-delay-escalator
```

---

## 🛠️ Key Architectural Features

- **7-Stage Workflow Pipeline:**
  1. Input Validation (RFC-compliant order IDs & dates)
  2. Evidence Acquisition (Multi-source synthetic HTML or Browserbase Cloud Stealth Agent)
  3. Cheerio Parsing & SHA-256 Cryptographic Audit
  4. Tracking Event Deduplication
  5. Deterministic Decision Engine
  6. Support Proposal Generation
  7. **Human-in-the-Loop Approval Gateway**
- **Strict Human Authorization:** Zero autonomous tickets or financial refunds are dispatched without explicit human sign-off.
- **Idempotency Protection:** Prevents duplicate proposals and tickets for identical `(order_id, scenario)` runs.
- **Browserbase Integration:** Cloud browser automation via CDP with automatic fallback to synthetic demo fixtures if network latency occurs.
- **Real-Time Enterprise Dashboard:** 7 modular views including operations overview, live approval queues, ticket registries, cryptographic audit hashes, history logs, and automated diagnostics.

---

## 💻 Local Quickstart

```bash
# Clone the repository
git clone https://github.com/Priya0611R/DeliveryDelayEscalator-1.git
cd DeliveryDelayEscalator-1

# Install dependencies
npm install

# Start development server
npm start
```

Open `http://127.0.0.1:3000` in your browser.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=3000

# Optional: Browserbase API key for cloud browser automation
BROWSERBASE_API_KEY=your_browserbase_api_key_here
```
