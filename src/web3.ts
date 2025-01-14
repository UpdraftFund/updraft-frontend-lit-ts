import { createAppKit } from '@reown/appkit';
import { AppKitNetwork, arbitrumSepolia, arbitrum } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import updAddresses from './contracts/updAddresses.json';

const projectId = 'a259923fc99520ecad30021b33486037';

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [arbitrumSepolia, arbitrum];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

const config = wagmiAdapter.wagmiConfig;

const metadata = {
  name: 'Updraft',
  description: 'Get paid to crowdfund and work on public goods.',
  url: 'https://www.updraft.fund', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/187091561'],
};

// Use the exported `connectModal` to set the theme mode and other actions.
// See https://docs.reown.com/appkit/javascript/core/actions
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  tokens: updAddresses,
  themeMode: "light",
  themeVariables: {
   "--w3m-accent": "var(--accent);",
   "--w3m-font-family": "'Noto Sans', sans-serif;",
   "--w3m-color-mix": "var(--accent);",
   "--w3m-color-mix-strength": 12,
  },
  features: {
    analytics: true
  },
  includeWalletIds: [
    "fb6ed96272ec885008e896c6146002048d8dc88c0b7e0e6fa42bcadf052a1569",
  ]
});

const createConnection = () => { modal };

export {
  networks,
  config,
  modal,
  createConnection,
}