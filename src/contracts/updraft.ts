import { readContract, simulateContract, writeContract, getTransactionReceipt } from '@wagmi/core';
import { trim } from 'viem';
import { config } from '../web3.ts';
import addresses from './updraftAddresses.json';
import abi from './abis/Updraft.json';

type AddressMap = {
  [chainName: string]: `0x${string}`;
};

const updraftAddresses: AddressMap = addresses as AddressMap;

export const updraftAddress = () => {
  const address: `0x${string}` = updraftAddresses[config.getClient().chain.name];
  return address;
};

//region Read Functions
export const percentScale = async () => {
  return await readContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'percentScale',
  });
};

export const feeToken = async () => {
  return await readContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'feeToken',
  });
};

export const minFee = async () => {
  return await readContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'minFee',
  });
}

export const percentFee = async () => {
  return await readContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'percentFee',
  });
}
//endregion

//region Write Functions
export const updateProfile = async (profileData) => {
  const { request } = await simulateContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'updateProfile',
    args: [profileData],
  });
  await writeContract(config, request);
}

export const createIdea = async (contributorFee, contribution, ideaData):`0x${string}` => {
  const { request } = await simulateContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'createIdea',
    args: [contributorFee, contribution, ideaData],
  });
  const hash = await writeContract(config, request);
  const receipt = await getTransactionReceipt(config, { hash });
//   console.log('Transaction receipt');
//   console.dir(receipt);

  // address of the new Idea contract
  return trim(receipt.logs[0].topics[1]);
}
//endregion
