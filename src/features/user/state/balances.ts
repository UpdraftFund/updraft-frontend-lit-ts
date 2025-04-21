import { signal } from '@lit-labs/signals';
import { getAccount, getBalance as getEthBalance } from '@wagmi/core';
import { config } from '@utils/web3.ts';
import { formatUnits } from 'viem';
import { updraft } from '@contracts/updraft.ts';
import { Upd } from '@contracts/upd.ts';
import { Balances } from '@/types';

export const balances = signal<Balances>({
  eth: { symbol: 'ETH', balance: '0' },
  updraft: { symbol: 'UPD', balance: '0' },
});

export const refreshBalances = async () => {
  const account = getAccount(config);
  const address = account?.address as `0x${string}` | undefined;
  console.log('refreshBalances: address', address);
  if (!address) {
    balances.set({
      eth: { symbol: 'ETH', balance: '0' },
      updraft: { symbol: 'UPD', balance: '0' },
    });
    return;
  }
  let ethBalance;
  try {
    const eth = await getEthBalance(config, { address });
    ethBalance = formatUnits(eth.value, eth.decimals);
  } catch {
    ethBalance = '0';
  }
  console.log('refreshBalances: eth', ethBalance);
  let updBalance;
  try {
    const updAddress = (await updraft.read('feeToken')) as `0x${string}`;
    const upd = new Upd(updAddress);
    const rawUpd = await upd.read('balanceOf', [address]);
    updBalance = formatUnits(rawUpd as bigint, 18);
  } catch {
    updBalance = '0';
  }
  console.log('refreshBalances: upd', updBalance);
  balances.set({
    eth: { symbol: 'ETH', balance: ethBalance },
    updraft: { symbol: 'UPD', balance: updBalance },
  });
};

export const getBalance = (token: string) => {
  return balances.get()[token].balance;
};
