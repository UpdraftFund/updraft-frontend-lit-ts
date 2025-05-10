import { Abi } from 'abitype';

import abi from './abis/ERC20.json';
import { Contract } from './contract';

/**
 * ERC20 Contract Interface
 *
 * This class provides a standard interface for interacting with ERC20 tokens
 * using the OpenZeppelin ERC20 standard interface.
 *
 * This ERC20 ABI is based on the OpenZeppelin ERC20 implementation
 * @see https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
 * @license MIT
 */

export class ERC20 extends Contract {
  constructor(address: `0x${string}`) {
    super(abi as Abi, address);
  }
}
