import { readContract, simulateContract, writeContract } from '@wagmi/core';
import { config } from '@/web3.ts';
import abi from '../abis/Idea.json';

export type ideaPosition = {
  tokens: bigint;
  shares: bigint;
};

export class Idea {

  constructor(public address: `0x${string}`) {}

  //region Read methods
  async checkPosition(funder: `0x${string}`, positionIndex?: bigint): Promise<ideaPosition> {
    const [tokens, shares] = await readContract(config, {
      abi,
      address: this.address,
      functionName: 'checkPosition',
      args: [funder, positionIndex],
    }) as [bigint, bigint];
    return { tokens, shares };
  }

  async contributorFee(): Promise<bigint> {
    return readContract(config, {
      abi,
      address: this.address,
      functionName: 'contributorFee',
    }) as Promise<bigint>;
  }

  async numPositions(funder: `0x${string}`): Promise<bigint> {
    return readContract(config, {
      abi,
      address: this.address,
      functionName: 'numPositions',
      args: [funder],
    }) as Promise<bigint>;
  }
  //endregion

  //region Write methods
  async contribute(amount: bigint) {
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'contribute',
      args: [amount],
    });
    return writeContract(config, request);
  }

  async withdraw(positionIndex?: bigint) {
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'withdraw',
      args: positionIndex ? [positionIndex] : undefined,
    });
    return writeContract(config, request);
  }
  //endregion
}
