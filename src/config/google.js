const { OAuth2Client } = require("google-auth-library");

function useGoogleAPI() {
  return {
    createGoogleClientByApp(providerId, appId) {
      console.log('Starting createGoogleClientByApp', { providerId, appId });

      let providerDetails = global.applications.find((a) => a.appId === providerId);
      let app = global.applications.find((a) => a.appId === appId);
      
      if (!app) {
        console.error('Invalid appId', { appId });
        throw new Error("createGoogleClientByApp: invalid appId: " + appId);
      }

      const clientId = providerDetails.client_id;
      const clientSecret = providerDetails.client_secret;
      const redirectUri = providerDetails.redirect_url;

      console.log('Google OAuth configuration', {
        providerId,
        clientId,
        redirectUri,
        appId
      });

      const redirectUriComputed = new URL(redirectUri);
      const fullRedirectUri = redirectUriComputed.toString() + '/' + appId;
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
              access_token: tokens.access_token ? 'Present' : 'Missing',
              id_token: tokens.id_token ? 'Present' : 'Missing',
              refresh_token: tokens.refresh_token ? 'Present' : 'Missing',
              expiry_date: tokens.expiry_date
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