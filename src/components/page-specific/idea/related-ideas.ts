import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Task } from '@lit/task';
import { consume } from '@lit/context';

import '@/components/shared/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import urqlClient from '@/urql-client';
import { RelatedIdeasDocument } from '@gql';
import { ideaContext, IdeaState } from '@/state/idea-state';

@customElement('related-ideas')
export class RelatedIdeas extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    h2 {
      margin-top: 0;
      font-size: 1.25rem;
    }

    .related-ideas-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .no-ideas {
      color: var(--sl-color-neutral-500);
      font-style: italic;
    }

    .debug-info {
      font-size: 0.8rem;
      color: var(--sl-color-neutral-400);
      margin-top: 0.5rem;
      font-style: italic;
    }
  `;

  @property({ type: String })
  ideaId = '';

  // Consume the idea state context with subscribe: true to get updates
  @consume({ context: ideaContext, subscribe: true })
  ideaState!: IdeaState;

  // Local state for tags in case the context doesn't update properly
  @state()
  private _localTags: string[] = [];

  // Track if we've already run the task for this idea
  private _hasRunTask = false;
  private _tagsLoadedHandler: ((e: CustomEvent) => void) | null = null;

  connectedCallback() {
    super.connectedCallback();

    // Listen for the custom event from idea-page
    this._tagsLoadedHandler = (e: CustomEvent) => {
      const tags = e.detail?.tags;
      if (tags && Array.isArray(tags) && tags.length > 0) {
        // Store tags locally as a backup
        this._localTags = [...tags];
        this._hasRunTask = true;
        // Force a task run with the tags from the event
        this._runTaskWithTags(tags);
      }
    };

    window.addEventListener(
      'idea-tags-loaded',
      this._tagsLoadedHandler as EventListener
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up event listener
    if (this._tagsLoadedHandler) {
      window.removeEventListener(
        'idea-tags-loaded',
        this._tagsLoadedHandler as EventListener
      );
      this._tagsLoadedHandler = null;
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Get tags from state or local backup
    const stateTags = this.ideaState?.tags || [];
    const effectiveTags = stateTags.length > 0 ? stateTags : this._localTags;

    // Check if we have an ideaId and tags, and if the task hasn't run yet or relevant props changed
    const hasTags = effectiveTags.length > 0;
    const shouldRunTask =
      this.ideaId &&
      hasTags &&
      (!this._hasRunTask ||
        changedProperties.has('ideaId') ||
        changedProperties.has('ideaState') ||
        changedProperties.has('_localTags'));

    if (shouldRunTask) {
      this._hasRunTask = true;
      this._runTaskWithTags(effectiveTags);
    }
  }

  // Helper method to run the task with specific tags
  private _runTaskWithTags(tags: string[]) {
    this._currentTaskTags = tags;
    this._getRelatedIdeasTask.run();
  }

  // Store the current tags being used for the task
  private _currentTaskTags: string[] = [];

  private _getRelatedIdeasTask = new Task(
    this,
    async () => {
      // Use the current task tags or fall back to state/local tags
      const tags =
        this._currentTaskTags.length > 0
          ? this._currentTaskTags
          : this.ideaState?.tags?.length > 0
            ? this.ideaState.tags
            : this._localTags;

      if (!this.ideaId || !tags || tags.length === 0) {
        return { ideas: [], debug: { reason: 'No ideaId or tags available' } };
      }

      try {
        // Query for each tag and combine results
        const allResults = await Promise.all(
          tags.map((tag: string) => {
            return urqlClient
              .query(RelatedIdeasDocument, {
                ideaId: this.ideaId,
                tag,
              })
              .toPromise();
          })
        );

        // Combine and deduplicate results
        const allIdeas = allResults.flatMap(
          (result) => result.data?.ideas || []
        );

        // Deduplicate by idea ID
        const uniqueIdeas = Array.from(
          new Map(allIdeas.map((idea) => [idea.id, idea])).values()
        );

        // Sort by shares (descending)
        uniqueIdeas.sort((a, b) => Number(b.shares) - Number(a.shares));

        // Take only the top 3
        const topIdeas = uniqueIdeas.slice(0, 3);

        return {
          ideas: topIdeas,
          debug: {
            queriedTags: tags,
            resultsCount: allIdeas.length,
            uniqueCount: uniqueIdeas.length,
            finalCount: topIdeas.length,
          },
        };
      } catch (err) {
        console.error('Error fetching related ideas:', err);
        return {
          ideas: [],
          debug: { error: err instanceof Error ? err.message : String(err) },
        };
      }
    },
    // Don't include reactive dependencies in the dependency array
    // as we'll manually control when the task runs
    () => []
  );

  render() {
    return html`
      <div>
        <h2>Related Ideas</h2>
        ${this._getRelatedIdeasTask.render({
          pending: () => html`<sl-spinner></sl-spinner>`,
          complete: (data) => {
            const ideas = data?.ideas || [];

            return html`
              ${ideas.length > 0
                ? html`
                    <div class="related-ideas-list">
                      ${ideas.map(
                        (idea) => html`
                          <idea-card-small .idea=${idea}></idea-card-small>
                        `
                      )}
                    </div>
                  `
                : html` <div class="no-ideas">No related ideas found</div> `}
            `;
          },
          error: (err: unknown) => {
            console.error('Error rendering related ideas:', err);
            return html` <div class="error">Error loading related ideas</div> `;
          },
        })}
      </div>
    `;
  }
}
