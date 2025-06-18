import { NextApiRequest, NextApiResponse } from 'next';

// Shared utilities that work in both browser and Node.js
import { createSupabaseServerClient } from '../../shared/utils/supabase-utils';
import { sortCampaignsByFunding } from '../../shared/utils/campaign-utils';

// Types
import type { CampaignsRow } from '../../shared/types/campaigns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CampaignsRow[] | { message: string; error?: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Fetch all approved campaigns
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'approved');

    if (error) {
      console.error('Supabase error:', error);
      return res
        .status(500)
        .json({ message: 'Error fetching campaigns', error: error.message });
    }

    if (!campaigns) {
      return res.status(200).json([]);
    }

    const sortedCampaigns = sortCampaignsByFunding(campaigns as CampaignsRow[]);

    res.status(200).json(sortedCampaigns);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API route error:', error);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: errorMessage });
  }
}
