import { randomUUID } from 'crypto';
import { getConfig, getTreasuryWallet, recordFee } from './store.js';
import type { AssetType, Chain, Network, FeeRecord } from '../types.js';

export interface FeeBreakdown {
  originalAmount: string;
  recipientAmount: string;
  feeAmount: string;
  feePercent: number;
  treasuryWalletId: string | null;
}

export function calculateFee(amount: string, asset: AssetType, chain: Chain, network: Network): FeeBreakdown {
  const config = getConfig();
  const feePercent = config.feePercent;
  const original = parseFloat(amount);

  // Determine decimal precision based on asset
  const decimals = asset === 'bitcoin' ? 0 : 6; // sats for BTC, 6 for USDC/USDT

  const fee = original * (feePercent / 100);
  const recipient = original - fee;

  // Round appropriately
  const feeRounded = decimals === 0
    ? Math.ceil(fee)  // round up for sats (always collect at least 1 sat)
    : parseFloat(fee.toFixed(decimals));
  const recipientRounded = decimals === 0
    ? original - feeRounded
    : parseFloat(recipient.toFixed(decimals));

  const treasury = getTreasuryWallet(chain, asset, network);

  return {
    originalAmount: amount,
    recipientAmount: recipientRounded.toString(),
    feeAmount: feeRounded.toString(),
    feePercent,
    treasuryWalletId: treasury?.walletId || null,
  };
}

export function logFee(
  walletId: string,
  asset: AssetType,
  chain: Chain,
  network: Network,
  amount: string,
  feeTaken: string,
  treasuryWalletId: string,
): void {
  const fee: FeeRecord = {
    id: randomUUID().slice(0, 8),
    walletId,
    asset,
    chain,
    network,
    amount,
    feeTaken,
    treasuryWalletId,
    timestamp: new Date().toISOString(),
  };
  recordFee(fee);
}
