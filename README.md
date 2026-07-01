# Agentic Money

Money for AI agents. Bitcoin for savings, stablecoins for spending.

AI models [overwhelmingly prefer](https://www.btcpolicy.org/articles/study-ai-models-overwhelmingly-prefer-bitcoin-and-digital-native-money-over-traditional-fiat) Bitcoin as store of value (79.1%) and stablecoins for payments (53.2%). Agentic Money implements this two-tier model as a CLI, API, and SDK that any AI agent can use.

## Quick Start

```bash
npm install -g agentic-money
agm wallet create --asset bitcoin --network testnet
agm wallet create --asset usdc --chain solana --network testnet
agm balance
```

## The Two-Tier Model

| Tier | Asset | Role | Chains |
|------|-------|------|--------|
| Savings | Bitcoin | Store of value | Bitcoin (L1) |
| Spending | USDC, USDT | Payments | Solana, Base |

## CLI Commands

```bash
# Wallets
agm wallet create --asset <bitcoin|usdc|usdt> --chain <bitcoin|solana|base> --network <testnet|mainnet>
agm wallet list
agm wallet show <id>
agm wallet remove <id>

# Balances
agm balance [id]

# Send & Receive
agm send <id> --to <address> --amount <amount>
agm receive <id> [--new]

# Config
agm config show
agm config set <key> <value>

# API Server
agm serve [--port 3141]
agm api-key create [--name <name>]
agm api-key list
```

## REST API

Start the server:

```bash
agm api-key create --name myapp
# Save the key: agm_abc123...

agm serve
# Server runs on http://localhost:3141
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/wallets` | Create a wallet |
| `GET` | `/v1/wallets` | List all wallets |
| `GET` | `/v1/wallets/:id` | Get wallet details |
| `DELETE` | `/v1/wallets/:id` | Delete a wallet |
| `GET` | `/v1/wallets/:id/balance` | Get balance |
| `POST` | `/v1/wallets/:id/send` | Send funds |
| `GET` | `/v1/wallets/:id/receive` | Get receive address |
| `GET` | `/health` | Health check |

All `/v1/*` endpoints require `X-API-Key` header.

### Example

```bash
# Create a USDC wallet on Solana
curl -X POST http://localhost:3141/v1/wallets \
  -H "X-API-Key: agm_yourkey" \
  -H "Content-Type: application/json" \
  -d '{"asset": "usdc", "chain": "solana", "network": "testnet"}'

# Check balance
curl http://localhost:3141/v1/wallets/abc123/balance \
  -H "X-API-Key: agm_yourkey"
```

## SDKs

### TypeScript

```bash
npm install @agentic-money/sdk
```

```typescript
import { AgenticMoney } from '@agentic-money/sdk';

const agm = new AgenticMoney({ apiKey: 'agm_yourkey' });

// Create wallets
const savings = await agm.createWallet({ asset: 'bitcoin', network: 'testnet' });
const spending = await agm.createWallet({ asset: 'usdc', chain: 'solana' });

// Check balance
const balance = await agm.getBalance(savings.id);

// Send stablecoins
await agm.send(spending.id, { to: 'recipient_address', amount: '10.00' });
```

### Python

```bash
pip install agentic-money
```

```python
from agentic_money import AgenticMoney

agm = AgenticMoney("agm_yourkey")

# Create wallets
savings = agm.create_wallet(asset="bitcoin", network="testnet")
spending = agm.create_wallet(asset="usdc", chain="solana")

# Check balance
balance = agm.get_balance(savings["id"])

# Send stablecoins
agm.send(spending["id"], to="recipient_address", amount="10.00")
```

## Supported Chains & Assets

| Chain | Assets | Network |
|-------|--------|---------|
| Bitcoin | BTC | mainnet, testnet |
| Solana | USDC, USDT | mainnet, devnet |
| Base | USDC, USDT | mainnet, sepolia |

## Architecture

```
agm CLI ──> core library ──> Bitcoin (BIP84 native segwit)
                          ──> Solana (SPL tokens)
                          ──> Base (ERC20 tokens)

agm serve ──> Hono REST API ──> same core library
                             ──> X-API-Key auth

SDKs ──> REST API ──> your agent
```

## Why Two Tiers?

The BTC Policy Institute tested leading AI models on monetary preferences. The results:

- **79.1%** chose Bitcoin as optimal store of value
- **53.2%** chose stablecoins as optimal medium of exchange
- **0%** chose fiat for any monetary function

No existing tool combines both. Coinbase AgentKit, Skyfire, and Circle are stablecoin-only. Lightning Labs and Nunchuk are Bitcoin-only. Agentic Money is the only agent wallet with both.

## License

MIT
