import { createAppKit } from '@reown/appkit';
import { AppKitNetwork, arbitrumSepolia, arbitrum } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = 'a259923fc99520ecad30021b33486037';

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [arbitrumSepolia, arbitrum];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

const metadata = {
  name: 'Updraft',
  description: 'Get paid to crowdfund and work on public goods.',
  url: 'https://updraft.fund', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/187091561'],
};

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
// TODO: add UPD token to customTokens list so people can buy it
// swapOptions: {
//   customTokens: [
//     {
//       address: '0x...', // The contract address of your custom token (required)
//       symbol: '...',    // The symbol of your custom token (required)
//       decimals: 18,     // The number of decimals the token uses (required)
//       name: '...',      // The name of your custom token (optional)
//       logoURI: '...',   // A URI pointing to the logo of your custom token (optional)
//       chainId: 1,       // The chain ID where the token is deployed (optional)
//     }
//   ],
// },
});

export const config = wagmiAdapter.wagmiConfig;