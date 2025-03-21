# Environment Variables Documentation

This document lists all environment variables used by the application, showing both their .env format and how they are accessed in the code.

## Core Configuration

| Code Usage (camelCase) | Environment Variable |
|----------------------|---------------------|
| `port` | `PORT` |
| `mongoUri` | `MONGO_URI` |
| `dbName` | `DB_NAME` |

## Application Registry
| Code Usage (camelCase) | Environment Variable |
|----------------------|---------------------|
| N/A (config only) | `APP_NAMES` |

## Identity Provider (IDP) Configuration

For each IDP (GOOGLE, KEYCLOAK, GITLAB), the following pattern applies:

| Code Usage (camelCase) | Environment Variable |
|----------------------|---------------------|
| `openidProvider` | `{IDP}__OPENID_PROVIDER` |
| `clientId` | `{IDP}__CLIENT_ID` |
| `clientSecret` | `{IDP}__CLIENT_SECRET` |
| `redirectUrl` | `{IDP}__REDIRECT_URL` |
| `scope` | `{IDP}__SCOPE` |
| `authUrl` | `{IDP}__AUTH_URL` |

Additional Keycloak-specific fields:
| Code Usage (camelCase) | Environment Variable |
|----------------------|---------------------|
| `tokenEndpoint` | `KEYCLOAK__TOKEN_ENDPOINT` |
| `userinfoEndpoint` | `KEYCLOAK__USERINFO_ENDPOINT` |

## Sign-in Application Configuration

For each application (KEYCLOAK_APP, GEOREDV3LOCAL, GEOREDV3, STYX), the following pattern applies:

| Code Usage (camelCase) | Environment Variable |
|----------------------|---------------------|
| `externalAppUrl` | `{APP}__EXTERNAL_APP_URL` |
| `externalAppApiKey` | `{APP}__EXTERNAL_APP_API_KEY` |
| `externalAppLinkFields` | `{APP}__EXTERNAL_APP_LINK_FIELDS` |
| `externalAppApiUrl` | `{APP}__EXTERNAL_APP_API_URL` |
| `externalApiGetExternalIdRoute` | `{APP}__EXTERNAL_API_GET_EXTERNAL_ID_ROUTE` |
| `externalApiGetJwtRoute` | `{APP}__EXTERNAL_API_GET_JWT_ROUTE` |

## Authentication Configuration

For each application, the following optional authentication flags are available:

| Code Usage (camelCase) | Environment Variable | Default | Description |
|----------------------|---------------------|---------|-------------|
| `useXApiKey` | `{APP}__USE_X_API_KEY` | `false` | If 'true', uses X-API-KEY header instead of Bearer token |
| `usePostForToken` | `{APP}__USE_POST_FOR_TOKEN` | `false` | If 'true', uses POST method instead of GET for token retrieval |
| `getJwtTokenField` | `{APP}__GET_JWT_TOKEN_FIELD` | `token` | Specifies the field name to extract the JWT token from the response |

## Example Usage

In JavaScript code:
```javascript
const app = global.useAppDetails('KEYCLOAK_APP');

// Access configuration
const apiUrl = app.externalAppApiUrl;
const apiKey = app.externalAppApiKey;
```

In .env file:
```bash
# IDP Example (Google)
GOOGLE__OPENID_PROVIDER=1
GOOGLE__CLIENT_ID=your-client-id
GOOGLE__REDIRECT_URL=http://localhost:3000/auth/callback/google

# Sign-in App Example
KEYCLOAK_APP__EXTERNAL_APP_API_URL=http://localhost:3000
KEYCLOAK_APP__EXTERNAL_APP_API_KEY=your-api-key
```
