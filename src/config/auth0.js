const axios = require("axios");
const crypto = require('crypto');

function useAuth0API() {
  return {
    createAuth0ClientByApp(providerId, appId, config = null) {
      let app = global.useAppDetails(appId, 'auth0');
      if (!app) {
        throw new Error("createAuth0ClientByApp: invalid appId: " + appId);
      }

      let clientId = '';
      let clientSecret = '';
      let tokenEndpoint = '';
      let userInfoEndpoint = '';
      let audience = '';
      if (config === null) {
        let providerDetails = global.useAppDetails(providerId, 'auth0');
        console.log("createAuth0ClientByApp", {
          providerDetails,
          app,
        });

        clientId = providerDetails.clientId;
        clientSecret = providerDetails.clientSecret;
        tokenEndpoint = providerDetails.tokenEndpoint;
        userInfoEndpoint = providerDetails.userinfoEndpoint;
        audience = providerDetails.audience;
      } else {
        clientId = config.clientId;
        clientSecret = config.clientSecret;
        tokenEndpoint = config.tokenURL;
        userInfoEndpoint = config.userInfoURL;
        audience = config.audience;
      }

      const redirectUriComputed = new URL(process.env.CONFIG_CALLBACK_URL + '/auth0');
      redirectUriComputed.searchParams.append("appId", appId);
      const redirectUri = redirectUriComputed.toString();

      function base64URLEncode(str) {
        return str.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
      }
      var verifier = base64URLEncode(crypto.randomBytes(32));

      return {
        async getDetailsGivenCode(code) {
          console.log('Auth0 getDetailsGivenCode - Starting with code:', code.substring(0, 10) + '...');
          
          const params = {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code_verifier: verifier,
            code: code,
            grant_type: "authorization_code",
          };

          console.log('Token Request Parameters:', {
            ...params,
            client_id: clientId,
            client_secret: '***'
          });

          try {
            console.log('Requesting token from Auth0...');
            const tokenResponse = await axios.post(
              tokenEndpoint,
              new URLSearchParams(params),
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
              id_token: tokenResponse.data.id_token ? '[PRESENT]' : '[MISSING]'
            });

            // Get user info using the access token
            console.log('Requesting user info with access token...');
            const userInfoResponse = await axios.get(userInfoEndpoint, {
              headers: {
                'Authorization': `Bearer ${tokenResponse.data.access_token}`
              }
            });

            console.log('User Info Response Status:', userInfoResponse.status);
            console.log('User Info Response Headers:', userInfoResponse.headers);
            console.log('User Info Data:', {
              ...userInfoResponse.data,
              sub: userInfoResponse.data.sub || '[MISSING]',
              email: userInfoResponse.data.email || '[MISSING]'
            });

            return userInfoResponse.data;
          } catch (error) {
            console.error('Auth0 API Error:', {
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
  useAuth0API,
};