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

const createConnection = () => {
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    metadata,
    projectId,
    tokens: updAddresses,
  });
};

export {
  networks,
  config,
  createConnection,
}