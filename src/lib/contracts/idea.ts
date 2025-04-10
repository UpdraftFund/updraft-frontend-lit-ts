import { Abi } from 'abitype';

import abi from './abis/Idea.json';
import { Contract } from './contract';

export class IdeaContract extends Contract {
  constructor(address: `0x${string}`) {
    super(abi as Abi, address);
  }
}
