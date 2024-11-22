import { createAppKit } from '@reown/appkit'
import { arbitrumSepolia } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

const projectId = 'a259923fc99520ecad30021b33486037'

export const networks = [arbitrumSepolia]

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

const metadata = {
  name: 'Updraft',
  description: 'Get paid to crowdfund and work on public goods.',
  url: 'https://updraft.fund', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/187091561']
}

// 3. Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
})
