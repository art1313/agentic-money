# Agentic Money — Market Research (June 2026)

## The Landscape Has Moved Fast

The agent payments space has exploded since we started this project. Here's where things stand.

---

## Major Players & What They've Built

### Tier 1: Big Tech + Finance (the 800-lb gorillas)

| Player | What | Status |
|--------|------|--------|
| **Coinbase** | x402 protocol (HTTP-native stablecoin payments), AgentKit SDK, Agentic Wallets (Feb 2026) | x402 moved to Linux Foundation. Backed by Google, Stripe, Visa, Mastercard, Amex, AWS, Shopify, Microsoft |
| **AWS + Coinbase + Stripe** | Amazon Bedrock AgentCore Payments — agents make USDC purchases via x402 + Stripe/Privy wallets | Launched May 2026 |
| **Stripe** | Privy wallet infrastructure for agent payments, co-author of Machine Payments Protocol (MPP) | Production |
| **Circle** | Agent Stack — open-source infra for agents to hold/spend USDC with human-set controls | Launched May 2026 |

### Tier 2: Crypto-Native Startups

| Player | What | Funding |
|--------|------|---------|
| **Skyfire** | Agent service discovery + stablecoin micropayments | $9M seed (a16z crypto, Coinbase Ventures, Circle, Ripple) |
| **Payman** | Agent-to-human payments, fiat + USDC | Backed by financial institutions |
| **Nevermined** | Agent-to-agent payment platform + marketplace | Active |
| **MoonPay** | Open Wallet Standard + MoonPay Agents (non-custodial, CLI-based) | Launched Feb-Mar 2026 |

### Tier 3: Bitcoin-Specific

| Player | What | Status |
|--------|------|--------|
| **Lightning Labs** | lightning-agent-tools (open-source), L402 protocol | Released Feb 2026. Cloudflare processing 1B+ HTTP 402 responses/day |
| **Nunchuk** | Bitcoin CLI + Agent Skills — bounded authority model with multi-key wallets | MIT-licensed, open source |
| **LQWD Technologies** | AI-driven Lightning Network management | Testing |

### Tier 4: Chain-Specific SDKs

| Player | What |
|--------|------|
| **Polygon** | Polygon Agent CLI — wallets, stablecoins, bridging, on-chain identity |
| **Coinbase/Base** | AgentKit — open-source SDK for agent wallets on Base |
| **BNB Chain** | ERC-8004 standard for verifiable on-chain agent identities |

---

## Emerging Standards & Protocols

| Protocol | Led By | Approach |
|----------|--------|----------|
| **x402** | Coinbase → Linux Foundation | HTTP 402 + stablecoin settlement. Dominant standard |
| **L402** | Lightning Labs | HTTP 402 + Lightning Network micropayments |
| **AP2** (Agent Payments Protocol) | Google | Agent-to-agent payment standard |
| **MPP** (Machine Payments Protocol) | Stripe + Tempo | Machine-to-machine payments |
| **KYA** (Know Your Agent) | Industry emerging | Compliance: bind agents to verified human authorizers |
| **Open Wallet Standard** | MoonPay | Cross-chain agent wallet interop |
| **ERC-8004** | BNB Chain | On-chain agent identity |

---

## Market Size

| Metric | Number | Source |
|--------|--------|--------|
| AI agents market (2025) | $7.84B | Multiple analysts |
| AI agents market (2030 projected) | $52.6B | CAGR 46.3% |
| Agentic AI market (2034 projected) | $139.2B | Fortune Business Insights |
| Agentic commerce (2025) | $547M–$1.9B | Varying definitions |
| Agentic commerce (2033 projected) | $5.2B | 32.5% CAGR |
| Agent e-commerce spending by 2030 | $190B–$385B | Morgan Stanley |
| AI-mediated consumer commerce by 2030 | $3T–$5T | McKinsey |
| Stablecoin volume (2025) | $33T | Up 72% YoY |

---

## Regulatory Landscape

- **No clear framework yet** — existing money transmitter laws assume human-decisioned transactions
- **KYA (Know Your Agent)** emerging as the compliance standard — binds agents to verified humans
- **Key requirements**: PCI DSS, SOC 2 Type II, AML protocols, KYC for agent ownership
- **IMF has published guidance** on how agentic AI will reshape payments
- **FATF 2025-2026 evaluation** focusing on AI-assisted compliance decisions
- **Bottom line**: Legal gray area. Companies building here need fintech counsel early

---

## What This Means for Us

### The Bad News
- **x402 is winning** — Coinbase got Google, Stripe, Visa, Mastercard, Amex, AWS, Microsoft, Shopify into a Linux Foundation consortium. This is becoming THE standard for agent payments
- **Big players are already here** — AWS+Coinbase+Stripe launched production agent payments in May 2026
- **Multiple open-source CLIs exist** — Polygon Agent CLI, Nunchuk CLI, Lightning Labs tools, Coinbase AgentKit
- Building another generic "agent wallet CLI" is not differentiated

### The Good News
- **Bitcoin is underserved** — x402 and most infra is stablecoin-first. Lightning Labs is the only serious Bitcoin play
- **Nunchuk's "bounded authority" model is smart but niche** — focused on custody, not payments
- **No one has nailed the "two-tier" model** — Bitcoin savings + stablecoin spending in one tool
- **The research narrative is unique** — "AI models prefer Bitcoin" is a defensible brand angle
- **Developer experience is still bad** — most solutions require understanding crypto infrastructure

---

## Recommended Next Steps

### Option A: Pivot to Protocol Layer
Join the x402 ecosystem. Build an x402-compatible agent wallet that uniquely supports Bitcoin (Lightning) alongside stablecoins. Most x402 implementations are stablecoin-only.

### Option B: Bitcoin-First Agent Infrastructure
Double down on the Bitcoin angle. Partner with or build on Lightning Labs' tools. The thesis: "Agents need a store of value (Bitcoin) AND a medium of exchange (stablecoins/Lightning)."

### Option C: Developer Experience Play
The existing tools are fragmented. Build the "one CLI to rule them all" — unified interface across Bitcoin, Lightning, USDC, multiple chains. Think "Homebrew for agent money."

### Option D: Vertical Focus
Pick one agent use case (e.g., coding agents buying API access, or research agents paying for data) and build the best payment experience for that specific workflow.
