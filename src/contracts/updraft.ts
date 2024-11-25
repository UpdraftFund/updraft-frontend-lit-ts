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
export const percentScale = async (): Promise<bigint> => {
  return await readContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'percentScale',
  }) as bigint;
};

export const feeToken = async (): Promise<`0x${string}`> => {
  return await readContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'feeToken',
  }) as `0x${string}`;
};

export const minFee = async (): Promise<bigint> => {
  return await readContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'minFee',
  }) as bigint;
}

export const percentFee = async (): Promise<bigint> => {
  return await readContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'percentFee',
  }) as bigint;
}
//endregion

//region Write Functions
export const updateProfile = async (profileData: `0x${string}`) => {
  const { request } = await simulateContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'updateProfile',
    args: [profileData],
  });
  await writeContract(config, request);
}

export const createIdea = async (contributorFee: BigInt, contribution: BigInt, ideaData: `0x${string}`)
: Promise<`0x${string}`> => {
  const { request } = await simulateContract(config, {
    abi,
    address: updraftAddress(),
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
  contributorFee: BigInt,
  contribution: BigInt,
  ideaData: `0x${string}`,
  profileData: `0x${string}`
): Promise<`0x${string}`> => {
  const { request } = await simulateContract(config, {
    abi,
    address: updraftAddress(),
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
  stake: BigInt,
  goal: BigInt,
  deadline: BigInt,
  contributorFee: BigInt,
  solutionData: `0x${string}`
): Promise<`0x${string}`> => {
  const { request } = await simulateContract(config, {
    abi,
    address: updraftAddress(),
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
  stake: BigInt,
  goal: BigInt,
  deadline: BigInt,
  contributorFee: BigInt,
  solutionData: `0x${string}`,
  profileData: `0x${string}`
): Promise<`0x${string}`> => {
  const { request } = await simulateContract(config, {
    abi,
    address: updraftAddress(),
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
