import * as SorobanSdk from "soroban-sdk";
import { isNotNullish } from './utils/isNotNullish';
import type { WalletChain } from './WalletChainContext';

// Sourced from https://github.com/tmm/wagmi/blob/main/packages/core/src/constants/chains.ts
// This is just so we can clearly see which of wagmi's first-class chains we provide metadata for
export type ChainName =
  | 'futurenet'
  | 'public'
  | 'testnet'
  | 'sandbox'
  | 'standalone';

export type ChainMetadata = WalletChain;

const chainMetadataByName: Record<ChainName, ChainMetadata> = {
  public: {
    id: "public",
    name: "Public",
    networkPassphrase: SorobanSdk.Networks.PUBLIC,
    iconBackground: '#e84141',
    // iconUrl: async () => (await import('./chainIcons/public.svg')).default,
  },
  testnet: {
    id: "testnet",
    name: "Testnet",
    networkPassphrase: SorobanSdk.Networks.TESTNET,
    iconBackground: '#484c50',
    // iconUrl: async () => (await import('./chainIcons/testnet.svg')).default,
  },
  futurenet: {
    id: "futurenet",
    name: "Futurenet",
    networkPassphrase: SorobanSdk.Networks.FUTURENET,
    iconBackground: '#96bedc',
    // iconUrl: async () => (await import('./chainIcons/futurenet.svg')).default,
  },
  sandbox: {
    id: "sandbox",
    name: "Sandbox",
    networkPassphrase: SorobanSdk.Networks.SANDBOX,
    iconBackground: '#dac695',
    // iconUrl: async () => (await import('./chainIcons/futurenet.svg')).default,
  },
  standalone: {
    id: "standalone",
    name: "Standalone",
    networkPassphrase: "Standalone Network ; February 2017",
    iconBackground: '#dac695',
    // iconUrl: async () => (await import('./chainIcons/futurenet.svg')).default,
  },
};

const chainMetadataById = Object.fromEntries(
  Object.values(chainMetadataByName)
    .filter(isNotNullish)
    .map(({ id, ...metadata }) => [id, metadata])
);

export const chain = chainMetadataByName;

/** @description Decorates an array of wagmi `Chain` objects with WalletChain properties if not already provided */
export function provideWalletChains<Chain extends WalletChain>(
  chains: Chain[]
): Chain[] {
  return chains.map(chain => ({
    ...(chainMetadataById[chain.id] ?? {}),
    ...chain,
  }));
}
