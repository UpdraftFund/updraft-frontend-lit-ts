import { signal } from '@lit-labs/signals';
import { getAccount, getBalance as getEthBalance } from '@wagmi/core';
import { formatUnits } from 'viem';
import { config } from '@utils/web3.ts';

import { Upd } from '@contracts/upd.ts';
import { Balances } from '@/types';
import { refreshUpdraftSettings, updraftSettings } from '@state/common';
import { markComplete } from '@state/user/beginner-tasks';

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
  let ethBalance = '0';
  try {
    const eth = await getEthBalance(config, { address });
    ethBalance = formatUnits(eth.value, eth.decimals);
  } catch {}
  console.log('refreshBalances: eth', ethBalance);
  let updBalance = '0';
  try {
    let updAddress = updraftSettings.get().updAddress;
    if (!updAddress) {
      await refreshUpdraftSettings();
      updAddress = updraftSettings.get().updAddress;
    }
    if (updAddress) {
      const upd = new Upd(updAddress);
      const rawUpd = await upd.read('balanceOf', [address]);
      updBalance = formatUnits(rawUpd as bigint, 18);
    }
  } catch {}
  console.log('refreshBalances: upd', updBalance);
  balances.set({
    eth: { symbol: 'ETH', balance: ethBalance },
    updraft: { symbol: 'UPD', balance: updBalance },
  });
  if (Number(updBalance) > 5) {
    markComplete('get-upd');
  }
};

export const getBalance = (token: string) => {
  return Number(balances.get()[token].balance);
};
