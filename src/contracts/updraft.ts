import { Abi } from 'abitype';

import { config } from '../web3.ts';
import updraftAddresses from './updraftAddresses.json';
import abi from './abis/Updraft.json';
import { Contract } from "./contract.ts";

type AddressMap = {
  [chainName: string]: `0x${string}`;
};

const addresses: AddressMap = updraftAddresses as AddressMap;

class Updraft extends Contract {
  constructor() {
    super(abi as Abi);
  }

  get address(): `0x${string}` {
    const currentChainName = config.getClient().chain?.name;

    if (!currentChainName) {
      throw new Error('No chain is currently connected.');
    }

    const updraftAddress = addresses[currentChainName];

    if (!updraftAddress) {
      throw new Error(`Updraft is not deployed on chain: ${currentChainName}`);
    }

    return updraftAddress;
  }
}

export const updraft = new Updraft();
//
// export const address = () => {
//   const address: `0x${string}` = addresses[config.getClient().chain.name];
//   return address;
// };
//
// //region Read methods
// export const percentScale = async (): Promise<bigint> => {
//   return readContract(config, {
//     abi,
//     address: address(),
//     functionName: 'percentScale',
//   }) as Promise<bigint>;
// };
//
// export const feeToken = async (): Promise<`0x${string}`> => {
//   return readContract(config, {
//     abi,
//     address: address(),
//     functionName: 'feeToken',
//   }) as Promise<`0x${string}`>;
// };
//
// export const minFee = async (): Promise<bigint> => {
//   return readContract(config, {
//     abi,
//     address: address(),
//     functionName: 'minFee',
//   }) as Promise<bigint>;
// }
//
// export const percentFee = async (): Promise<bigint> => {
//   return readContract(config, {
//     abi,
//     address: address(),
//     functionName: 'percentFee',
//   }) as Promise<bigint>;
// }
// //endregion
//
// //region Write methods
// export const updateProfile = async (profileData: `0x${string}`) => {
//   const { request } = await simulateContract(config, {
//     abi,
//     address: address(),
//     functionName: 'updateProfile',
//     args: [profileData],
//   });
//   return writeContract(config, request);
// }
//
// export const createIdea = async (contributorFee: bigint, contribution: bigint, ideaData: `0x${string}`)
// : Promise<`0x${string}`> => {
//   const { request } = await simulateContract(config, {
//     abi,
//     address: address(),
//     functionName: 'createIdea',
//     args: [contributorFee, contribution, ideaData],
//   });
//   return writeContract(config, request);
// }
//
// export const createIdeaWithProfile = async (
//   contributorFee: bigint,
//   contribution: bigint,
//   ideaData: `0x${string}`,
//   profileData: `0x${string}`
// ): Promise<`0x${string}`> => {
//   const { request } = await simulateContract(config, {
//     abi,
//     address: address(),
//     functionName: 'createIdeaWithProfile',
//     args: [contributorFee, contribution, ideaData, profileData],
//   });
//   return writeContract(config, request);
// }
//
// export const createSolution = async (
//   ideaAddress: `0x${string}`,
//   fundingToken: `0x${string}`,
//   stake: bigint,
//   goal: bigint,
//   deadline: bigint,
//   contributorFee: bigint,
//   solutionData: `0x${string}`
// ): Promise<`0x${string}`> => {
//   const { request } = await simulateContract(config, {
//     abi,
//     address: address(),
//     functionName: 'createSolution',
//     args: [ideaAddress, fundingToken, stake, goal, deadline, contributorFee, solutionData],
//   });
//   return writeContract(config, request);
// }
//
// export const createSolutionWithProfile = async (
//   ideaAddress: `0x${string}`,
//   fundingToken: `0x${string}`,
//   stake: bigint,
//   goal: bigint,
//   deadline: bigint,
//   contributorFee: bigint,
//   solutionData: `0x${string}`,
//   profileData: `0x${string}`
// ): Promise<`0x${string}`> => {
//   const { request } = await simulateContract(config, {
//     abi,
//     address: address(),
//     functionName: 'createSolutionWithProfile',
//     args: [ideaAddress, fundingToken, stake, goal, deadline, contributorFee, solutionData, profileData],
//   });
//   return writeContract(config, request);
// }
// //endregion
