import { Abi } from 'abitype';
import { readContract, simulateContract, writeContract } from '@wagmi/core';
import { config } from '@/features/common/utils/web3';

export class Contract {
  constructor(
    public abi: Abi,
    private _address: `0x${string}` = '0x0'
  ) {}

  get address(): `0x${string}` {
    return this._address;
  }
  set address(value: `0x${string}`) {
    this._address = value;
  }

  async read(functionName: string, args?: unknown[]) {
    return readContract(config, {
      abi: this.abi,
      address: this.address,
      functionName,
      args,
    });
  }

  async write(functionName: string, args?: unknown[]) {
    try {
      const { request } = await simulateContract(config, {
        abi: this.abi,
        address: this.address,
        functionName,
        args,
      });
      return writeContract(config, request);
    } catch (error) {
      console.error('Contract write error:', error);
      // Re-throw the error with more context to help debugging
      throw error;
    }
  }
}
