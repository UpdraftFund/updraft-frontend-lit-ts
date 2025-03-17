import { Address, formatUnits } from 'viem';
import { readContract } from '@wagmi/core';
import { config } from '../web3';

// ERC20 ABI for balanceOf function
const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

// UPD token contract address
export const UPD_TOKEN_ADDRESS = '0x9372861C690Df46F7c224EF9d24a964A6CdCd46f' as const;

/**
 * Fetches the UPD token balance for a given address
 * @param address - The address to check the balance for
 * @returns The formatted balance as a string
 */
export const getUpdBalance = async (address: Address): Promise<string> => {
  try {
    const balance = await readContract(config, {
      address: UPD_TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    });

    // Format the balance with 18 decimals
    return formatUnits(balance as bigint, 18);
  } catch (error) {
    console.error('Error fetching UPD balance:', error);
    return '0';
  }
};
