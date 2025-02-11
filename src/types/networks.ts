import updAddresses from '@contracts/updAddresses.json';

export type Connection = {
  connected: boolean;
  address?: `0x${string}`;
  network?: {
    name?: string;
    id?: keyof typeof updAddresses;
  }
}