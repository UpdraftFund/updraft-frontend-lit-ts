import { customElement, property } from 'lit/decorators.js';
import {
  SolutionContributionsDocument,
  SolutionContributionsQuery,
  SolutionContributionsQueryVariables,
} from '@gql';
import { TopContributorsBase } from '@components/common/top-contributors-base';

@customElement('top-funders')
export class TopFunders extends TopContributorsBase<
  SolutionContributionsQuery,
  SolutionContributionsQueryVariables
> {
  @property({ type: String })
  get solutionId(): string {
    return this.entityId;
  }

  set solutionId(value: string) {
    this.entityId = value;
  }

  constructor() {
    super({
      contributionsDocument: SolutionContributionsDocument,
      entityIdVariableName: 'solutionId',
      contributionsPath: 'solutionContributions',
      titleText: 'Top Funders',
      noContributorsText: 'No funders yet',
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-funders': TopFunders;
  }
}
