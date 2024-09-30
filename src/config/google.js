const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

function useGoogleAPI() {
  return {
    createGoogleClientByApp(appId) {
      let app = global.applications.find((a) => a.appId === appId);
      if (!app) {
        //@todo Redirect to view that says auth with app x not configured correctly
        throw new Error("createGoogleClientByApp: invalid appId: " + appId);
      }

      const clientId = app.GOOGLE_CLIENT_ID;
      const clientSecret = app.GOOGLE_CLIENT_SECRET;
      const redirectUri = app.GOOGLE_REDIRECT_URI;
      const redirectUriComputed = new URL(redirectUri);
      redirectUriComputed.searchParams.append("appId", appId);
      const client = new OAuth2Client(clientId);

      return {
        async getGoogleDetailsGivenCode(code) {
          const { data } = await axios.post(
            "https://oauth2.googleapis.com/token",
            {
              client_id: clientId,
              client_secret: clientSecret,
              code,
              grant_type: "authorization_code",
              redirect_uri: redirectUriComputed,
            }
          );
          const ticket = await client.verifyIdToken({
            idToken: data.id_token,
            audience: clientId,
          });
          let payload = ticket.getPayload();
          console.log('getGoogleDetailsGivenCode',{
            payload
          })
          return payload;
        },
      };
    },
  };
}

module.exports = {
  useGoogleAPI,
};
