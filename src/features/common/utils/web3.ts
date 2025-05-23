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
  description: 'Get paid to crowdfund and work on public goods.',
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
  featuredWalletIds: [
    'fb6ed96272ec885008e896c6146002048d8dc88c0b7e0e6fa42bcadf052a1569', //enkrypt
    'a9751f17a3292f2d1493927f0555603d69e9a3fcbcdf5626f01b49afa21ced91', //frame
    '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1', //rabby
  ],
});
