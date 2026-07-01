export type Network = 'mainnet' | 'testnet';
export type AssetType = 'bitcoin' | 'usdc' | 'usdt';
export type Chain = 'bitcoin' | 'base' | 'solana';
export type WalletRole = 'savings' | 'spending';

export interface WalletInfo {
  id: string;
  name: string;
  asset: AssetType;
  chain: Chain;
  role: WalletRole;
  network: Network;
  address: string;
  createdAt: string;
}

export interface WalletStore {
  version: number;
  wallets: StoredWallet[];
  config: AgmConfig;
  treasury: TreasuryWallet[];
  fees: FeeRecord[];
}

export interface TreasuryWallet {
  chain: Chain;
  asset: AssetType;
  network: Network;
  walletId: string; // references a StoredWallet
}

export interface StoredWallet {
  id: string;
  name: string;
  asset: AssetType;
  chain: Chain;
  role: WalletRole;
  network: Network;
  mnemonic: string;
  derivationPath: string;
  addressIndex: number;
}

export interface AgmConfig {
  defaultNetwork: Network;
  defaultChain: Chain;
  jsonOutput: boolean;
  feePercent: number; // default 0.5
}

export interface FeeRecord {
  id: string;
  walletId: string;
  asset: AssetType;
  chain: Chain;
  network: Network;
  amount: string;
  feeTaken: string;
  treasuryWalletId: string;
  timestamp: string;
}

export interface BalanceResult {
  walletId: string;
  asset: AssetType;
  chain: Chain;
  network: Network;
  address: string;
  balance: string;
  unit: string;
}

export interface SendResult {
  txid: string;
  from: string;
  to: string;
  amount: string;
  asset: AssetType;
  chain: Chain;
  network: Network;
  status: 'broadcast' | 'confirmed' | 'error';
}

export interface ReceiveResult {
  walletId: string;
  address: string;
  asset: AssetType;
  chain: Chain;
  network: Network;
}

export interface AgmOutput<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

// Chain + asset compatibility matrix
export const CHAIN_ASSETS: Record<Chain, AssetType[]> = {
  bitcoin: ['bitcoin'],
  base: ['usdc', 'usdt'],
  solana: ['usdc', 'usdt'],
};

export function getDefaultChain(asset: AssetType): Chain {
  if (asset === 'bitcoin') return 'bitcoin';
  return 'solana'; // default stablecoins to Solana (fastest, cheapest)
}
