import { CampaignsRow } from '../types/campaigns';

export function sortCampaignsByFunding(
  campaigns: CampaignsRow[]
): CampaignsRow[] {
  return campaigns.sort((a, b) => {
    // Primary sort: UPD funding amount (highest first)
    const aFunding = a.data.upd_funding_amount || 0;
    const bFunding = b.data.upd_funding_amount || 0;

    if (bFunding !== aFunding) {
      return bFunding - aFunding;
    }

    // Secondary sort: ID (lowest first)
    return a.id - b.id;
  });
}
