// UI feature types
export type Theme = 'light' | 'dark' | 'fun';

export interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  modalOpen: boolean;
  loading: boolean;
}

export interface UISettings {
  theme: Theme;
  animations: boolean;
  compactMode: boolean;
}