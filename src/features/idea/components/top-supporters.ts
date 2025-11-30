import { customElement, property } from 'lit/decorators.js';
import { IdeaContributionsDocument, IdeaContributionsQuery, IdeaContributionsQueryVariables } from '@gql';
import { TopContributorsBase } from '@components/common/top-contributors-base';

@customElement('top-supporters')
export class TopSupporters extends TopContributorsBase<IdeaContributionsQuery, IdeaContributionsQueryVariables> {
  @property({ type: String })
  get ideaId(): string {
    return this.entityId;
  }

  set ideaId(value: string) {
    this.entityId = value;
  }

  constructor() {
    super({
      contributionsDocument: IdeaContributionsDocument,
      entityIdVariableName: 'ideaId',
      contributionsPath: 'ideaContributions',
      titleText: 'Top Supporters',
      noContributorsText: 'No supporters yet',
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-supporters': TopSupporters;
  }
}
