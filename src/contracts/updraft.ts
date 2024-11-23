import { writeContract, readContract } from '@wagmi/core';
import { config } from '../web3.ts';
import updraftAddresses from './updraftAddresses.json';
import abi from './abis/Updraft.json';

const updraftAddress = () => {
  return updraftAddresses[config.getClient().chain.name];
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

