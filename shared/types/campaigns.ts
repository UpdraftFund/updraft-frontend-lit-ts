import type { Database } from './supabase';
import type { Campaign } from './campaign';

export type CampaignsRow = Omit<
  Database['public']['Tables']['campaigns']['Row'],
  'data'
> & {
  data: Campaign;
};

export type CampaignsInsert = Omit<
  Database['public']['Tables']['campaigns']['Insert'],
  'data'
> & {
  data: Campaign;
};

export type CampaignsUpdate = Omit<
  Database['public']['Tables']['campaigns']['Update'],
  'data'
> & {
  data: Partial<Campaign>;
};

// Composite type that combines id from database with name and tags from Campaign
export type CampaignTags = {
  id: number;
  name: string;
  tags: Campaign['tags'];
};
