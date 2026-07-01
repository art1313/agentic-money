import { Command } from 'commander';
import { getWallet, loadStore, saveStore } from '../lib/store.js';
import { ok, err, print } from '../lib/output.js';
import { deriveAddress } from '../wallets/bitcoin.js';
import { deriveEvmAddress } from '../wallets/stablecoin.js';
import { deriveSolanaAddress } from '../wallets/solana.js';
import type { ReceiveResult } from '../types.js';

export function registerReceiveCommands(program: Command): void {
  program
    .command('receive <wallet-id>')
    .description('Get an address to receive funds')
    .option('--new', 'Generate a new address (increments index)')
    .action((walletId: string, opts) => {
      try {
        const w = getWallet(walletId);
        if (!w) { print(err(`Wallet not found: ${walletId}`)); return; }

        if (opts.new) {
          const store = loadStore();
          const wallet = store.wallets.find(sw => sw.id === w.id);
          if (wallet) {
            wallet.addressIndex++;
            saveStore(store);
            w.addressIndex = wallet.addressIndex;
          }
        }

        let address: string;
        if (w.chain === 'bitcoin') {
          address = deriveAddress(w.mnemonic, w.network, w.addressIndex);
        } else if (w.chain === 'solana') {
          address = deriveSolanaAddress(w.mnemonic, w.addressIndex);
        } else {
          address = deriveEvmAddress(w.mnemonic, w.addressIndex);
        }

        const result: ReceiveResult = {
          walletId: w.id, address,
          asset: w.asset, chain: w.chain, network: w.network,
        };

        print(ok(result));
      } catch (e) {
        print(err((e as Error).message));
      }
    });
}
