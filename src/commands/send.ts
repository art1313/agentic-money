import { Command } from 'commander';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { getWallet } from '../lib/store.js';
import { ok, err, print } from '../lib/output.js';
import { deriveKeyPair, deriveAddress, fetchUtxos, broadcastTx } from '../wallets/bitcoin.js';
import { sendToken as sendEvmToken, deriveEvmAddress } from '../wallets/stablecoin.js';
import { sendToken as sendSolToken, deriveSolanaAddress } from '../wallets/solana.js';
import type { SendResult, Network } from '../types.js';

bitcoin.initEccLib(ecc);

export function registerSendCommands(program: Command): void {
  program
    .command('send')
    .description('Send funds from a wallet')
    .requiredOption('-w, --wallet <id>', 'Source wallet id or name')
    .requiredOption('-t, --to <address>', 'Destination address')
    .requiredOption('-a, --amount <amount>', 'Amount to send (sats for BTC, units for stablecoins)')
    .option('--fee-rate <rate>', 'Fee rate in sat/vB (Bitcoin only)', '5')
    .action(async (opts) => {
      try {
        const w = getWallet(opts.wallet);
        if (!w) {
          print(err(`Wallet not found: ${opts.wallet}`));
          return;
        }

        let txid: string;
        let from: string;

        if (w.chain === 'bitcoin') {
          from = deriveAddress(w.mnemonic, w.network, w.addressIndex);
          txid = await sendBitcoin(
            w.mnemonic, w.network, opts.to,
            parseInt(opts.amount), parseInt(opts.feeRate), w.addressIndex
          );
        } else if (w.chain === 'solana') {
          from = deriveSolanaAddress(w.mnemonic, w.addressIndex);
          txid = await sendSolToken(w.mnemonic, w.asset, w.network, opts.to, opts.amount, w.addressIndex);
        } else {
          from = deriveEvmAddress(w.mnemonic, w.addressIndex);
          txid = await sendEvmToken(w.mnemonic, w.asset, w.network, opts.to, opts.amount, w.addressIndex);
        }

        const result: SendResult = {
          txid, from, to: opts.to, amount: opts.amount,
          asset: w.asset, chain: w.chain, network: w.network,
          status: 'broadcast',
        };

        print(ok(result));
      } catch (e) {
        print(err((e as Error).message));
      }
    });
}

async function sendBitcoin(
  mnemonic: string, network: Network, toAddress: string,
  amountSats: number, feeRate: number, index: number = 0
): Promise<string> {
  const btcNetwork = network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
  const keyPair = deriveKeyPair(mnemonic, network, index);
  const fromAddress = deriveAddress(mnemonic, network, index);

  const utxos = await fetchUtxos(fromAddress, network);
  if (utxos.length === 0) throw new Error('No UTXOs available');

  utxos.sort((a, b) => b.value - a.value);

  let inputSum = 0;
  const selectedUtxos: typeof utxos = [];

  for (const utxo of utxos) {
    selectedUtxos.push(utxo);
    inputSum += utxo.value;
    const estimatedSize = selectedUtxos.length * 68 + 2 * 31 + 10;
    const estimatedFee = estimatedSize * feeRate;
    if (inputSum >= amountSats + estimatedFee) break;
  }

  const estimatedSize = selectedUtxos.length * 68 + 2 * 31 + 10;
  const fee = estimatedSize * feeRate;

  if (inputSum < amountSats + fee) {
    throw new Error(`Insufficient funds. Have ${inputSum} sats, need ${amountSats + fee} sats (including ${fee} sats fee)`);
  }

  const psbt = new bitcoin.Psbt({ network: btcNetwork });

  for (const utxo of selectedUtxos) {
    const p2wpkh = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: btcNetwork,
    });
    psbt.addInput({
      hash: utxo.txid, index: utxo.vout,
      witnessUtxo: { script: p2wpkh.output!, value: utxo.value },
    });
  }

  psbt.addOutput({ address: toAddress, value: amountSats });

  const change = inputSum - amountSats - fee;
  if (change > 546) {
    psbt.addOutput({ address: fromAddress, value: change });
  }

  for (let i = 0; i < selectedUtxos.length; i++) {
    psbt.signInput(i, keyPair);
  }

  psbt.finalizeAllInputs();
  return await broadcastTx(psbt.extractTransaction().toHex(), network);
}
