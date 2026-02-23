import { signal } from '@lit-labs/signals';
import { getAccount } from '@wagmi/core';
import { formatUnits } from 'viem';
import { config } from '@utils/web3.ts';

import { Upd } from '@contracts/upd.ts';
import { Balances } from '@/types';
import { refreshUpdraftSettings, updraftSettings } from '@state/common';
import { markComplete } from '@state/user/beginner-tasks';

export const balances = signal<Balances>({
  updraft: { symbol: 'UPD', balance: '0' },
});

export const refreshBalances = async () => {
  const account = getAccount(config);
  const address = account?.address as `0x${string}` | undefined;
  if (!address) {
    balances.set({
      updraft: { symbol: 'UPD', balance: '0' },
    });
    return;
  }
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
  balances.set({
    updraft: { symbol: 'UPD', balance: updBalance },
  });
  if (Number(updBalance) > 5) {
    markComplete('get-upd');
  }
};

export const getBalance = (token: string) => {
  return Number(balances.get()[token].balance);
};
