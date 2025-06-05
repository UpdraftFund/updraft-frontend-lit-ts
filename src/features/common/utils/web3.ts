import { createAppKit } from '@reown/appkit';
import {
  AppKitNetwork,
  arbitrumSepolia,
  arbitrum,
} from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = 'a259923fc99520ecad30021b33486037';

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  arbitrumSepolia,
  arbitrum,
];

export const adapter = new WagmiAdapter({
  projectId,
  networks,
});

export const config = adapter.wagmiConfig;

const metadata = {
  name: 'Updraft',
  description: 'Get paid to find ideas, crowdfund and work on what you love.',
  url: 'https://www.updraft.fund', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/187091561'],
};

// Use the exported `connectModal` to set the theme mode and other actions.
// See https://docs.reown.com/appkit/javascript/core/actions
export const modal = createAppKit({
  adapters: [adapter],
  networks,
  metadata,
  projectId,
  themeMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light',
  themeVariables: {
    '--w3m-accent': 'var(--accent);',
    '--w3m-font-family': 'var(--sl-font-sans);',
    '--w3m-color-mix': 'var(--sl-color-primary-100);',
    '--w3m-color-mix-strength': 25,
  },
  features: {
    analytics: true,
  },
});
