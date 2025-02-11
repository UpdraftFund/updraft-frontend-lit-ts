import { Abi } from 'abitype';

import { config } from '@/web3';
import updAddresses from './updAddresses.json';
import abi from './abis/UPDToken.json';
import { Contract } from "./contract";

interface AddressMap {
  [key: `eip155:${number}`]: {
    address: `0x${string}`;
  };
}

class Upd extends Contract {
  constructor() {
    super(abi as Abi);
  }

  get address(): `0x${string}` {
    const chainId = config.getClient().chain?.id;

    if (chainId === undefined) {
      throw new Error('No chain is currently connected.');
    }

    const eip155id: keyof AddressMap = `eip155:${chainId}`;

    const updAddress = (updAddresses as AddressMap)[eip155id]?.address;

    if (!updAddress) {
      throw new Error(`UPD is not deployed on chain: ${eip155id}`);
    }

    return updAddress;
  }
}

export const upd = new Upd();

