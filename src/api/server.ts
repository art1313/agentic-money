import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { validateApiKey } from './auth.js';
import { addWallet, listWallets, getWallet, removeWallet, getConfig, listTreasuryWallets, getRevenueSummary } from '../lib/store.js';
import { calculateFee, logFee } from '../lib/fees.js';
import { generateMnemonic, deriveAddress, getDerivationPath, fetchBalance } from '../wallets/bitcoin.js';
import { deriveEvmAddress, fetchTokenBalance as fetchEvmTokenBalance, sendToken as sendEvmToken } from '../wallets/stablecoin.js';
import { deriveSolanaAddress, fetchTokenBalance as fetchSolTokenBalance, sendToken as sendSolToken } from '../wallets/solana.js';
import { getDefaultChain, CHAIN_ASSETS } from '../types.js';
import type { AssetType, Chain, Network, WalletRole, StoredWallet } from '../types.js';
import { randomUUID } from 'crypto';

const app = new Hono();

// --- Auth middleware ---
app.use('/v1/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || !validateApiKey(apiKey)) {
    return c.json({ ok: false, error: 'Invalid or missing API key. Set X-API-Key header.' }, 401);
  }
  await next();
});

// --- Helpers ---
function resolveAddress(w: StoredWallet): string {
  if (w.chain === 'bitcoin') return deriveAddress(w.mnemonic, w.network, w.addressIndex);
  if (w.chain === 'solana') return deriveSolanaAddress(w.mnemonic, w.addressIndex);
  return deriveEvmAddress(w.mnemonic, w.addressIndex);
}

function walletToPublic(w: StoredWallet) {
  return {
    id: w.id,
    name: w.name,
    asset: w.asset,
    chain: w.chain,
    role: w.role,
    network: w.network,
    address: resolveAddress(w),
  };
}

// --- Routes ---

// Create wallet
app.post('/v1/wallets', async (c) => {
  try {
    const body = await c.req.json();
    const asset = (body.asset || 'bitcoin') as AssetType;
    const chain = (body.chain || getDefaultChain(asset)) as Chain;
    const network = (body.network || 'testnet') as Network;
    const role = (body.role || (asset === 'bitcoin' ? 'savings' : 'spending')) as WalletRole;
    const name = body.name || `${asset}-${chain}-${role}`;

    if (!CHAIN_ASSETS[chain]?.includes(asset)) {
      return c.json({ ok: false, error: `${asset} not available on ${chain}` }, 400);
    }

    const mnemonic = body.mnemonic || generateMnemonic();
    const id = randomUUID().slice(0, 8);

    let derivationPath: string;
    if (chain === 'bitcoin') derivationPath = getDerivationPath(network);
    else if (chain === 'solana') derivationPath = "m/44'/501'/0'/0'";
    else derivationPath = "m/44'/60'/0'/0";

    const stored: StoredWallet = {
      id, name, asset, chain, role, network,
      mnemonic, derivationPath, addressIndex: 0,
    };

    addWallet(stored);

    return c.json({
      ok: true,
      data: {
        ...walletToPublic(stored),
        mnemonic,
        createdAt: new Date().toISOString(),
      },
    }, 201);
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 500);
  }
});

// List wallets
app.get('/v1/wallets', (c) => {
  const wallets = listWallets().map(walletToPublic);
  return c.json({ ok: true, data: wallets });
});

// Get wallet
app.get('/v1/wallets/:id', (c) => {
  const w = getWallet(c.req.param('id'));
  if (!w) return c.json({ ok: false, error: 'Wallet not found' }, 404);
  return c.json({ ok: true, data: walletToPublic(w) });
});

// Delete wallet
app.delete('/v1/wallets/:id', (c) => {
  const removed = removeWallet(c.req.param('id'));
  if (!removed) return c.json({ ok: false, error: 'Wallet not found' }, 404);
  return c.json({ ok: true, data: { removed: c.req.param('id') } });
});

// Get balance
app.get('/v1/wallets/:id/balance', async (c) => {
  try {
    const w = getWallet(c.req.param('id'));
    if (!w) return c.json({ ok: false, error: 'Wallet not found' }, 404);

    let balance: string;
    let unit: string;
    const address = resolveAddress(w);

    if (w.chain === 'bitcoin') {
      balance = await fetchBalance(address, w.network);
      unit = 'sats';
    } else if (w.chain === 'solana') {
      balance = await fetchSolTokenBalance(w.mnemonic, w.asset, w.network, w.addressIndex);
      unit = w.asset.toUpperCase();
    } else {
      balance = await fetchEvmTokenBalance(w.mnemonic, w.asset, w.network, w.addressIndex);
      unit = w.asset.toUpperCase();
    }

    return c.json({
      ok: true,
      data: { walletId: w.id, asset: w.asset, chain: w.chain, network: w.network, address, balance, unit },
    });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 500);
  }
});

// Send (with fee deduction)
app.post('/v1/wallets/:id/send', async (c) => {
  try {
    const w = getWallet(c.req.param('id'));
    if (!w) return c.json({ ok: false, error: 'Wallet not found' }, 404);

    const body = await c.req.json();
    const { to, amount } = body;
    if (!to || !amount) return c.json({ ok: false, error: 'Missing "to" and/or "amount"' }, 400);

    // Calculate fee
    const fee = calculateFee(amount, w.asset, w.chain, w.network);

    let txid: string;
    let feeTxid: string | null = null;
    const from = resolveAddress(w);

    if (w.chain === 'solana') {
      // Send net amount to recipient
      txid = await sendSolToken(w.mnemonic, w.asset, w.network, to, fee.recipientAmount, w.addressIndex);
      // Send fee to treasury (if treasury wallet exists)
      if (fee.treasuryWalletId && parseFloat(fee.feeAmount) > 0) {
        const treasuryWallet = getWallet(fee.treasuryWalletId);
        if (treasuryWallet) {
          const treasuryAddr = resolveAddress(treasuryWallet);
          try {
            feeTxid = await sendSolToken(w.mnemonic, w.asset, w.network, treasuryAddr, fee.feeAmount, w.addressIndex);
          } catch { /* fee transfer failed, log but don't block */ }
        }
      }
    } else if (w.chain === 'base') {
      txid = await sendEvmToken(w.mnemonic, w.asset, w.network, to, fee.recipientAmount, w.addressIndex);
      if (fee.treasuryWalletId && parseFloat(fee.feeAmount) > 0) {
        const treasuryWallet = getWallet(fee.treasuryWalletId);
        if (treasuryWallet) {
          const treasuryAddr = resolveAddress(treasuryWallet);
          try {
            feeTxid = await sendEvmToken(w.mnemonic, w.asset, w.network, treasuryAddr, fee.feeAmount, w.addressIndex);
          } catch { /* fee transfer failed, log but don't block */ }
        }
      }
    } else {
      return c.json({ ok: false, error: 'Bitcoin send via API coming soon. Use CLI: agm send' }, 501);
    }

    // Log the fee
    logFee(w.id, w.asset, w.chain, w.network, amount, fee.feeAmount, fee.treasuryWalletId || 'none');

    return c.json({
      ok: true,
      data: {
        txid, from, to,
        amount: fee.recipientAmount,
        originalAmount: amount,
        fee: fee.feeAmount,
        feePercent: fee.feePercent,
        feeTxid,
        asset: w.asset, chain: w.chain, network: w.network,
        status: 'broadcast',
      },
    });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 500);
  }
});

// Receive address
app.get('/v1/wallets/:id/receive', (c) => {
  const w = getWallet(c.req.param('id'));
  if (!w) return c.json({ ok: false, error: 'Wallet not found' }, 404);

  return c.json({
    ok: true,
    data: { walletId: w.id, address: resolveAddress(w), asset: w.asset, chain: w.chain, network: w.network },
  });
});

// Revenue dashboard
app.get('/v1/revenue', (c) => {
  const summary = getRevenueSummary();
  return c.json({ ok: true, data: summary });
});

// Treasury wallets
app.get('/v1/treasury', (c) => {
  const treasury = listTreasuryWallets();
  const enriched = treasury.map(t => {
    const w = getWallet(t.walletId);
    return {
      ...t,
      address: w ? resolveAddress(w) : 'unknown',
    };
  });
  return c.json({ ok: true, data: enriched });
});

// Fee config
app.get('/v1/config/fees', (c) => {
  const config = getConfig();
  return c.json({ ok: true, data: { feePercent: config.feePercent } });
});

// Health
app.get('/health', (c) => c.json({ status: 'ok', version: '0.1.0' }));

export function startServer(port: number = 3141) {
  console.log(`🏦 Agentic Money API running on http://localhost:${port}`);
  console.log(`   Endpoints: POST/GET /v1/wallets, GET /v1/wallets/:id/balance, etc.`);
  serve({ fetch: app.fetch, port });
}
