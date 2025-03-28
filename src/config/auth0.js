const axios = require("axios");
const crypto = require('crypto');

function useAuth0API() {
  return {
    createAuth0ClientByApp(providerId, appId) {
      let providerDetails = global.useAppDetails(providerId, 'auth0');
      let app = global.useAppDetails(appId, 'auth0');
      if (!app) {
        throw new Error("createAuth0ClientByApp: invalid appId: " + appId);
      }

      console.log("createAuth0ClientByApp", {
        providerDetails,
        app,
      });

      const clientId = providerDetails.clientId;
      const clientSecret = providerDetails.clientSecret;
      const audience = providerDetails.audience;

      const redirectUriComputed = new URL(providerDetails.redirectUrl);
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
              "https://misitioba.eu.auth0.com/oauth/token",
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
            const userInfoResponse = await axios.get('https://misitioba.eu.auth0.com/userinfo', {
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
        grantType: "client_credentials",
        clientId: clientId,
        clientSecret: clientSecret,
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
