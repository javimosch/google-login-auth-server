const axios = require("axios");

function useGitLabAPI() {
  return {
    createGitLabClientByApp(providerId, appId, config = null) {
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
          try {
            console.log('Requesting token from GitLab...',{
              payload
            });
            tokenResponse = await axios.post('https://gitlab.com/oauth/token', params.toString(), {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            });
            console.log('Token Response Headers:', tokenResponse.headers);
            console.log('Token Response Status:', tokenResponse.status);
            console.log('Access Token Received:', tokenResponse.data.access_token ? 'Yes' : 'No');
            console.log('Full Token Response:', tokenResponse.data);
          } catch (error) {
            console.error('Token Request Error:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              headers: error.response?.headers,
              message: error.message
            });
            throw error;
          }

          const accessToken = tokenResponse.data.access_token;
          console.log('Access Token to be used:', accessToken);

          // Use access token to get user details
          let userResponse;
          try {
            console.log('Requesting user details with token...');
            userResponse = await axios.get('https://gitlab.com/api/v4/user', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            console.log('User Response Headers:', userResponse.headers);
            console.log('User Response Status:', userResponse.status);
            console.log('User Data Received:', !!userResponse.data);
          } catch (error) {
            console.error('User Details Request Error:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              headers: error.response?.headers,
              message: error.message
            });
            throw error;
          }

          const userData = userResponse.data;
          return {
            email: userData.email,
            name: userData.name,
            picture: userData.avatar_url,
            sub: userData.id.toString()
          };
        },
      };
    },
  };
}

module.exports = {
  useGitLabAPI,
};