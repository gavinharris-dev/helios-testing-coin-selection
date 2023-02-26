import { bytesToHex, UTxO, Value } from '@hyperionbt/helios';
import { CoinSelectionError } from './CoinSelectionError';

export function coinSelection(utxos: UTxO[], target: Value): UTxO[] {
  const selected: Set<UTxO> = new Set();

  // Loop thru the target assets and select any UTxOs that have that asset
  target.assets.mintingPolicies.forEach((policy) => {
    target.assets.getTokenNames(policy).forEach((tokenName) => {
      const quantity = target.assets.get(policy, tokenName);

      // Get all UTxO's that have this token;
      // Sort them by quantity in descending order
      // Select the combination of UTxO's that add up to the quantity we need

      const assetCovered = utxos
        .filter((utxo) => utxo.value.assets.get(policy, tokenName) >= 0)
        .sort((a, b) =>
          a.value.assets.get(policy, tokenName) >
          b.value.assets.get(policy, tokenName)
            ? -1
            : 1
        )
        .some((utxo) => {
          selected.add(utxo);

          // Check we have selected enough to cover the Asset
          const selectedQty = Array.from(selected).reduce((acc, utxo) => {
            acc += utxo.value.assets.get(policy, tokenName);
            return acc;
          }, BigInt(0));

          return selectedQty >= quantity;
        });

      // If the asset is not covered then throw and Not enough coins Error
      if (!assetCovered) {
        throw new CoinSelectionError({
          message: `${policy.hex} ${bytesToHex(
            tokenName
          )} (${quantity}) - Not found in UTxO set`,
          code: 1,
        });
      }
    });
  });

  // Finally work out if we have enough Lovelace to cover the target
  const selectedLovelace = Array.from(selected).reduce(
    (acc, utxo) => acc + utxo.value.lovelace,
    BigInt(0)
  );

  if (target.lovelace > selectedLovelace) {
    // We don't have enough Lovelace, so we need to select some more UTxOs
    let remainingLovelace = target.lovelace - selectedLovelace;

    const selectedRemainingUTxOs = utxos
      .filter((utxo) => !selected.has(utxo))
      .sort((a, b) => (a.value.lovelace > b.value.lovelace ? -1 : 1))
      .some((utxo) => {
        selected.add(utxo);
        // Reduce Remaining Lovelace
        remainingLovelace -= utxo.value.lovelace;
        return remainingLovelace <= BigInt(0);
      });

    if (!selectedRemainingUTxOs) {
      throw new CoinSelectionError({
        message: `Not enough Lovelace to cover target - (${remainingLovelace})`,
        code: 2,
      });
    }
  }

  return Array.from(selected);
}
