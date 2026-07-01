export type AssetType = 'bitcoin' | 'usdc' | 'usdt';
export type Chain = 'bitcoin' | 'base' | 'solana';
export type Network = 'mainnet' | 'testnet';
export type WalletRole = 'savings' | 'spending';

export interface AgenticMoneyConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Wallet {
  id: string;
  name: string;
  asset: AssetType;
  chain: Chain;
  role: WalletRole;
  network: Network;
  address: string;
  mnemonic?: string;
  createdAt?: string;
}

export interface WalletCreateParams {
  asset?: AssetType;
  chain?: Chain;
  network?: Network;
  role?: WalletRole;
  name?: string;
  mnemonic?: string;
}

export interface Balance {
  walletId: string;
  asset: AssetType;
  chain: Chain;
  network: Network;
  address: string;
  balance: string;
  unit: string;
}

export interface SendParams {
  to: string;
  amount: string;
}

export interface SendResult {
  txid: string;
  from: string;
  to: string;
  amount: string;
  asset: AssetType;
  chain: Chain;
  network: Network;
  status: string;
}

export interface ReceiveAddress {
  walletId: string;
  address: string;
  asset: AssetType;
  chain: Chain;
  network: Network;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
