import { readContract } from '@wagmi/core';
import { config } from '../web3.ts';
import addresses from './updraftAddresses.json';
import abi from './abis/Updraft.json';

type AddressMap = {
  [chainName: string]: `0x${string}`;
};

const updraftAddresses: AddressMap = addresses as AddressMap;

const updraftAddress = () => {
  const address: `0x${string}` = updraftAddresses[config.getClient().chain.name];
  return address;
};

const feeToken = async () => {
  return await readContract(config, {
    abi,
    address: updraftAddress(),
    functionName: 'feeToken',
  });
}

export {
  updraftAddress,
  feeToken,
}

