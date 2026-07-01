#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const AGM_API_KEY = process.env.AGM_API_KEY || '';
const AGM_BASE_URL = (process.env.AGM_BASE_URL || 'http://localhost:3141').replace(/\/$/, '');

async function agmRequest(method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${AGM_BASE_URL}${path}`, {
    method,
    headers: {
      'X-API-Key': AGM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json() as { ok: boolean; data?: unknown; error?: string };
  if (!json.ok) throw new Error(json.error || `API error: ${res.status}`);
  return json.data;
}

const server = new McpServer({
  name: 'agentic-money',
  version: '0.1.0',
});

// --- Tools ---

server.tool(
  'create_wallet',
  'Create a cryptocurrency wallet. Use asset="bitcoin" for savings or asset="usdc"/"usdt" for spending. Chains: bitcoin (BTC), solana or base (stablecoins).',
  {
    asset: z.enum(['bitcoin', 'usdc', 'usdt']).default('bitcoin'),
    chain: z.enum(['bitcoin', 'solana', 'base']).optional(),
    network: z.enum(['mainnet', 'testnet']).default('testnet'),
    name: z.string().optional(),
  },
  async ({ asset, chain, network, name }) => {
    const result = await agmRequest('POST', '/v1/wallets', { asset, chain, network, name }) as Record<string, unknown>;
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
);

server.tool(
  'list_wallets',
  'List all wallets managed by Agentic Money.',
  async () => {
    const result = await agmRequest('GET', '/v1/wallets');
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
);

server.tool(
  'get_balance',
  'Check the balance of a specific wallet.',
  { wallet_id: z.string() },
  async ({ wallet_id }) => {
    const result = await agmRequest('GET', `/v1/wallets/${wallet_id}/balance`);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
);

server.tool(
  'send',
  'Send cryptocurrency from a wallet to a recipient address.',
  {
    wallet_id: z.string(),
    to: z.string(),
    amount: z.string(),
  },
  async ({ wallet_id, to, amount }) => {
    const result = await agmRequest('POST', `/v1/wallets/${wallet_id}/send`, { to, amount });
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
);

server.tool(
  'get_receive_address',
  'Get the deposit address for a wallet to receive funds.',
  { wallet_id: z.string() },
  async ({ wallet_id }) => {
    const result = await agmRequest('GET', `/v1/wallets/${wallet_id}/receive`);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
);

server.tool(
  'delete_wallet',
  'Delete a wallet.',
  { wallet_id: z.string() },
  async ({ wallet_id }) => {
    const result = await agmRequest('DELETE', `/v1/wallets/${wallet_id}`);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
);

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
