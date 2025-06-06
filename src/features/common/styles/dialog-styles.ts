import { css } from 'lit';

export const dialogStyles = css`
  sl-dialog::part(panel) {
    border-radius: 15px;
    color: var(--main-foreground);
    background-color: var(--main-background);
    border: 2px solid var(--dialog-border);
  }

  sl-dialog::part(title) {
    font-weight: bold;
    font-size: 1.5rem;
  }

  sl-dialog::part(body) {
    padding-top: 0;
  }

  sl-dialog [slot='label'] {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;
