import { Command } from 'commander';
import { listWallets, getWallet } from '../lib/store.js';
import { ok, err, print } from '../lib/output.js';
import { deriveAddress, fetchBalance } from '../wallets/bitcoin.js';
import { deriveEvmAddress, fetchTokenBalance as fetchEvmTokenBalance } from '../wallets/stablecoin.js';
import { deriveSolanaAddress, fetchTokenBalance as fetchSolTokenBalance } from '../wallets/solana.js';
import type { BalanceResult } from '../types.js';

export function registerBalanceCommands(program: Command): void {
  program
    .command('balance [id]')
    .description('Check wallet balance (all wallets if no id given)')
    .action(async (id?: string) => {
      try {
        const wallets = id ? [getWallet(id)].filter(Boolean) : listWallets();

        if (wallets.length === 0) {
          print(err(id ? `Wallet not found: ${id}` : 'No wallets found. Create one with: agm wallet create'));
          return;
        }

        const results: BalanceResult[] = [];

        for (const w of wallets) {
          if (!w) continue;

          let address: string;
          let balance: string;
          let unit: string;

          if (w.chain === 'bitcoin') {
            address = deriveAddress(w.mnemonic, w.network, w.addressIndex);
            balance = await fetchBalance(address, w.network);
            unit = 'sats';
          } else if (w.chain === 'solana') {
            address = deriveSolanaAddress(w.mnemonic, w.addressIndex);
            balance = await fetchSolTokenBalance(w.mnemonic, w.asset, w.network, w.addressIndex);
            unit = w.asset.toUpperCase();
          } else {
            // base
            address = deriveEvmAddress(w.mnemonic, w.addressIndex);
            balance = await fetchEvmTokenBalance(w.mnemonic, w.asset, w.network, w.addressIndex);
            unit = w.asset.toUpperCase();
          }

          results.push({
            walletId: w.id,
            asset: w.asset,
            chain: w.chain,
            network: w.network,
            address,
            balance,
            unit,
          });
        }

        print(ok(results));
      } catch (e) {
        print(err((e as Error).message));
      }
    });
}
