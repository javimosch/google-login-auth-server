const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

function useGoogleAPI() {
  return {
    createGoogleClientByApp(providerId,appId) {
      let providerDetails = global.applications.find((a) => a.appId === providerId);
      let app = global.applications.find((a) => a.appId === appId);
      if (!app) {
        //@todo Redirect to view that says auth with app x not configured correctly
        throw new Error("createGoogleClientByApp: invalid appId: " + appId);
      }

      const clientId = providerDetails.client_id;
      const clientSecret = providerDetails.client_secret;
      const redirectUri = providerDetails.redirect_url;

      console.log('createGoogleClientByApp',{
        providerId,
        clientId,
        redirectUri
      })

      const redirectUriComputed = new URL(redirectUri);
      //redirectUriComputed.searchParams.append("appId", appId);
      const client = new OAuth2Client(clientId);

      return {
        async getGoogleDetailsGivenCode(code) {
          const tokenReqPayload= {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUriComputed.toString()+'/'+appId,
          }
          console.log('getGoogleDetailsGivenCode',{
            tokenReqPayload
          })
          const { data } = await axios.post(
            "https://oauth2.googleapis.com/token",
            tokenReqPayload
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
