const axios = require("axios");
const {omitKeysInObject} = require("../utils/utils");

function useGitLabAPI() {
  return {
    createGitLabClientByApp(providerId, appId, config = null, attemptId = '') {
      let providerDetails = global.useAppDetails(providerId, 'gitlab');
      let app = global.useAppDetails(appId, 'gitlab');
      if (!app) {
        throw new Error("createGitLabClientByApp: invalid appId: " + appId);
      }

      console.log('createGitLabClientByApp',{
        providerId,
        appId,
        providerDetails,
        app
      })

      const clientId = providerDetails.clientId;
      const clientSecret = providerDetails.clientSecret;
      
      const redirectUriComputed = new URL(process.env.CONFIG_CALLBACK_URL + '/gitlab' + '/' + appId);
      const redirectUri = redirectUriComputed.toString()

      return {
        async getGitLabDetailsGivenCode(code) {
          console.log('getGitLabDetailsGivenCode - Starting with code:', code.substring(0, 10) + '...');

          let payload = {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          }

          const params = new URLSearchParams(payload);

          let tokenResponse;

          let ssoLogData = {message: 'Get token from Gitlab', provider: providerId, app: appId, attemptId: attemptId};
          if (config !== null) {
            ssoLogData.configId = config._id
            ssoLogData.clientName = config.clientName
          }
          await saveSsoLog(ssoLogData);
          try {
            tokenResponse = await axios.post('https://gitlab.com/oauth/token', params.toString(), {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            });
            console.log('Token Response Headers:', tokenResponse.headers);
            console.log('Token Response Status:', tokenResponse.status);
            console.log('Access Token Received:', tokenResponse.data.access_token ? 'Yes' : 'No');
            ssoLogData.message = 'Token response';
            ssoLogData.data = {
              responseData: omitKeysInObject(tokenResponse.data, ['access_token']),
              status: tokenResponse.status,
              headers: tokenResponse.headers,
              accessTokenReceived: tokenResponse.data.access_token ? 'Yes' : 'No',
            };
            await saveSsoLog(ssoLogData);

            const accessToken = tokenResponse.data.access_token;

            // Use access token to get user details
            let userResponse;
            console.log('Requesting user details with token...');
            ssoLogData.message = 'Get user info from Gitlab with token';
            ssoLogData.data = {};
            await saveSsoLog(ssoLogData);
            userResponse = await axios.get('https://gitlab.com/api/v4/user', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            console.log('User Response Headers:', userResponse.headers);
            console.log('User Response Status:', userResponse.status);
            console.log('User Data Received:', !!userResponse.data);
            ssoLogData.message = 'Response user info';
            ssoLogData.data = {
              responseData: userResponse.data,
              status: userResponse.status,
              headers: userResponse.headers
            };
            await saveSsoLog(ssoLogData);

            const userData = userResponse.data;
            return {
              email: userData.email,
              name: userData.name,
              picture: userData.avatar_url,
              sub: userData.id.toString()
            };
          } catch (error) {
            const logErrorData = {
              phase: error.config?.url.includes('token') ? 'Token Request' : 'User Info Request',
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              headers: error.response?.headers,
              message: error.message
            };
            console.error('Gitlab API Error:', logErrorData);
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
  useGitLabAPI,
};