const axios = require("axios");

function useKeycloakAPI() {
  return {
    createKeycloakClientByApp(providerId, appId) {
      let providerDetails = global.applications.find((a) => a.appId === providerId);
      let app = global.applications.find((a) => a.appId === appId);
      if (!app) {
        throw new Error("createKeycloakClientByApp: invalid appId: " + appId);
      }

      const clientId = providerDetails.client_id;
      const clientSecret = providerDetails.client_secret;
      const redirectUri = providerDetails.redirect_url;
      const tokenEndpoint = providerDetails.token_endpoint;
      const userInfoEndpoint = providerDetails.userinfo_endpoint;

      console.log('createKeycloakClientByApp', {
        providerId,
        clientId,
        redirectUri
      });

      const redirectUriComputed = new URL(redirectUri);

      return {
        async getKeycloakDetailsGivenCode(code) {
          const tokenReqPayload = {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUriComputed.toString() + '/' + appId,
          };

          console.log('getKeycloakDetailsGivenCode', {
            tokenReqPayload
          });

          try {
            // Exchange code for tokens
            const { data: tokenData } = await axios.post(
              tokenEndpoint,
              new URLSearchParams(tokenReqPayload),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              }
            );

            // Use the access token to get user info
            const { data: userData } = await axios.get(userInfoEndpoint, {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
              }
            });

            console.log('getKeycloakDetailsGivenCode', {
              userData
            });

            return userData;
          } catch (error) {
            console.error('Error in Keycloak authentication:', error);
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