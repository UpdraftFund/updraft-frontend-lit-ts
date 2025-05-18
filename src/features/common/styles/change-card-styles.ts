import { css } from 'lit';

export const changeCardStyles = css`
  sl-card {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  sl-card::part(header) {
    border-bottom-width: 0;
  }

  sl-card::part(body) {
    padding-top: 0;
    font-size: 0.875rem;
  }

  sl-card::part(footer) {
    font-size: 0.8rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .change-card-heading,
  .new-solution-heading,
  .solution-body {
    text-decoration: none;
    color: var(--main-foreground);
  }

  .change-card-heading:hover,
  .new-solution-heading:hover {
    color: var(--link);
    text-decoration: underline;
  }

  .change-card-heading {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .change-card-subheading {
    font-size: 1rem;
    color: var(--subtle-text);
    margin-top: 0.5rem;
  }

  .additional-count {
    font-style: italic;
    color: var(--sl-color-neutral-600);
    margin-top: 0.25rem;
  }

  .solution-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .new-solution-heading {
    font-size: 1rem;
    font-weight: 600;
  }

  .goal-message {
    margin-top: 1rem;
    font-size: 1rem;
  }

  .funding-details {
    margin-top: 0.5rem;
    text-align: center;
    color: var(--sl-color-neutral-700);
  }

  a {
    color: var(--link);
  }
`;
