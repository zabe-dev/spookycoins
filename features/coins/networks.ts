import type { NetworkId } from './types';

export type NetworkConfig = {
  id: NetworkId;
  name: string;
  shortName: string;
  providerPlatformIds: readonly string[];
  explorerAddressUrl: ((address: string) => string) | null;
  dexScreenerSlug: string | null;
  enabled: boolean;
};

export const NETWORKS = {
  ethereum: network(
    'ethereum',
    'Ethereum',
    'ETH',
    ['ethereum'],
    'https://etherscan.io/address/',
    'ethereum',
  ),
  bsc: network(
    'bsc',
    'BNB Smart Chain',
    'BSC',
    ['binance-smart-chain'],
    'https://bscscan.com/address/',
    'bsc',
  ),
  solana: network('solana', 'Solana', 'SOL', ['solana'], 'https://solscan.io/account/', 'solana'),
  polygon: network(
    'polygon',
    'Polygon',
    'MATIC',
    ['polygon-pos'],
    'https://polygonscan.com/address/',
    'polygon',
  ),
  avalanche: network(
    'avalanche',
    'Avalanche',
    'AVAX',
    ['avalanche'],
    'https://snowtrace.io/address/',
    'avalanche',
  ),
  arbitrum: network(
    'arbitrum',
    'Arbitrum',
    'ARB',
    ['arbitrum-one'],
    'https://arbiscan.io/address/',
    'arbitrum',
  ),
  base: network('base', 'Base', 'BASE', ['base'], 'https://basescan.org/address/', 'base'),
  optimism: network(
    'optimism',
    'Optimism',
    'OP',
    ['optimistic-ethereum'],
    'https://optimistic.etherscan.io/address/',
    'optimism',
  ),
  dogecoin: network(
    'dogecoin',
    'Dogecoin',
    'DOGE',
    ['dogechain'],
    'https://dogechain.info/address/',
    'dogechain',
  ),
  tron: network('tron', 'Tron', 'TRX', ['tron'], 'https://tronscan.org/#/address/', 'tron'),
  fantom: network('fantom', 'Fantom', 'FTM', ['fantom'], 'https://ftmscan.com/address/', 'fantom'),
  kcc: network(
    'kcc',
    'KuCoin Community Chain',
    'KCC',
    ['kucoin-community-chain'],
    'https://explorer.kcc.io/en/address/',
    'kcc',
  ),
  sui: network('sui', 'Sui', 'SUI', ['sui'], 'https://suiscan.xyz/mainnet/object/', 'sui'),
  hood: network('hood', 'Hood', 'HOOD', ['hood'], null, null),
  xrpl: network('xrpl', 'XRP Ledger', 'XRPL', ['xrp'], 'https://xrpscan.com/account/', 'xrpl'),
  other: network('other', 'Other', 'OTHER', [], null, null),
} satisfies Record<NetworkId, NetworkConfig>;

function network(
  id: NetworkId,
  name: string,
  shortName: string,
  providerPlatformIds: readonly string[],
  explorerBaseUrl: string | null,
  dexScreenerSlug: string | null,
): NetworkConfig {
  return {
    id,
    name,
    shortName,
    providerPlatformIds,
    explorerAddressUrl: explorerBaseUrl ? (address) => `${explorerBaseUrl}${address}` : null,
    dexScreenerSlug,
    enabled: true,
  };
}

const platformToNetwork = new Map<string, NetworkId>(
  Object.values(NETWORKS).flatMap((config) =>
    config.providerPlatformIds.map((platformId) => [platformId, config.id] as const),
  ),
);

export const SUPPORTED_NETWORK_IDS = Object.freeze(
  Object.values(NETWORKS)
    .filter((networkConfig) => networkConfig.enabled && networkConfig.id !== 'other')
    .map((networkConfig) => networkConfig.id),
);

export function getNetworkConfig(networkId: NetworkId): NetworkConfig {
  return NETWORKS[networkId];
}

export function resolveNetworkId(providerPlatformId: string): NetworkId | null {
  return platformToNetwork.get(providerPlatformId) ?? null;
}
