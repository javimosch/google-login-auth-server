const axios = require("axios");

function useKeycloakAPI() {
  return {
    createKeycloakClientByApp(providerId, appId) {
      let providerDetails = global.useAppDetails(providerId, 'keycloak');
      let app = global.useAppDetails(appId, 'keycloak');
      if (!app) {
        throw new Error("createKeycloakClientByApp: invalid appId: " + appId);
      }

      const clientId = providerDetails.clientId;
      const clientSecret = providerDetails.clientSecret;
      const redirectUri = providerDetails.redirectUrl;
      const tokenEndpoint = providerDetails.tokenEndpoint;
      const userInfoEndpoint = providerDetails.userinfoEndpoint;

      console.log('createKeycloakClientByApp', {
        providerId,
        clientId,
        redirectUri,
        tokenEndpoint,
        userInfoEndpoint
      });

      const redirectUriComputed = new URL(redirectUri);
      const fullRedirectUri = redirectUriComputed.toString() + '/' + appId;

      return {
        async getKeycloakDetailsGivenCode(code) {
          console.log('Keycloak getDetailsGivenCode - Starting with code:', code.substring(0, 10) + '...');

          const tokenReqPayload = {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: fullRedirectUri,
          };

          console.log('Token Request Parameters:', {
            ...tokenReqPayload,
            client_secret: '***',
            endpoint: tokenEndpoint
          });

          try {
            console.log('Requesting token from Keycloak...');
            const tokenResponse = await axios.post(
              tokenEndpoint,
              new URLSearchParams(tokenReqPayload),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              }
            );

            console.log('Token Response Status:', tokenResponse.status);
            console.log('Token Response Headers:', tokenResponse.headers);
            console.log('Access Token Received:', tokenResponse.data.access_token ? 'Yes' : 'No');
            console.log('Full Token Response:', {
              ...tokenResponse.data,
              access_token: tokenResponse.data.access_token ? '[PRESENT]' : '[MISSING]',
              refresh_token: tokenResponse.data.refresh_token ? '[PRESENT]' : '[MISSING]'
            });

            const accessToken = tokenResponse.data.access_token;
            if (!accessToken) {
              throw new Error('No access token received from Keycloak');
            }

            // Use the access token to get user info
            console.log('Requesting user info with access token...');
            console.log('User Info Request Headers:', {
              'Authorization': `Bearer ${accessToken}`,
              'Endpoint': userInfoEndpoint
            });

            const userResponse = await axios.get(userInfoEndpoint, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });

            console.log('User Info Response Status:', userResponse.status);
            console.log('User Info Response Headers:', userResponse.headers);
            console.log('User Info Data:', {
              ...userResponse.data,
              sub: userResponse.data.sub || '[MISSING]',
              email: userResponse.data.email || '[MISSING]'
            });

            return {
              email: userResponse.data.email,
              name: userResponse.data.name,
              picture: userResponse.data.picture,
              sub: userResponse.data.sub
            };
          } catch (error) {
            console.error('Keycloak API Error:', {
              phase: error.config?.url.includes('token') ? 'Token Request' : 'User Info Request',
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              headers: error.response?.headers,
              message: error.message,
              requestHeaders: error.config?.headers
            });
            throw error;
          }
        },
      };
    },
  };
}

module.exports = {
  useKeycloakAPI,
};