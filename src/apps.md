# Application Configuration Guide

This document describes the different ways to configure applications in the system. There are three methods available, listed in order of priority:

## 1. Legacy Environment Variables (AUTH_APPLICATIONS)

This method uses the `AUTH_APPLICATIONS` environment variable with a specific format:

```bash
export AUTH_APPLICATIONS="app1:App One Name,app2:App Two Name"
```

Format: `appId:appName,appId2:appName2,...`

## 2. Pure Environment Variables (APP_NAMES)

This method allows you to define applications entirely through environment variables:

```bash
# First, define the list of applications
export APP_NAMES="app1,app2"

# Then define properties for each application
# For APP1
export APP1__NAME="First Application"
export APP1__EXTERNAL_APP_API_URL="https://api1.example.com"
export APP1__EXTERNAL_APP_API_KEY="your-api-key-1"

# For APP2
export APP2__NAME="Second Application"
export APP2__EXTERNAL_APP_API_URL="https://api2.example.com"
export APP2__EXTERNAL_APP_API_KEY="your-api-key-2"
```

Format:
- `APP_NAMES`: Comma-separated list of application IDs
- For each app: `[APP_ID]__[PROPERTY_NAME]="value"`
  - `[APP_ID]` must be uppercase
  - Available properties:
    - `NAME`: Application display name
    - `EXTERNAL_APP_API_URL`: API endpoint URL
    - `EXTERNAL_APP_API_KEY`: API authentication key
    - Any other property needed by your application

## 3. YAML Configuration (apps.yml)

Define applications in the `src/config/apps.yml` file:

```yaml
apps:
  app1:
    name: "First Application"
    external_app_api_url: "https://api1.example.com"
    external_app_api_key: "your-api-key-1"
  
  app2:
    name: "Second Application"
    external_app_api_url: "https://api2.example.com"
    external_app_api_key: "your-api-key-2"
```

## Priority and Overrides

1. Environment variables always override YAML configuration
2. Methods are checked in this order:
   1. `AUTH_APPLICATIONS` (legacy)
   2. `APP_NAMES` (pure environment variables)
   3. `apps.yml` (YAML configuration)

The first method that returns any applications will be used. If a method returns no applications, the system will try the next method in the list.

## Environment Variable Override Format

Regardless of how applications are initially defined, you can always override specific properties using environment variables:

```bash
# Format: [APP_ID]__[PROPERTY_NAME]="value"
export APP1__EXTERNAL_APP_API_KEY="new-api-key"
```

This works for any application property, whether the application was defined through environment variables or YAML configuration.
