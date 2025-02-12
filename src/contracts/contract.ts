import { Abi } from 'abitype';
import { readContract, simulateContract, writeContract } from '@wagmi/core';
import { config } from '@/web3';

export class Contract {
  constructor(public abi: Abi, private _address: `0x${string}` = '0x0') {}

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
    const { request } = await simulateContract(config, {
      abi: this.abi,
      address: this.address,
      functionName,
      args,
    });
    return writeContract(config, request);
  }
}
