import { css } from 'lit';

export const smallCardStyles = css`
  :host {
    display: inline-block;
    color: var(--main-foreground);
  }

  a {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  a:hover h3 {
    text-decoration: underline;
    color: var(--accent);
  }

  hr {
    height: 1px;
    background-color: var(--layout-divider); /* Line color */
    border: none;
  }

  h3 {
    margin-top: 0;
    font-size: 0.9rem;
    font-weight: 700;
  }

  p {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--subtle-text);
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
`;
