import { readContract, simulateContract, writeContract } from '@wagmi/core';
import { config } from '../web3.ts';
import abi from './abis/Idea.json';

export type ideaPosition = {
  tokens: bigint;
  shares: bigint;
};

export class Idea {

  constructor(public address: `0x${string}`) {}

  //region Read methods
  async checkPosition(owner: `0x${string}`, positionIndex: bigint): Promise<ideaPosition> {
    const output = await readContract(config, {
      abi,
      address: this.address,
      functionName: 'checkPosition',
      args: [owner, positionIndex],
    }) as [bigint, bigint];
    return {
      tokens: output[0],
      shares: output[1],
    };
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
    await writeContract(config, request);
  }
  //endregion
}
