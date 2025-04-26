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

// Sidebar collapse/expand
const storedLeftSidebarState = localStorage.getItem('leftSidebarCollapsed');
export const leftSidebarCollapsed = signal<boolean>(
  storedLeftSidebarState ? JSON.parse(storedLeftSidebarState) : false
);

// Layout helper functions
export const toggleLeftSidebar = () => {
  const newState = !leftSidebarCollapsed.get();
  leftSidebarCollapsed.set(newState);
  localStorage.setItem('leftSidebarCollapsed', JSON.stringify(newState));
};

export const expandLeftSidebarOnNavigation = () => {
  // Only expand if we're on a larger screen
  if (window.innerWidth >= 768 && leftSidebarCollapsed.get()) {
    leftSidebarCollapsed.set(false);
    localStorage.setItem('leftSidebarCollapsed', 'false');
  }
};
