import { html } from 'lit';
import layout from '@state/layout';
import { IdeaDocument } from '@gql';
import urqlClient from '@utils/urql-client';

export function createSolutionHeading(ideaId: string) {
  // Set the default heading first
  layout.topBarContent.set(html`
    <page-heading>Draft a new Solution</page-heading>
  `);

  return urqlClient
    .query(IdeaDocument, {
      ideaId,
    })
    .subscribe((result) => {
      const ideaData = result.data?.idea;
      if (ideaData) {
        layout.topBarContent.set(html`
          <page-heading>
            Draft a new Solution
            <a href="/idea/${ideaId}">for ${ideaData.name}</a>
          </page-heading>
        `);
      }

      // If there was an error, we keep the default heading
      if (result.error) {
        console.error('Error fetching idea for heading:', result.error);
      }
    });
}
