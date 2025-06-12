/**
 * Version Check Service
 * 
 * This module provides functionality to check for new application versions
 * and prompt users to refresh their browser when a new version is detected.
 */

// Store the version that was initially loaded
let initialVersion: string | null = null;

// Store the latest version from the server
let latestVersion: string | null = null;

// Flag to track if we've already shown the refresh prompt
let refreshPromptShown = false;

/**
 * Initialize the version check service
 * This should be called when the application starts
 */
export function initVersionCheck(): void {
  // Get the current version from the meta tag (set during build)
  initialVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content') || null;
  
  // Start periodic version checks
  startVersionChecks();
}

/**
 * Start periodic version checks
 * Checks for a new version every 5 minutes
 */
function startVersionChecks(): void {
  // Do an initial check
  checkForNewVersion();
  
  // Then check periodically
  setInterval(() => {
    checkForNewVersion();
  }, 5 * 60 * 1000); // Check every 5 minutes
}

/**
 * Check for a new version by fetching version.json
 * This file is updated during the build process
 */
async function checkForNewVersion(): Promise<void> {
  try {
    // Add a cache-busting parameter to prevent caching
    const response = await fetch(`/version.json?t=${Date.now()}`);
    
    if (!response.ok) {
      console.error('Failed to fetch version information');
      return;
    }
    
    const data = await response.json();
    latestVersion = data.version;
    
    // If we have both versions and they don't match, show the refresh prompt
    if (initialVersion && latestVersion && initialVersion !== latestVersion && !refreshPromptShown) {
      showRefreshPrompt();
    }
  } catch (error) {
    console.error('Error checking for new version:', error);
  }
}

/**
 * Show a prompt to the user to refresh their browser
 */
function showRefreshPrompt(): void {
  // Set the flag to prevent showing the prompt multiple times
  refreshPromptShown = true;
  
  // Dispatch a custom event that the app-refresh-prompt component will listen for
  window.dispatchEvent(new CustomEvent('app-version-updated', {
    detail: {
      initialVersion,
      latestVersion
    }
  }));
}

/**
 * Get the current version status
 * @returns An object with the initial and latest versions
 */
export function getVersionStatus(): { initialVersion: string | null, latestVersion: string | null, needsRefresh: boolean } {
  return {
    initialVersion,
    latestVersion,
    needsRefresh: initialVersion !== latestVersion && initialVersion !== null && latestVersion !== null
  };
}

/**
 * Manually trigger a version check
 * This can be called if the user suspects they might be on an old version
 */
export function manualCheckForNewVersion(): Promise<void> {
  return checkForNewVersion();
}

/**
 * Refresh the page to update to the latest version
 */
export function refreshPage(): void {
  window.location.reload();
}

