import { Abi } from 'abitype';

import abi from './abis/Solution.json';
import { Contract } from './contract.ts';

export class SolutionContract extends Contract {
  constructor(address: `0x${string}`) {
    super(abi as Abi, address);
  }
}
