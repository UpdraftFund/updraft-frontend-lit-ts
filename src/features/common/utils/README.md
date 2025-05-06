# Environment Configuration

This directory contains configuration files for environment-specific settings.

## API Keys and Sensitive Information

Sensitive information like API keys are stored in `env.ts`, which is excluded from git via `.gitignore`.

### Setup Instructions

1. Copy `env.template.ts` to `env.ts`
2. Replace the placeholder values in `env.ts` with your actual API keys and configuration

```bash
cp env.template.ts env.ts
# Then edit env.ts with your actual values
```

### Available Environment Variables

- `GRAPH_API_KEY`: API key for The Graph API
