# Overview of Providers

Providers are external identity providers (IdPs) that facilitate authentication for users. They allow users to log in to applications using their existing accounts from services like Google and GitLab. This integration simplifies the authentication process and enhances user experience by reducing the need for multiple credentials.

# Configuration

Providers are configured through environment variables using a standardized format:

```sh
APP_NAMES=google,gitlab,keycloak,auth0
GOOGLE__CLIENT_ID=your_client_id
GOOGLE__CLIENT_SECRET=your_client_secret
GOOGLE__REDIRECT_URL=http://localhost:3000/auth/callback/google
GOOGLE__AUTH_URL=https://accounts.google.com/o/oauth2/v2/auth
GOOGLE__OPENID_PROVIDER=true
```

# Supported Providers

## Google
- **OpenID Provider**: Yes
- **Environment Variables**:
  - `GOOGLE__CLIENT_ID`
  - `GOOGLE__CLIENT_SECRET`
  - `GOOGLE__REDIRECT_URL`
  - `GOOGLE__AUTH_URL`
  - `GOOGLE__OPENID_PROVIDER`
- **Default Scope**: `profile email`

## GitLab
- **OpenID Provider**: Yes
- **Environment Variables**:
  - `GITLAB__CLIENT_ID`
  - `GITLAB__CLIENT_SECRET`
  - `GITLAB__REDIRECT_URL`
  - `GITLAB__AUTH_URL`
  - `GITLAB__OPENID_PROVIDER`
- **Default Scope**: `openid profile email api read_api`

## Auth0
- **OpenID Provider**: Yes
- **Environment Variables**:
  - `AUTH0__CLIENT_ID`
  - `AUTH0__CLIENT_SECRET`
  - `AUTH0__REDIRECT_URL`
  - `AUTH0__AUTH_URL`
  - `AUTH0__OPENID_PROVIDER`
- **Default Scope**: `openid profile email`

## Keycloak
- **OpenID Provider**: Yes
- **Environment Variables**:
  - `KEYCLOAK__CLIENT_ID`
  - `KEYCLOAK__CLIENT_SECRET`
  - `KEYCLOAK__REDIRECT_URL`
  - `KEYCLOAK__AUTH_URL`
  - `KEYCLOAK__OPENID_PROVIDER`
- **Default Scope**: `openid profile email`

# Adding New Providers

To add a new provider:

1. Create a new configuration file in `src/config/` (e.g., `newprovider.js`)
2. Implement the provider API client following this template:

```js
function useNewProviderAPI() {
  return {
    createNewProviderClientByApp(providerId, appId) {
      let providerDetails = global.useAppDetails(providerId, 'newprovider');
      let app = global.useAppDetails(appId, 'newprovider');
      if (!app) {
        throw new Error("createNewProviderClientByApp: invalid appId: " + appId);
      }

      const clientId = providerDetails.clientId;
      const clientSecret = providerDetails.clientSecret;
      const redirectUri = providerDetails.redirectUrl;

      return {
        async getProviderDetailsGivenCode(code) {
          // Implement token exchange and user info retrieval
        }
      };
    }
  };
}

module.exports = { useNewProviderAPI };
```

3. Add the provider to your environment variables:
```sh
APP_NAMES=google,gitlab,keycloak,auth0,newprovider
NEWPROVIDER__CLIENT_ID=your_client_id
NEWPROVIDER__CLIENT_SECRET=your_client_secret
NEWPROVIDER__REDIRECT_URL=http://localhost:3000/auth/callback/newprovider
NEWPROVIDER__AUTH_URL=https://newprovider.com/oauth/authorize
NEWPROVIDER__OPENID_PROVIDER=true
```

4. Import and use the provider in `src/routes/auth.js`

```js
if (providerId === 'google') {
      const { createGoogleClientByApp } = useGoogleAPI();
      const { getGoogleDetailsGivenCode } = createGoogleClientByApp(providerId,appId);
      payload = await getGoogleDetailsGivenCode(code);
      idpEmail = payload.email;
    } else if (providerId === 'gitlab') {
      const { createGitLabClientByApp } = useGitLabAPI();
      const { getGitLabDetailsGivenCode } = createGitLabClientByApp(providerId,appId);
      payload = await getGitLabDetailsGivenCode(code);
      idpEmail = payload.email;
    } else {
      throw new Error(`Unsupported provider: ${providerId}`);
    }
```

# Configuration Steps

1. **Edit `apps.yml`**: Define the providers and their respective configurations.
   ```yaml
   apps:
     google:
       openid_provider: true
       client_id: "<your_client_id>"
       client_secret: "<your_client_secret>"
       redirect_url: "http://localhost:3000/auth/callback/google"
       scope: "profile email"
       auth_url: "https://accounts.google.com/o/oauth2/v2/auth"
     gitlab:
       openid_provider: true
       client_id: "<your_client_id>"
       client_secret: "<your_client_secret>"
       redirect_url: "http://localhost:3000/auth/callback/gitlab"
       scope: "openid profile email api read_api"
       auth_url: "https://gitlab.com/oauth/authorize"
   ```

2. **Environment Variables**: Configure sensitive information in the `.env` file.
   ```bash
   GOOGLE__CLIENT_ID=<your_client_id>
   GOOGLE__CLIENT_SECRET=<your_client_secret>
   GITLAB__CLIENT_ID=<your_client_id>
   GITLAB__CLIENT_SECRET=<your_client_secret>
   ```

# Common Use Cases

- **User Authentication**: Allow users to log in using their Google or GitLab accounts.
- **Account Linking**: Link IdP accounts with existing user accounts in your application for seamless access.

# Error Handling

When interacting with providers, handle errors gracefully. Common error scenarios include:
- Invalid credentials when attempting to authenticate.
- Network issues when calling the IdP API.
- User not found when attempting to link accounts.

Ensure to log errors and provide meaningful feedback to users.