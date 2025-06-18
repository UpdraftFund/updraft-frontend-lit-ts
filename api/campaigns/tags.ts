import type { NextApiRequest, NextApiResponse } from 'next';

// Shared utilities that work in both browser and Node.js
import { createSupabaseServerClient } from '../../shared/utils/supabase-utils';
import { sortCampaignsByFunding } from '../../shared/utils/campaign-utils';

// Types
import {
  type CampaignsRow,
  type CampaignTags,
} from '../../shared/types/campaigns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CampaignTags[] | { message: string; error?: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('campaigns')
      .select('id, data')
      .eq('status', 'approved');

    if (error) {
      console.error('Supabase error:', error);
      return res
        .status(500)
        .json({ message: 'Error fetching campaigns', error: error.message });
    }

    if (!data) {
      return res.status(200).json([]);
    }

    // Sort campaigns by UPD funding amount (highest first), then by ID (lowest first)
    const sortedCampaigns = sortCampaignsByFunding(data as CampaignsRow[]);

    // Create campaign tags from sorted campaigns
    const campaignTags: CampaignTags[] = sortedCampaigns.map((campaign) => {
      return {
        id: campaign.id,
        name: campaign.data.name,
        tags: campaign.data.tags,
      };
    });

    res.status(200).json(campaignTags);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API route error:', error);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: errorMessage });
  }
}
