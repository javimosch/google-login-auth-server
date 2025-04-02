const axios = require("axios");
const {omitKeysInObject} = require("../utils/utils");

function useKeycloakAPI() {
  return {
    createKeycloakClientByApp(providerId, appId, config = null, attemptId = '') {
      let clientId = '';
      let clientSecret = '';
      let redirectUri = '';
      let tokenEndpoint = '';
      let userInfoEndpoint = '';

      if (config === null) {
        let providerDetails = global.useAppDetails(providerId, 'keycloak');

        clientId = providerDetails.clientId;
        clientSecret = providerDetails.clientSecret;
        redirectUri = providerDetails.redirectUrl;
        tokenEndpoint = providerDetails.tokenEndpoint;
        userInfoEndpoint = providerDetails.userinfoEndpoint;
      } else {
        clientId = config.clientId;
        clientSecret = config.clientSecret;
        redirectUri = process.env.CONFIG_CALLBACK_URL + '/keycloak';
        tokenEndpoint = config.tokenURL;
        userInfoEndpoint = config.userInfoURL;
      }

      let app = global.useAppDetails(appId, 'keycloak');
      if (!app) {
        throw new Error("createKeycloakClientByApp: invalid appId: " + appId);
      }

      console.log('createKeycloakClientByApp', {
        providerId,
        clientId,
        redirectUri,
        tokenEndpoint,
        userInfoEndpoint
      });

      const redirectUriComputed = new URL(redirectUri);
      let fullRedirectUri = redirectUriComputed.toString() + '/' + appId;
      if (config !== null) {
        fullRedirectUri += '/' + config._id;
      }

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
            endpoint: tokenEndpoint
          });
          let ssoLogData = {message: `Get token using URL ${tokenEndpoint}`, provider: providerId, app: appId, attemptId: attemptId};
          if (config !== null) {
            ssoLogData.configId = config._id
            ssoLogData.clientName = config.clientName
          }
          await saveSsoLog(ssoLogData);

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
            console.log('Refresh Token Received:', tokenResponse.data.refresh_token ? 'Yes' : 'No');
            ssoLogData.message = 'Token response';
            ssoLogData.data = {
              responseData: omitKeysInObject(tokenResponse.data, ['access_token', 'refresh_token']),
              status: tokenResponse.status,
              headers: tokenResponse.headers,
              accessTokenReceived: tokenResponse.data.access_token ? 'Yes' : 'No',
              refreshTokenReceived: tokenResponse.data.refresh_token ? 'Yes' : 'No',
            };
            await saveSsoLog(ssoLogData);

            const accessToken = tokenResponse.data.access_token;
            if (!accessToken) {
              throw new Error('No access token received from Keycloak');
            }

            // Use the access token to get user info
            console.log('Requesting user info with access token...');
            ssoLogData.message = `Get user info using URL ${userInfoEndpoint}`;
            ssoLogData.data = {};
            await saveSsoLog(ssoLogData);
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

            ssoLogData.message = 'Response user info';
            ssoLogData.data = {
              responseData: userResponse.data,
              status: userResponse.status,
              headers: userResponse.headers,
            };
            await saveSsoLog(ssoLogData);
            return {
              email: userResponse.data.email,
              name: userResponse.data.name,
              picture: userResponse.data.picture,
              sub: userResponse.data.sub
            };
          } catch (error) {
            const logErrorData = {
              phase: error.config?.url.includes('token') ? 'Token Request' : 'User Info Request',
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              headers: error.response?.headers,
              message: error.message,
              requestHeaders: error.config?.headers
            }
            console.error('Keycloak API Error:', logErrorData);
            ssoLogData.message = 'An error occured when attempting to retrieve the token or user info : ' + error.message;
            ssoLogData.data = omitKeysInObject(logErrorData, ['message']);
            ssoLogData.error = true;
            await saveSsoLog(ssoLogData);
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