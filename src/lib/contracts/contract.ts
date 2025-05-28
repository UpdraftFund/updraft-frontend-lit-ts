import { Abi } from 'abitype';
import { readContract, simulateContract, writeContract } from '@wagmi/core';
import { config } from '@utils/web3';

/**
 * Interface for contract interactions
 * Provides a standardized way to interact with smart contracts
 */
export interface IContract {
  /**
   * The contract address
   */
  readonly address: `0x${string}`;

  /**
   * The contract ABI
   */
  readonly abi: Abi;

  /**
   * Read data from a contract
   * @param functionName The name of the function to call
   * @param args Optional arguments to pass to the function
   * @returns A promise that resolves to the function result
   */
  read(functionName: string, args?: unknown[]): Promise<unknown>;

  /**
   * Write data to a contract (execute a transaction)
   * @param functionName The name of the function to call
   * @param args Optional arguments to pass to the function
   * @returns A promise that resolves to the transaction hash
   */
  write(functionName: string, args?: unknown[]): Promise<string>;
}

/**
 * Base implementation of the IContract interface
 */
export class Contract implements IContract {
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

  async willSucceed(functionName: string, args?: unknown[]) {
    try {
      await simulateContract(config, {
        abi: this.abi,
        address: this.address,
        functionName,
        args,
      });
      return true;
    } catch {
      return false;
    }
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
