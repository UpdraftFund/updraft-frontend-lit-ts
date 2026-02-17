import { createAppKit } from '@reown/appkit';
import {
  AppKitNetwork,
  arbitrumSepolia as arbitrumSepoliaAppKit,
  arbitrum as arbitrumAppKit,
  Chain,
} from '@reown/appkit/networks';
import { arbitrumSepolia, arbitrum } from 'viem/chains';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { passkeyConnector } from '@/lib/zerodev/passkeyConnector';
import { type CreateConnectorFn, getAccount } from '@wagmi/core';
import { createPublicClient, http } from 'viem';

import { isProduction } from '@state/common/environment';

const APPKIT_PROJECT_ID = 'a259923fc99520ecad30021b33486037';

interface Env {
  zeroDevProjectId: string;
  chain: Chain;
  networks: [AppKitNetwork, ...AppKitNetwork[]];
}

const ENV: Env = isProduction()
  ? {
      zeroDevProjectId: '898fcf43-7a11-41f3-894b-4fed121bcc66',
      chain: arbitrum,
      networks: [arbitrumAppKit],
    }
  : {
      zeroDevProjectId: '898fcf43-7a11-41f3-894b-4fed121bcc66',
      chain: arbitrumSepolia,
      networks: [arbitrumSepoliaAppKit],
    };

export const networks = ENV.networks;

const publicClient = createPublicClient({
  chain: ENV.chain,
  transport: http(),
});

const updraftConnector: CreateConnectorFn = passkeyConnector(
  ENV.zeroDevProjectId,
  ENV.chain,
  'v3',
  'Updraft', // passkey name
  publicClient,
  'New or returning user', // connection name
  '/assets/updraft-icon.png' // connection icon
);

export const adapter = new WagmiAdapter({
  projectId: APPKIT_PROJECT_ID,
  networks,
  connectors: [updraftConnector],
});

export const config = adapter.wagmiConfig;

/**
 * Check if the current wallet connection is a smart account (passkey).
 * Smart account users get gas sponsorship and transaction batching.
 */
export function isSmartAccount(): boolean {
  const account = getAccount(config);
  return account.connector?.type === 'passkeyConnector';
}

const metadata = {
  name: 'Updraft',
  description: 'Get paid to find ideas, crowdfund and work on what you love.',
  url: 'https://app.updraft.fund', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/187091561'],
};

// Use the exported `connectModal` to set the theme mode and other actions.
// See https://docs.reown.com/appkit/javascript/core/actions
export const modal = createAppKit({
  adapters: [adapter],
  networks,
  metadata,
  projectId: APPKIT_PROJECT_ID,
  enableNetworkSwitch: false,
  themeMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  themeVariables: {
    '--apkt-font-family': 'var(--sl-font-sans);',
  },
  features: {
    analytics: true,
    emailShowWallets: false,
  },
  includeWalletIds: ['updraft'],
  enableWalletGuide: false,
  allWallets: 'ONLY_MOBILE',
});
