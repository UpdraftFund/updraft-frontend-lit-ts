import { html, signal } from '@lit-labs/signals';

export const showLeftSidebar = signal(true);
export const showRightSidebar = signal(true);
export const topBarContent = signal(html``);
export const rightSidebarContent = signal(html``);

export default {
  showLeftSidebar,
  showRightSidebar,
  topBarContent,
  rightSidebarContent,
};
