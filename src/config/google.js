const { OAuth2Client } = require("google-auth-library");
const {omitKeysInObject} = require("../utils/utils");

function useGoogleAPI() {
  return {
    createGoogleClientByApp(providerId, appId, config = null, attemptId = '') {
      console.log('Starting createGoogleClientByApp', { providerId, appId });

      let providerDetails = global.useAppDetails(providerId, 'google');
      let app = global.useAppDetails(appId, 'google');
      
      if (!app) {
        console.error('Invalid appId', { appId });
        throw new Error("createGoogleClientByApp: invalid appId: " + appId);
      }

      console.log({
        app,
        providerDetails
      })

      const clientId = providerDetails.clientId;
      const clientSecret = providerDetails.clientSecret;
      const redirectUri = process.env.CONFIG_CALLBACK_URL + '/google';

      console.log('Google OAuth configuration', {
        providerId,
        clientId,
        redirectUri,
        appId
      });

      const redirectUriComputed = new URL(redirectUri);
      let fullRedirectUri = redirectUriComputed.toString() + '/' + appId;
      console.log('Computed redirect URI', { fullRedirectUri });

      const client = new OAuth2Client(clientId, clientSecret, fullRedirectUri);
      console.log('OAuth2Client created');

      return {
        async getGoogleDetailsGivenCode(code) {
          console.log('Starting getGoogleDetailsGivenCode', { code: code.substring(0, 10) + '...' }); // Log only part of the code for security
          let ssoLogData = {message: 'Get token from Google', provider: providerId, app: appId, attemptId: attemptId};
          if (config !== null) {
            ssoLogData.configId = config._id
            ssoLogData.clientName = config.clientName
          }
          await saveSsoLog(ssoLogData);

          try {
            console.log('Exchanging code for tokens');
            const { tokens } = await client.getToken(code);
            console.log('Tokens received', { 
              accessToken: tokens.access_token ? 'Present' : 'Missing',
              idToken: tokens.id_token ? 'Present' : 'Missing',
              refreshToken: tokens.refresh_token ? 'Present' : 'Missing',
              expiryDate: tokens.expiry_date
            });
            ssoLogData.message = 'Token response';
            ssoLogData.data = {
              reponseData: omitKeysInObject(tokens, ['access_token', 'id_token', 'refresh_token']),
              accessTokenReceived: tokens.access_token ? 'Yes' : 'No',
              idTokenReceived: tokens.id_token ? 'Yes' : 'No',
              refreshTokenReceived: tokens.refresh_token ? 'Yes' : 'No'
            };
            await saveSsoLog(ssoLogData);

            console.log('Setting credentials on OAuth2Client');
            client.setCredentials(tokens);

            console.log('Verifying ID token');
            ssoLogData.message = 'Get user info from Google with token';
            ssoLogData.data = {};
            await saveSsoLog(ssoLogData);
            const ticket = await client.verifyIdToken({
              idToken: tokens.id_token,
              audience: clientId,
            });

            let payload = ticket.getPayload();
            console.log('ID token verified, payload received', {
              sub: payload.sub,
              email: payload.email,
              name: payload.name,
              picture: payload.picture
            });
            ssoLogData.message = 'Response user info';
            ssoLogData.data = payload;
            await saveSsoLog(ssoLogData);

            return payload;
          } catch (error) {
            console.error('Error in getGoogleDetailsGivenCode:', error);
            const logErrorData = {
              name: error.name,
              message: error.message,
              stack: error.stack
            };
            console.error('Error details:', logErrorData);
            ssoLogData.message = 'An error occured when attempting to retrieve the token or user info from Google : ' + error.message;
            ssoLogData.error = true;
            ssoLogData.data = omitKeysInObject(logErrorData, ['message']);
            await saveSsoLog(ssoLogData);
            throw error;
          }
        },
      };
    },
  };
}

module.exports = {
  useGoogleAPI,
};