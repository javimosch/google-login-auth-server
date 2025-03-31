const { OAuth2Client } = require("google-auth-library");

function useGoogleAPI() {
  return {
    createGoogleClientByApp(providerId, appId, config = null) {
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

          try {
            console.log('Exchanging code for tokens');
            const { tokens } = await client.getToken(code);
            console.log('Tokens received', { 
              accessToken: tokens.access_token ? 'Present' : 'Missing',
              idToken: tokens.id_token ? 'Present' : 'Missing',
              refreshToken: tokens.refresh_token ? 'Present' : 'Missing',
              expiryDate: tokens.expiry_date
            });

            console.log('Setting credentials on OAuth2Client');
            client.setCredentials(tokens);

            console.log('Verifying ID token');
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

            return payload;
          } catch (error) {
            console.error('Error in getGoogleDetailsGivenCode:', error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });
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