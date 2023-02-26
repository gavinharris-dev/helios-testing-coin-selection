import { assert, describe, test } from 'vitest';

import {
  Assets,
  MintingPolicyHash,
  NetworkEmulator,
  Value,
} from '@hyperionbt/helios';
import { fundsAreSufficient } from './utils';
import { coinSelection } from '../src/CoinSelection';

describe('Test the simple Coin Selection program', async () => {
  test('Lovelace and Multiple Asset in single UTxO', async () => {
    const network = new NetworkEmulator();

    const assets = new Assets();

    assets.addComponent(
      MintingPolicyHash.fromHex(
        '16aa5486dab6527c4697387736ae449411c03dcd20a3950453e6779c'
      ),
      Array.from(new TextEncoder().encode('PodgyPenguin1041')),
      BigInt(1)
    );
    assets.addComponent(
      MintingPolicyHash.fromHex(
        '16aa5486dab6527c4697387736ae449411c03dcd20a3950453e6779c'
      ),
      Array.from(new TextEncoder().encode('PodgyPenguin1047')),
      BigInt(1)
    );
    assets.addComponent(
      MintingPolicyHash.fromHex(
        '16aa5486dab6527c4697387736ae449411c03dcd20a3950453e6779f'
      ),
      Array.from(new TextEncoder().encode('PodgyPenguin1047')),
      BigInt(1)
    );
    assets.addComponent(
      MintingPolicyHash.fromHex(
        '16aa5486dab6527c4697387736ae449411c03dcd20a3950453e6779c'
      ),
      Array.from(new TextEncoder().encode('PodgyPenguin1043')),
      BigInt(1)
    );

    const alice = network.createWallet(BigInt(100_000_000), assets);
    network.tick(BigInt(10));

    const utxos = await network.getUtxos(alice.address);

    const result = coinSelection(utxos, new Value(BigInt(10_000_000), assets));
    fundsAreSufficient(result, BigInt(10_000_000), assets);
  });

  test('CoinSelection - Lovelace and Multiple Asset across multiple UTxOs', async () => {
    const network = new NetworkEmulator();

    const a1 = new Assets();
    const a2 = new Assets();
    const a3 = new Assets();
    const a4 = new Assets();

    const components = [
      [
        MintingPolicyHash.fromHex(
          '16aa5486dab6527c4697387736ae449411c03dcd20a3950453e6779c'
        ),
        Array.from(new TextEncoder().encode('PodgyPenguin1041')),
        BigInt(1),
      ],
      [
        MintingPolicyHash.fromHex(
          '16aa5486dab6527c4697387736ae449411c03dcd20a3950453e6779c'
        ),
        Array.from(new TextEncoder().encode('PodgyPenguin1047')),
        BigInt(1),
      ],
      [
        MintingPolicyHash.fromHex(
          '16aa5486dab6527c4697387736ae449411c03dcd20a3950453e6779f'
        ),
        Array.from(new TextEncoder().encode('PodgyPenguin1047')),
        BigInt(1),
      ],
      [
        MintingPolicyHash.fromHex(
          '16aa5486dab6527c4697387736ae449411c03dcd20a3950453e6779c'
        ),
        Array.from(new TextEncoder().encode('PodgyPenguin1043')),
        BigInt(1),
      ],
    ] as const;

    a1.addComponent(components[0][0], components[0][1], components[0][2]);
    a2.addComponent(components[1][0], components[1][1], components[1][2]);
    a3.addComponent(components[2][0], components[2][1], components[2][2]);
    a4.addComponent(components[3][0], components[3][1], components[3][2]);

    const alice = network.createWallet(BigInt(5_000_000), a1);
    network.createUtxo(alice, BigInt(1_020_000), a2);
    network.createUtxo(alice, BigInt(1_020_000), a3);
    network.createUtxo(alice, BigInt(12_020_000), a4);
    network.tick(BigInt(10));

    const utxos = await network.getUtxos(alice.address);

    const assets = new Assets();

    assets.addComponent(components[0][0], components[0][1], components[0][2]);
    assets.addComponent(components[1][0], components[1][1], components[1][2]);
    assets.addComponent(components[3][0], components[3][1], components[3][2]);

    const result = coinSelection(utxos, new Value(BigInt(10_000_000), assets));
    fundsAreSufficient(result, BigInt(10_000_000), assets);
  });
});
