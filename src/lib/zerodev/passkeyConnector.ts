/* eslint-disable */
// @ts-nocheck
// TypeScript checking disabled for this file because ZeroDev SDK types don't match our strict standards
import { ChainNotConfiguredError, type Connector, createConnector } from '@wagmi/core';
import {
  PasskeyValidatorContractVersion,
  WebAuthnMode,
  toPasskeyValidator,
  toWebAuthnKey,
} from '@zerodev/passkey-validator';
import {
  type KernelValidator,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from '@zerodev/sdk';
import { KERNEL_V3_3, getEntryPoint } from '@zerodev/sdk/constants';
import type { EntryPoint } from 'permissionless/types';
import { toPermissionValidator } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import {
  hexStringToUint8Array,
  uint8ArrayToHexString,
  findQuoteIndices,
  parseAndNormalizeSig,
  isRIP7212SupportedNetwork,
} from '@zerodev/webauthn-key';
import {
  http,
  type Chain,
  type Hex,
  type SignableMessage,
  SwitchChainError,
  UserRejectedRequestError,
  getAddress,
  numberToHex,
  encodeAbiParameters,
  type PublicClient,
  encodeFunctionData,
  type Abi,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

// This is the critical piece that makes Wagmi integration work
import { KernelEIP1193Provider } from '@zerodev/wallet';

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get the registrable domain (eTLD+1) from the current hostname.
 * E.g., "dev.updraft.fund" → "updraft.fund", "localhost" → "localhost"
 * This must match the rpId that the passkey server used during registration.
 */
function getRegistrableDomain(): string {
  const hostname = window.location.hostname;
  // localhost or IP address — use as-is
  if (hostname === 'localhost' || /^[0-9.]+$/.test(hostname)) {
    return hostname;
  }
  // For domains like "dev.updraft.fund", return "updraft.fund"
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}

/**
 * Custom WebAuthn signing function that adds transports: ["internal"] to
 * allowCredentials, telling the browser to prefer the local platform
 * authenticator instead of showing the "use another device" QR dialog.
 * Uses navigator.credentials.get() directly to avoid dynamic import issues.
 * Also explicitly sets rpId to the registrable domain so passkeys created
 * on subdomains (e.g., dev.updraft.fund) are found under the parent domain
 * (updraft.fund) where the passkey server registered them.
 */
const signMessageUsingLocalWebAuthn = async (
  message: SignableMessage,
  _rpId: string,
  chainId: number,
  allowCredentials?: Array<{ id: string; type: string }>
): Promise<Hex> => {
  let messageContent: string;
  if (typeof message === 'string') {
    messageContent = message;
  } else if ('raw' in message && typeof message.raw === 'string') {
    messageContent = message.raw;
  } else if ('raw' in message && message.raw instanceof Uint8Array) {
    messageContent = message.raw.toString();
  } else {
    throw new Error('Unsupported message format');
  }

  const formattedMessage = messageContent.startsWith('0x') ? messageContent.slice(2) : messageContent;

  const challengeBytes = hexStringToUint8Array(formattedMessage);

  // Build native WebAuthn allowCredentials with transports: ["internal"]
  const nativeCredentials = allowCredentials?.map((cred) => ({
    id: base64UrlToBuffer(cred.id),
    type: cred.type as PublicKeyCredentialType,
    transports: ['internal' as AuthenticatorTransport],
  }));

  // Use the registrable domain as rpId so passkeys registered under
  // "updraft.fund" are found when authenticating from "dev.updraft.fund"
  const rpId = getRegistrableDomain();

  const credential = (await navigator.credentials.get({
    publicKey: {
      rpId,
      challenge: challengeBytes.buffer,
      allowCredentials: nativeCredentials,
      userVerification: 'required',
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Authentication was not completed');
  }

  const response = credential.response as AuthenticatorAssertionResponse;

  // Convert response fields to the format expected by the signature encoder
  const authenticatorDataHex = uint8ArrayToHexString(new Uint8Array(response.authenticatorData));

  const clientDataJSON = new TextDecoder().decode(response.clientDataJSON);
  const { beforeType } = findQuoteIndices(clientDataJSON);

  const signatureHex = uint8ArrayToHexString(new Uint8Array(response.signature));
  const { r, s } = parseAndNormalizeSig(signatureHex);

  const encodedSignature = encodeAbiParameters(
    [
      { name: 'authenticatorData', type: 'bytes' },
      { name: 'clientDataJSON', type: 'string' },
      { name: 'responseTypeLocation', type: 'uint256' },
      { name: 'r', type: 'uint256' },
      { name: 's', type: 'uint256' },
      { name: 'usePrecompiled', type: 'bool' },
    ],
    [authenticatorDataHex, clientDataJSON, beforeType, BigInt(r), BigInt(s), isRIP7212SupportedNetwork(chainId)]
  );
  return encodedSignature;
};

type ZeroDevVersion = 'v3' | 'v3.1';

// Module-level storage for the kernel client, accessible for batching
let _kernelClient: ReturnType<typeof createKernelAccountClient> | undefined;

/**
 * Get the current kernel client for direct smart account operations (e.g., batching).
 * Returns undefined if no passkey wallet is connected.
 */
export function getKernelClient() {
  return _kernelClient;
}

/**
 * Describes a single contract call for batching
 */
export interface BatchCall {
  to: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: unknown[];
  value?: bigint;
}

/**
 * Send a batch of contract calls as a single user operation.
 * Only works when connected with a passkey/smart account.
 * Waits for the user operation receipt and returns the actual transaction hash.
 */
export async function sendBatchCalls(calls: BatchCall[]): Promise<`0x${string}`> {
  const client = _kernelClient;
  if (!client) {
    throw new Error('No smart account connected. Batch calls require a passkey wallet.');
  }

  const encodedCalls = calls.map((call) => ({
    to: call.to,
    value: call.value ?? BigInt(0),
    data: encodeFunctionData({
      abi: call.abi,
      functionName: call.functionName,
      args: call.args ?? [],
    }),
  }));

  const userOpHash = await client.sendUserOperation({
    callData: await client.account.encodeCalls(encodedCalls),
  });

  // Wait for the user operation to be included in a block and get the tx hash
  const receipt = await client.waitForUserOperationReceipt({ hash: userOpHash });
  return receipt.receipt.transactionHash;
}

// Storage helpers (copied from @zerodev/wallet)
const getZerodevSigner = () => {
  if (typeof window === 'undefined') return null;
  const signer = window.localStorage.getItem('zerodev_wallet_signer');
  if (!signer) return null;
  try {
    const parsedSigner = JSON.parse(signer);
    if (parsedSigner && typeof parsedSigner === 'object' && 'isConnected' in parsedSigner && 'signer' in parsedSigner) {
      return parsedSigner;
    }
    return null;
  } catch (_) {
    return null;
  }
};

const setZerodevSigner = (signer: string, isConnected: boolean) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('zerodev_wallet_signer', JSON.stringify({ signer, isConnected }));
};

export function passkeyConnector(
  projectId: string,
  chain: Chain,
  version: ZeroDevVersion,
  passkeyName: string,
  publicClient: PublicClient,
  connectionName?: string,
  icon?: string
) {
  const ZERODEV_PASSKEY_URL = 'https://passkeys.zerodev.app/api/v3';
  const ZERODEV_BUNDLER_URL = 'https://rpc.zerodev.app/api/v3';

  type Provider = ReturnType<typeof KernelEIP1193Provider> | undefined;
  let walletProvider: Provider | undefined;

  let accountsChanged: Connector['onAccountsChanged'] | undefined;
  let chainChanged: Connector['onChainChanged'] | undefined;
  let disconnect: Connector['onDisconnect'] | undefined;

  return createConnector<Provider>((config) => ({
    id: 'zerodevPasskeySDK',
    name: connectionName,
    icon,
    supportsSimulation: true,
    type: 'passkeyConnector' as const,

    async connect({ chainId } = {}) {
      try {
        if (chainId && chain.id !== chainId) {
          throw new Error(`Incorrect chain Id: ${chainId} should be ${chain.id}`);
        }

        const provider = await this.getProvider();
        if (provider) {
          const accounts = (
            (await provider.request({
              method: 'eth_requestAccounts',
            })) as string[]
          ).map((x) => getAddress(x));
          if (!accountsChanged) {
            accountsChanged = this.onAccountsChanged.bind(this);
            provider.on('accountsChanged', accountsChanged);
          }
          if (!chainChanged) {
            chainChanged = this.onChainChanged.bind(this);
            provider.on('chainChanged', chainChanged);
          }
          if (!disconnect) {
            disconnect = this.onDisconnect.bind(this);
            provider.on('disconnect', disconnect);
          }
          return { accounts, chainId: chain.id };
        }

        // FIXED: Use the correct entry point and kernel version
        const entryPoint = getEntryPoint('0.7');
        const kernelVersion = KERNEL_V3_3;
        const passkeySigner = getZerodevSigner();

        // Determine mode based on existing signer
        const mode = passkeySigner ? WebAuthnMode.Login : WebAuthnMode.Register;

        // For registration, generate a unique name so each user gets a distinct
        // identity on ZeroDev's passkey server and in the browser's passkey manager.
        // For login, the name doesn't matter (credential ID is used), but we pass
        // the stored name for consistency.
        let effectiveName = passkeyName;
        if (mode === WebAuthnMode.Register) {
          const suffix = crypto.randomUUID();
          effectiveName = `${passkeyName}-${suffix}`;
        }

        const webAuthnKey = await toWebAuthnKey({
          passkeyName: effectiveName,
          passkeyServerUrl: `${ZERODEV_PASSKEY_URL}/${projectId}`,
          mode,
          passkeyServerHeaders: {},
          rpID: getRegistrableDomain(),
        });

        // Attach a custom signMessageCallback that adds transports: ["internal"]
        // to allowCredentials. Without this, the browser doesn't know the passkey
        // is stored locally and may show the "use another device" QR dialog.
        webAuthnKey.signMessageCallback = signMessageUsingLocalWebAuthn;

        // FIXED: Use V0_0_3_PATCHED and the provided publicClient
        const passkeyValidator = await toPasskeyValidator(publicClient, {
          webAuthnKey,
          entryPoint: getEntryPoint('0.7'),
          kernelVersion,
          validatorContractVersion: PasskeyValidatorContractVersion.V0_0_3_PATCHED,
        });

        // Store the passkey validator data
        // Convert BigInt values to strings for JSON serialization
        setZerodevSigner(
          JSON.stringify({
            pubKeyX: webAuthnKey.pubX.toString(),
            pubKeyY: webAuthnKey.pubY.toString(),
            authenticatorId: webAuthnKey.authenticatorId,
            authenticatorIdHash: webAuthnKey.authenticatorIdHash,
          }),
          true
        );

        // Session key: generate a local ECDSA private key so the passkey is only
        // needed once (at login). All subsequent transactions use this session key.
        const sessionPrivateKey = generatePrivateKey();
        const sessionKeySigner = privateKeyToAccount(sessionPrivateKey);
        const ecdsaSigner = await toECDSASigner({ signer: sessionKeySigner });
        const permissionPlugin = await toPermissionValidator(publicClient, {
          entryPoint,
          signer: ecdsaSigner,
          policies: [toSudoPolicy({})],
          kernelVersion,
        });

        const kernelAccount = await createKernelAccount(publicClient, {
          entryPoint,
          kernelVersion,
          plugins: {
            sudo: passkeyValidator as KernelValidator<EntryPoint>,
            regular: permissionPlugin,
          },
        });

        // Set up bundler URL — using default provider (no ULTRA_RELAY)
        const rpcUrl = `${ZERODEV_BUNDLER_URL}/${projectId}/chain/${chain.id}`;

        const paymasterClient = createZeroDevPaymasterClient({
          chain,
          transport: http(rpcUrl),
        });

        // Use the official ZeroDev pattern: only getPaymasterData with sponsorUserOperation
        // (no getPaymasterStubData, no shouldOverrideFee)
        const kernelClient = createKernelAccountClient({
          account: kernelAccount,
          chain,
          bundlerTransport: http(rpcUrl),
          client: publicClient,
          paymaster: {
            getPaymasterData(userOperation) {
              return paymasterClient.sponsorUserOperation({ userOperation });
            },
          },
        });

        // Store the kernel client for batching operations
        _kernelClient = kernelClient;

        // Create and store the KernelEIP1193Provider
        // This is what Wagmi uses for all subsequent calls
        walletProvider = new KernelEIP1193Provider(kernelClient) as Provider;

        const accounts = [kernelAccount.address];
        return { accounts, chainId: chain.id };
      } catch (error) {
        console.error('Error connecting:', error);
        throw new UserRejectedRequestError(error as Error);
      }
    },

    async disconnect() {
      const provider = await this.getProvider();
      if (accountsChanged) {
        provider?.removeListener('accountsChanged', accountsChanged);
        accountsChanged = undefined;
      }
      if (chainChanged) {
        provider?.removeListener('chainChanged', chainChanged);
        chainChanged = undefined;
      }
      if (disconnect) {
        provider?.removeListener('disconnect', disconnect);
        disconnect = undefined;
      }
      setZerodevSigner('', false);
      walletProvider = undefined;
      _kernelClient = undefined;
    },

    async getAccounts() {
      const provider = await this.getProvider();
      if (!provider) return [];
      const accounts = (await provider.request({
        method: 'eth_accounts',
      })) as string[];
      return accounts.map((x) => getAddress(x));
    },

    async getChainId() {
      const provider = await this.getProvider();
      if (!provider) return chain.id;
      const chainId = await provider.request({ method: 'eth_chainId' });
      return Number(chainId);
    },

    async getProvider() {
      return walletProvider;
    },

    async isAuthorized() {
      try {
        const passkeySigner = getZerodevSigner();
        if (!passkeySigner || !passkeySigner.isConnected) {
          return false;
        }
        const accounts = await this.getAccounts();
        return !!accounts.length;
      } catch {
        return false;
      }
    },

    async switchChain({ chainId }) {
      const provider = await this.getProvider();
      if (!provider) throw new ChainNotConfiguredError();

      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: numberToHex(chainId) }],
      });
      return chain;
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect();
      else
        config.emitter.emit('change', {
          accounts: accounts.map((x) => getAddress(x)),
        });
    },

    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit('change', { chainId });
    },

    onDisconnect(_) {
      config.emitter.emit('disconnect');
      setZerodevSigner('', false);
      walletProvider = undefined;
      _kernelClient = undefined;
    },
  }));
}
