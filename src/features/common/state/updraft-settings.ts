import { signal, computed } from '@lit-labs/signals';

import { UpdraftSettings } from '@/types';
import { updraft } from '@contracts/updraft';
import { formatUnits } from 'viem';

export const defaultFunderRewardPct = 5;

export const updraftSettings = signal<UpdraftSettings>({
  percentScale: 1000000,
  updAddress: null,
  updraftAddress: updraft.address,
  percentFee: 0,
  minFee: 0,
});

export const refreshUpdraftSettings = async () => {
  const percentScaleBigInt = (await updraft.read('percentScale')) as bigint;
  const minFee = (await updraft.read('minFee')) as bigint;
  const percentFee = (await updraft.read('percentFee')) as bigint;
  const percentScale = Number(percentScaleBigInt);
  const updAddress = (await updraft.read('feeToken')) as `0x${string}`;
  updraftSettings.set({
    percentScale,
    updAddress,
    updraftAddress: updraft.address,
    percentFee: Number(percentFee) / percentScale,
    minFee: Number(formatUnits(minFee, 18)),
  });
};

export const defaultFunderReward = computed(
  () => updraftSettings.get().percentScale * (defaultFunderRewardPct / 100)
);
