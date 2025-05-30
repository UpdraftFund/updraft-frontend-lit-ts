import { css } from 'lit';

export const largeCardStyles = css`
  .card {
    overflow: hidden;
    padding: 1rem 0 0.5rem;
    width: 100%;
    border-bottom: 1px solid var(--border-default);
  }

  .card-header {
    margin-bottom: 1rem;
  }

  h3 {
    margin-top: 0;
    margin-bottom: 0.25rem;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.4;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    color: var(--accent);
  }

  .byline {
    color: var(--sl-color-neutral-600);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0;
    margin: 0 0 1rem 0;
  }

  .info-row li {
    list-style: none;
    font-size: 0.9rem;
    color: var(--sl-color-neutral-700);
  }

  .text-with-tooltip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .info-icon {
    font-size: 0.75rem;
    cursor: help;
  }

  .description {
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
`;
