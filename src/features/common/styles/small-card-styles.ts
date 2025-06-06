import { css } from 'lit';

export const smallCardStyles = css`
  :host {
    display: inline-block;
    color: var(--main-foreground);
    container-type: inline-size;
  }

  a {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  a:hover .entity-name {
    text-decoration: underline;
    color: var(--accent);
  }

  .entity-name {
    margin-top: 0;
    font-size: 0.9rem;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  hr {
    height: 1px;
    background-color: var(--layout-divider); /* Line color */
    border: none;
  }

  formatted-text {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--subtle-text);
    max-height: 4.625rem;
    --fade-color: var(--main-background);
    --fade-height: 0.75rem;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    list-style: none;
    padding: 0;
    font-size: 0.8rem;
  }

  .info-row li {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  @container (width > 20rem) {
    .info-row {
      justify-content: flex-start;
      gap: 2rem;
    }
  }
`;
