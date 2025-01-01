import { readContract, simulateContract, writeContract } from '@wagmi/core';
import { config } from '../web3.ts';
import abi from './abis/Solution.json';

export type solutionPosition = {
  reward: bigint;
  shares: bigint;
};

export class Solution {

  constructor(public address: `0x${string}`) {}

  //region Read methods
  async checkPosition(funder: `0x${string}`, positionIndex?: bigint): Promise<solutionPosition> {
    const [reward, shares] = await readContract(config, {
      abi,
      address: this.address,
      functionName: 'checkPosition',
      args: [funder, positionIndex],
    }) as [bigint, bigint];
    return { reward, shares };
  }

  async getStake(staker: `0x${string}`): Promise<bigint> {
    return await readContract(config, {
      abi,
      address: staker,
      functionName: 'stakes',
    }) as bigint;
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

  async tokensWithdrawn(): Promise<bigint> {
    return await readContract(config, {
      abi,
      address: this.address,
      functionName: 'tokensWithdrawn',
    }) as bigint;
  }

  async totalTokens(): Promise<bigint> {
    return await readContract(config, {
      abi,
      address: this.address,
      functionName: 'totalTokens',
    }) as bigint;
  }
  //endregion

  //region Write methods
  async addStake(amount: bigint) {
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'addStake',
      args: [amount],
    });
    await writeContract(config, request);
  }

  async collectFees(positionIndex?: bigint) {
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'collectFees',
      args: positionIndex ? [positionIndex] : undefined,
    });
    await writeContract(config, request);
  }

  async contribute(amount: bigint) {
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'contribute',
      args: [amount],
    });
    await writeContract(config, request);
  }

  async extendGoal(goal: bigint, deadline?: bigint, solutionInfo?: `0x${string}`) {
    const args: [bigint, bigint?, `0x${string}`?] = [goal];
    if(deadline){
      args.push(deadline);
      if(solutionInfo) {
        args.push(solutionInfo);
      }
    }
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'extendGoal',
      args
    });
    await writeContract(config, request);
  }

  async refund(positionIndex?: bigint) {
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'refund',
      args: positionIndex ? [positionIndex] : undefined,
    });
    await writeContract(config, request);
  }

  async removeStake(amount: bigint) {
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'removeStake',
      args: [amount],
    });
    await writeContract(config, request);
  }

  async updateSolution(solutionInfo: `0x${string}`) {
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'updateSolution',
      args: [solutionInfo],
    });
    await writeContract(config, request);
  }

  async withdrawFunds(to: `0x${string}`, amount: bigint) {
    const { request } = await simulateContract(config, {
      abi,
      address: this.address,
      functionName: 'withdrawFunds',
      args: [to, amount],
    });
    await writeContract(config, request);
  }
  //endregion
}
