const axios = require("axios");
const crypto = require('crypto');


function useAuth0API() {
  return {
    createAuth0ClientByApp(providerId, appId) {
      let providerDetails = global.applications.find(
        (a) => a.appId === providerId
      );
      let app = global.applications.find((a) => a.appId === appId);
      if (!app) {
        throw new Error("createAuth0ClientByApp: invalid appId: " + appId);
      }

      console.log("createAuth0ClientByApp", {
        providerDetails,
        app,
      });

      const clientId = providerDetails.client_id;
      const clientSecret = providerDetails.client_secret;
      const audience = providerDetails.audience;

      const redirectUriComputed = new URL(providerDetails.redirect_url);
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
          try {
            const response = await axios.post(
              "https://misitioba.eu.auth0.com/oauth/token",
              null,
              {
                headers: {
                  accept: "*/*",
                  "content-type": "application/x-www-form-urlencoded",
                },
                params: {
                  client_id: clientId,
                  redirect_uri: redirectUri,
                  code_verifier:verifier,// "9AaxJN9BnpBpLa6G6se9HPXf8pCD0VeeRMkB6GK97Vj", // This should be dynamic based on the application's requirements
                  code: code,
                  grant_type: "authorization_code",
                },
              }
            );
            console.log('TRACE',{
                data: response.data
            })
            return response.data; // Returns the response data which usually contains access token and other details
          } catch (error) {
            console.error("Error getting details given code", error);
            throw error; // You may want to throw a custom error or handle it accordingly based on your application's error handling strategy
          }
        },
        async getAuth0AccountDetailsGivenEmail(email) {
          console.log("createAuth0ClientByApp", {
            clientId,
            clientSecret,
            redirectUri,
            code,
            url: redirectUriComputed.toString(),
          });

          let jwt = await requestJWT(clientId, clientSecret, audience);
          let details = await getUserDetails(jwt, email);

          /**
           *   {
    "email": "arancibiajav@gmail.com",
    "email_verified": true,
    "name": "Javier Leandro Arancibia",
    "given_name": "Javier Leandro",
    "family_name": "Arancibia",
    "picture": "https://lh3.googleusercontent.com/a/ACg8ocIev7e3YziSssSrmPABxd3rpliIxe2H9h5kC4gPD3BZ3QU-UyJzyA=s96-c",
    "updated_at": "2024-10-14T14:58:26.197Z",
    "user_id": "google-oauth2|114155032860222767683",
    "nickname": "arancibiajav",
    "identities": [
      {
        "provider": "google-oauth2",
        "access_token": "ya29.a0AcM612yFIvZMlATjje-uVHma4_e6g8tZGddySR3GaQZy7SegeFZaSKzevCO_7S0u68DHxisELWraEiobTFIc3w61UgtIXS_nFuTWIwzv89ztZkFXVVFn-wTQ2YbmKyQVLTnd5YSJGh6L12u3t7vlbM4lTF61S2DylgaCgYKAUsSARASFQHGX2MiqhNBFTu-ujKZrMzPIdMX3Q0169",
        "expires_in": 3599,
        "user_id": "114155032860222767683",
        "connection": "google-oauth2",
        "isSocial": true
      }
    ],
    "created_at": "2018-02-03T11:26:23.406Z",
    "last_ip": "81.185.168.101",
    "last_login": "2024-10-14T14:58:26.196Z",
    "logins_count": 25
  }
           */
          return {
            email: details.email,
          };
        },
      };
    },
  };
}

module.exports = {
  useAuth0API,
};

async function getUserDetails(jwt, email) {
  try {
    const response = await axios.get(
      `https://misitioba.eu.auth0.com/api/v2/users-by-email?email=${encodeURIComponent(
        email
      )}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    return response.data; // Return user details
  } catch (error) {
    console.error(
      "Error retrieving user details:",
      error.response ? error.response.data : error.message
    );
    throw error; // Rethrow error for handling
  }
}

async function requestJWT(
  clientId,
  clientSecret,
  audience = "https://misitioba.eu.auth0.com/api/v2/"
) {
  try {
    const response = await axios.post(
      "https://misitioba.eu.auth0.com/oauth/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    // Print the access token
    console.log("Access Token:", response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error requesting JWT:",
      error.response ? error.response.data : error.message
    );
  }
}
