# Overview of Providers

Providers are external identity providers (IdPs) that facilitate authentication for users. They allow users to log in to applications using their existing accounts from services like Google and GitLab. This integration simplifies the authentication process and enhances user experience by reducing the need for multiple credentials.


# Supported Providers

## Google
- **OpenID Provider**: Yes
- **Client ID**: Configurable in `apps.yml` and `.env`
- **Client Secret**: Configurable in `apps.yml` and `.env`
- **Redirect URL**: `http://localhost:3000/auth/callback/google`
- **Scope**: `profile email`
- **Auth URL**: `https://accounts.google.com/o/oauth2/v2/auth`

## GitLab
- **OpenID Provider**: Yes
- **Client ID**: Configurable in `apps.yml` and `.env`
- **Client Secret**: Configurable in `apps.yml` and `.env`
- **Redirect URL**: `http://localhost:3000/auth/callback/gitlab`
- **Scope**: `openid profile email api read_api`
- **Auth URL**: `https://gitlab.com/oauth/authorize`

# Adding new providers

## Retrieve idp account details

### Adding a composable to interact with the idp API

Example for gitlab

```js
const axios = require("axios");

function useGitLabAPI() {
  return {
    createGitLabClientByApp(providerId,appId) {
      let providerDetails = global.applications.find((a) => a.appId === providerId);
      let app = global.applications.find((a) => a.appId === appId);
      if (!app) {
        throw new Error("createGitLabClientByApp: invalid appId: " + appId);
      }


      console.log('createGitLabClientByApp',{ providerDetails, app })

      const clientId = providerDetails.client_id;
      const clientSecret = providerDetails.client_secret;
      
     
      const redirectUriComputed = new URL(providerDetails.redirect_url);
      redirectUriComputed.searchParams.append("appId", appId);
      const redirectUri = redirectUriComputed.toString()

      return {
        async getGitLabDetailsGivenCode(code) {

          console.log('createGitLabClientByApp',{ clientId, clientSecret, redirectUri, code, url: redirectUriComputed.toString() })

          const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUriComputed.toString()
          });
          
          let tokenResponse
          try {
            tokenResponse = await axios.post('https://gitlab.com/oauth/token', params.toString(), {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            });
            console.log(tokenResponse);
          } catch (error) {
            if (error.response) {
              console.error('Error response:', error.response.status, error.response.statusText);
              console.error('Error response data:', error.response.data);
              console.error('Error response headers:', error.response.headers);
            } else if (error.request) {
              console.error('Error request:', error.request);
            } else {
              console.error('Error message:', error.message);
            }
            console.error('Error config:', error.config);
            throw error
          }
          
          
          console.log('tokenResponse',{ data:tokenResponse.data })
          const accessToken = tokenResponse.data.access_token;

          // Use access token to get user details
          let userResponse
          try {
            userResponse = await axios.get('https://gitlab.com/api/v4/user', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            console.log(userResponse.data);
          } catch (error) {
            if (error.response) {
              console.log('Error Response:', error.response.data);
              console.log('Error Status:', error.response.status);
              console.log('Error Headers:', error.response.headers);
            } else if (error.request) {
              console.log('Error Request:', error.request);
            } else {
              console.log('Error Message:', error.message);
            }
            throw error
          }
           
          const userData = userResponse.data;

          console.log('getGitLabDetailsGivenCode', { userData });

          // Transform GitLab user data to match the structure of Google payload
          return {
            sub: userData.id.toString(),
            name: userData.name,
            given_name: userData.name.split(' ')[0],
            family_name: userData.name.split(' ').slice(1).join(' '),
            picture: userData.avatar_url,
            email: userData.email,
            email_verified: userData.confirmed_at !== null
          };
        },
      };
    },
  };
}

module.exports = {
  useGitLabAPI,
};
```

### Updating the route logic

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