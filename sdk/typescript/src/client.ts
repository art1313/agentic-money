import type {
  AgenticMoneyConfig,
  Wallet,
  WalletCreateParams,
  Balance,
  SendParams,
  SendResult,
  ReceiveAddress,
  ApiResponse,
} from './types.js';

export class AgenticMoney {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AgenticMoneyConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'http://localhost:3141').replace(/\/$/, '');
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json() as ApiResponse<T>;

    if (!json.ok) {
      throw new Error(json.error || `API error: ${res.status}`);
    }

    return json.data as T;
  }

  // --- Wallets ---

  async createWallet(params: WalletCreateParams = {}): Promise<Wallet> {
    return this.request<Wallet>('POST', '/v1/wallets', params);
  }

  async listWallets(): Promise<Wallet[]> {
    return this.request<Wallet[]>('GET', '/v1/wallets');
  }

  async getWallet(id: string): Promise<Wallet> {
    return this.request<Wallet>('GET', `/v1/wallets/${id}`);
  }

  async deleteWallet(id: string): Promise<{ removed: string }> {
    return this.request<{ removed: string }>('DELETE', `/v1/wallets/${id}`);
  }

  // --- Balance ---

  async getBalance(walletId: string): Promise<Balance> {
    return this.request<Balance>('GET', `/v1/wallets/${walletId}/balance`);
  }

  // --- Send ---

  async send(walletId: string, params: SendParams): Promise<SendResult> {
    return this.request<SendResult>('POST', `/v1/wallets/${walletId}/send`, params);
  }

  // --- Receive ---

  async getReceiveAddress(walletId: string): Promise<ReceiveAddress> {
    return this.request<ReceiveAddress>('GET', `/v1/wallets/${walletId}/receive`);
  }

  // --- Health ---

  async health(): Promise<{ status: string; version: string }> {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json() as Promise<{ status: string; version: string }>;
  }
}
