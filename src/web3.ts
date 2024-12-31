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
const connectModal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  tokens: updAddresses,
  themeMode: "light",
  themeVariables: {
   "--w3m-color-mix": "#43C3E9",
   "--w3m-color-mix-strength": 12,
   "--w3m-accent": "#096394",
   "--w3m-font-family": "'Noto Sans', sans-serif;",
  }
});

const createConnection = () => { connectModal };

export {
  networks,
  config,
  connectModal,
  createConnection,
}