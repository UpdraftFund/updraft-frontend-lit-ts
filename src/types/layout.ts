export interface PageLayout {
  type?: 'standard' | 'profile' | 'creation';
  title?: string;
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  showHotIdeas: boolean;
}
