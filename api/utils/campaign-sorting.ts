import type { CampaignsRow } from '@/types';

/**
 * Sorts campaigns by UPD funding amount (highest first), then by ID (lowest first)
 * @param campaigns Array of campaign rows to sort
 * @returns Sorted array of campaigns
 */
export function sortCampaignsByFunding(
  campaigns: CampaignsRow[]
): CampaignsRow[] {
  return campaigns.sort((a, b) => {
    // Get UPD funding amounts
    const aUpdFunding =
      a.data.funding?.find((f) => f.token === 'UPD')?.amount || 0;
    const bUpdFunding =
      b.data.funding?.find((f) => f.token === 'UPD')?.amount || 0;

    // Primary sort: UPD funding amount (highest first)
    if (aUpdFunding !== bUpdFunding) {
      return bUpdFunding - aUpdFunding;
    }

    // Secondary sort: ID (lowest first)
    return a.id - b.id;
  });
}
