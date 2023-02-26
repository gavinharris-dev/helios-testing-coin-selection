import { Assets, UTxO } from '@hyperionbt/helios';
import { assert } from 'vitest';

/**
 * Simple function to check that the UTxOs are enough
 * to cover the Lovelace and Assets provided.
 *
 */
export function fundsAreSufficient(
  result: UTxO[],
  lovelace: BigInt,
  assets?: Assets
) {
  // Check there is enough Lovelace
  if (
    result.reduce((acc, curr) => acc + curr.value.lovelace, BigInt(0)) <
    lovelace
  ) {
    assert.fail('Not enough Lovelace');
  }

  if (!assets) return;

  // Check there is enough Assets
  const resultAssets = result.reduce(
    (acc, curr) => acc.add(curr.value.assets),
    new Assets()
  );
  if (!resultAssets.ge(assets)) {
    assert.fail('Not enough Assets');
  }
}
