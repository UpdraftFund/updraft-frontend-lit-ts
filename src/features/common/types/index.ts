export * from './updraft';

// Define a type for the UpdraftSettingsProvider element
export interface UpdraftSettingsProvider extends HTMLElement {
  settings: import('./updraft').UpdraftSettings;
}
