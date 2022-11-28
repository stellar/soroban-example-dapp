import * as SorobanClient from "soroban-client";
import { isNotNullish } from './utils/isNotNullish';
import type { WalletChain, ChainMetadata, ChainName} from '@soroban-react/types';

// Sourced from https://github.com/tmm/wagmi/blob/main/packages/core/src/constants/chains.ts
// This is just so we can clearly see which of wagmi's first-class chains we provide metadata for

const chainMetadataByName: Record<ChainName, ChainMetadata> = {
  public: {
    id: "public",
    name: "Public",
    networkPassphrase: SorobanClient.Networks.PUBLIC,
    iconBackground: '#e84141',
    // iconUrl: async () => (await import('./chainIcons/public.svg')).default,
  },
  testnet: {
    id: "testnet",
    name: "Testnet",
    networkPassphrase: SorobanClient.Networks.TESTNET,
    iconBackground: '#484c50',
    // iconUrl: async () => (await import('./chainIcons/testnet.svg')).default,
  },
  futurenet: {
    id: "futurenet",
    name: "Futurenet",
    networkPassphrase: SorobanClient.Networks.FUTURENET,
    iconBackground: '#96bedc',
    // iconUrl: async () => (await import('./chainIcons/futurenet.svg')).default,
  },
  sandbox: {
    id: "sandbox",
    name: "Sandbox",
    networkPassphrase: SorobanClient.Networks.SANDBOX,
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
