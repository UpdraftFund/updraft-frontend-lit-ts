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
  async checkPosition(funder: `0x${string}`, positionIndex?: bigint): Promise<ideaPosition> {
    const output = await readContract(config, {
      abi,
      address: this.address,
      functionName: 'checkPosition',
      args: positionIndex ? [funder, positionIndex] : [funder],
    }) as [bigint, bigint];
    return {
      tokens: output[0],
      shares: output[1],
    };
  }

  async contributorFee(): Promise<bigint> {
    return await readContract(config, {
      abi,
      address: this.address,
      functionName: 'contributorFee',
    }) as bigint;
  }

  async numPositions(funder: `0x${string}`): Promise<bigint> {
    return await readContract(config, {
      abi,
      address: this.address,
      functionName: 'numPositions',
      args: [funder],
    }) as bigint;
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

  async withdraw(positionIndex?: bigint) {
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'withdraw',
      args: positionIndex ? [positionIndex] : undefined,
    });
    await writeContract(config, request);
  }
  //endregion
}
