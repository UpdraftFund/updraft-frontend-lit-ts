import { createAppKit } from '@reown/appkit';
import {
  AppKitNetwork,
  arbitrumSepolia as arbitrumSepoliaAppKit,
  arbitrum as arbitrumAppKit,
  Chain,
} from '@reown/appkit/networks';
import { arbitrumSepolia, arbitrum } from 'viem/chains';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { passkeyConnector } from '@zerodev/wallet';
import {
  toPasskeyValidator,
  toWebAuthnKey,
  WebAuthnMode,
  PasskeyValidatorContractVersion,
} from '@zerodev/passkey-validator';
import { createKernelAccount } from '@zerodev/sdk';
import { getEntryPoint } from '@zerodev/sdk/constants';
import { type CreateConnectorFn, getPublicClient } from '@wagmi/core';

import { isProduction } from '@state/common/environment';
import { Address } from 'viem';

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

async function passkeyValidator() {
  const publicClient = getPublicClient(adapter.wagmiConfig)!;

  const authnOpts = {
    passkeyName: 'Updraft',
    passkeyServerUrl: `https://passkeys.zerodev.app/api/v3/${ENV.zeroDevProjectId}`,
  };

  let webAuthnKey;
  try {
    webAuthnKey = await toWebAuthnKey({
      ...authnOpts,
      mode: WebAuthnMode.Login,
    });
  } catch {
    console.log('Discovery failed, switching to Register mode...');
    webAuthnKey = await toWebAuthnKey({
      ...authnOpts,
      mode: WebAuthnMode.Register,
    });
  }

  return await toPasskeyValidator(publicClient, {
    webAuthnKey,
    entryPoint: getEntryPoint('0.7'),
    kernelVersion: '0.3.1',
    validatorContractVersion: PasskeyValidatorContractVersion.V0_0_2_UNPATCHED,
  });
}

const zeroDevPasskey = passkeyConnector(ENV.zeroDevProjectId, ENV.chain, 'v3', 'Updraft');

const updraftConnector: CreateConnectorFn = (config) => {
  const baseConnector = zeroDevPasskey(config);

  baseConnector.getValidator = passkeyValidator;

  // Override connect to prevent the base connector from re-running the buggy factory logic.
  baseConnector.connect = async function <withCapabilities extends boolean = false>(params?: { chainId?: number }) {
    const validator = await passkeyValidator();

    // Combine the validator with the Kernel factory to get the account
    const publicClient = getPublicClient(adapter.wagmiConfig)!;
    const account = await createKernelAccount(publicClient, {
      plugins: {
        sudo: validator,
      },
      entryPoint: getEntryPoint('0.7'),
      kernelVersion: '0.3.1',
    });

    // Return the standard Wagmi connection result
    return {
      accounts: [account.address] as unknown as withCapabilities extends true
        ? readonly { address: Address; capabilities: Record<string, unknown> }[]
        : readonly Address[],
      chainId: params?.chainId ?? ENV.chain.id,
    };
  };

  return {
    ...baseConnector,
    id: 'updraft',
    name: 'New or returning user',
    icon: '/assets/updraft-icon.png',
  };
};

export const adapter = new WagmiAdapter({
  projectId: APPKIT_PROJECT_ID,
  networks,
  connectors: [updraftConnector],
});

export const config = adapter.wagmiConfig;

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
