import { readContract, simulateContract, writeContract, getTransactionReceipt } from '@wagmi/core';
import { trim } from 'viem';
import { config } from '../web3.ts';
import updraftAddresses from './updraftAddresses.json';
import abi from './abis/Updraft.json';

type AddressMap = {
  [chainName: string]: `0x${string}`;
};

const addresses: AddressMap = updraftAddresses as AddressMap;

export const address = () => {
  const address: `0x${string}` = addresses[config.getClient().chain.name];
  return address;
};

//region Read functions
export const percentScale = async (): Promise<bigint> => {
  return await readContract(config, {
    abi,
    address: address(),
    functionName: 'percentScale',
  }) as bigint;
};

export const feeToken = async (): Promise<`0x${string}`> => {
  return await readContract(config, {
    abi,
    address: address(),
    functionName: 'feeToken',
  }) as `0x${string}`;
};

export const minFee = async (): Promise<bigint> => {
  return await readContract(config, {
    abi,
    address: address(),
    functionName: 'minFee',
  }) as bigint;
}

export const percentFee = async (): Promise<bigint> => {
  return await readContract(config, {
    abi,
    address: address(),
    functionName: 'percentFee',
  }) as bigint;
}
//endregion

//region Write functions
export const updateProfile = async (profileData: `0x${string}`) => {
  const { request } = await simulateContract(config, {
    abi,
    address: address(),
    functionName: 'updateProfile',
    args: [profileData],
  });
  await writeContract(config, request);
}

export const createIdea = async (contributorFee: bigint, contribution: bigint, ideaData: `0x${string}`)
: Promise<`0x${string}`> => {
  const { request } = await simulateContract(config, {
    abi,
    address: address(),
    functionName: 'createIdea',
    args: [contributorFee, contribution, ideaData],
  });
  const hash = await writeContract(config, request);
  const receipt = await getTransactionReceipt(config, { hash });
  const ideaAddress = receipt?.logs?.[0]?.topics?.[1];
  if(ideaAddress){
    return trim(ideaAddress);
  } else {
    throw new Error(`Transaction receipt missing expected "IdeaCreated" event.
      Receipt: ${JSON.stringify(receipt)}`);
  }
}

export const createIdeaWithProfile = async (
  contributorFee: bigint,
  contribution: bigint,
  ideaData: `0x${string}`,
  profileData: `0x${string}`
): Promise<`0x${string}`> => {
  const { request } = await simulateContract(config, {
    abi,
    address: address(),
    functionName: 'createIdeaWithProfile',
    args: [contributorFee, contribution, ideaData, profileData],
  });
  const hash = await writeContract(config, request);
  const receipt = await getTransactionReceipt(config, { hash });
  const ideaAddress = receipt?.logs?.[0]?.topics?.[1];
  if(ideaAddress){
    return trim(ideaAddress);
  } else {
    throw new Error(`Transaction receipt missing expected "IdeaCreated" event.
      Receipt: ${JSON.stringify(receipt)}`);
  }
}

export const createSolution = async (
  ideaAddress: `0x${string}`,
  fundingToken: `0x${string}`,
  stake: bigint,
  goal: bigint,
  deadline: bigint,
  contributorFee: bigint,
  solutionData: `0x${string}`
): Promise<`0x${string}`> => {
  const { request } = await simulateContract(config, {
    abi,
    address: address(),
    functionName: 'createSolution',
    args: [ideaAddress, fundingToken, stake, goal, deadline, contributorFee, solutionData],
  });
  const hash = await writeContract(config, request);
  const receipt = await getTransactionReceipt(config, { hash });
  const solutionAddress = receipt?.logs?.[0]?.topics?.[1];
  if(solutionAddress){
    return trim(solutionAddress);
  } else {
    throw new Error(`Transaction receipt missing expected "SolutionCreated" event.
      Receipt: ${JSON.stringify(receipt)}`);
  }
}

export const createSolutionWithProfile = async (
  ideaAddress: `0x${string}`,
  fundingToken: `0x${string}`,
  stake: bigint,
  goal: bigint,
  deadline: bigint,
  contributorFee: bigint,
  solutionData: `0x${string}`,
  profileData: `0x${string}`
): Promise<`0x${string}`> => {
  const { request } = await simulateContract(config, {
    abi,
    address: address(),
    functionName: 'createSolutionWithProfile',
    args: [ideaAddress, fundingToken, stake, goal, deadline, contributorFee, solutionData, profileData],
  });
  const hash = await writeContract(config, request);
  const receipt = await getTransactionReceipt(config, { hash });
  const solutionAddress = receipt?.logs?.[0]?.topics?.[1];
  if(solutionAddress){
    return trim(solutionAddress);
  } else {
    throw new Error(`Transaction receipt missing expected "SolutionCreated" event.
      Receipt: ${JSON.stringify(receipt)}`);
  }
}
//endregion
