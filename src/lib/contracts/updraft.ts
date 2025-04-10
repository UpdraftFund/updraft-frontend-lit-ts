import { Abi } from 'abitype';

import { config } from '@utils/web3.ts';
import updraftAddresses from './updraftAddresses.json';
import abi from './abis/Updraft.json';
import { Contract } from './contract.ts';

interface AddressMap {
  [chainName: string]: `0x${string}`;
}

const addresses = updraftAddresses as AddressMap;

class Updraft extends Contract {
  constructor() {
    super(abi as Abi);
  }

  get address(): `0x${string}` {
    const currentChainName = config.getClient().chain?.name;

    if (!currentChainName) {
      throw new Error('No chain is currently connected.');
    }

    const updraftAddress = addresses[currentChainName];

    if (!updraftAddress) {
      throw new Error(`Updraft is not deployed on chain: ${currentChainName}`);
    }

    return updraftAddress;
  }
}

export const updraft = new Updraft();
