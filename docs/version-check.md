# Version Check Implementation

This document explains the implementation of the version check feature, which helps users refresh their browser when a new version of the application is released.

## Overview

When a new version of the application is deployed, users who already have the application open in their browser will continue to use the old version until they refresh their browser. This can lead to issues if there are breaking changes or important updates in the new version.

The version check feature addresses this by:

1. Generating a unique version identifier during the build process
2. Periodically checking if a new version is available
3. Prompting users to refresh their browser when a new version is detected

## Implementation Details

### Version Generation

During the build process, a script (`scripts/generate-version.js`) generates a unique version identifier based on the current timestamp. This version is:

1. Stored in a `version.json` file that is served with the application
2. Injected into the HTML as a meta tag

### Version Checking

The version check service (`src/features/common/utils/version-check.ts`) handles:

1. Initializing the version check when the application starts
2. Periodically checking for a new version by fetching the `version.json` file
3. Comparing the current version with the latest version
4. Triggering a refresh prompt when a new version is detected

### Refresh Prompt

The refresh prompt component (`src/features/common/components/app-refresh-prompt.ts`):

1. Displays a banner at the top of the page when a new version is detected
2. Provides options to refresh immediately or dismiss the prompt
3. Handles the refresh action

## How It Works

1. When the application is built, a unique version identifier is generated and stored in `version.json`
2. When a user loads the application, the version from the HTML meta tag is stored as the initial version
3. The application periodically fetches the `version.json` file with a cache-busting parameter
4. If the version in the fetched file differs from the initial version, a refresh prompt is shown
5. The user can choose to refresh immediately or dismiss the prompt

## Configuration

The version check service is configured to:

- Check for a new version every 5 minutes
- Show the refresh prompt only once per session
- Allow manual version checks if needed

## Testing

To test the version check feature:

1. Build and deploy the application
2. Open the application in a browser
3. Deploy a new version of the application
4. Wait for the version check to run (or trigger it manually)
5. Verify that the refresh prompt appears

## Future Improvements

Potential future improvements include:

- Adding a countdown to auto-refresh after a certain period
- Providing more detailed information about what changed in the new version
- Adding a setting to control the frequency of version checks
- Implementing a more sophisticated versioning system based on semantic versioning

