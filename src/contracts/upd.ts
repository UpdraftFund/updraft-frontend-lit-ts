import { Abi } from 'abitype';

import abi from './abis/UPDToken.json';
import { Contract } from "./contract";

export class Upd extends Contract {
  constructor(address: `0x${string}`) {
    super(abi as Abi, address);
  }
}
