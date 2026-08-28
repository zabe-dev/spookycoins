import { toCoinListItem } from '../view';
import { validateCoin } from '../schemas/validation';
import { initialCoins, INITIAL_DATASET_POPULATED_AT } from './initial-dataset.generated';

const ids = initialCoins.map((coin) => coin.id);
const promoted = initialCoins.filter((coin) => coin.promoted.active);
const invalid = initialCoins.flatMap((coin) =>
  validateCoin(coin).map((error) => `${coin.id}: ${error}`),
);

if (initialCoins.length !== 100) throw new Error('Initial dataset must contain exactly 100 coins.');
if (ids.some((id, index) => id !== 1000 + index)) {
  throw new Error('Initial coin IDs must be contiguous from 1000 through 1099.');
}
if (new Set(ids).size !== ids.length) throw new Error('Initial coin IDs must be unique.');
if (promoted.length !== 1 || promoted[0].externalId !== 'spookycoins-promoted-demo') {
  throw new Error('Initial dataset must contain exactly one dummy promoted coin.');
}
if (invalid.length) throw new Error(`Invalid initial dataset:\n${invalid.join('\n')}`);
if (initialCoins.some((coin) => coin.submittedAt !== INITIAL_DATASET_POPULATED_AT)) {
  throw new Error('Imported coins must use the dataset population time as their submission time.');
}

export { initialCoins, INITIAL_DATASET_POPULATED_AT };
export const initialCoinListItems = initialCoins.map(toCoinListItem);
