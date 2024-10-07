const axios = require("axios");

function useGitLabAPI() {
  return {
    createGitLabClientByApp(providerId,appId) {
      let providerDetails = global.applications.find((a) => a.appId === providerId);
      let app = global.applications.find((a) => a.appId === appId);
      if (!app) {
        throw new Error("createGitLabClientByApp: invalid appId: " + appId);
      }


      console.log('createGitLabClientByApp',{
        providerDetails,
        app
      })

      const clientId = providerDetails.client_id;
      const clientSecret = providerDetails.client_secret;
      
     
      const redirectUriComputed = new URL(providerDetails.redirect_url);
      redirectUriComputed.searchParams.append("appId", appId);
      const redirectUri = redirectUriComputed.toString()

      return {
        async getGitLabDetailsGivenCode(code) {


          console.log('createGitLabClientByApp',{
            clientId,
            clientSecret,
            redirectUri,
            code,
            url: redirectUriComputed.toString()
          })


          const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUriComputed.toString()
          });
          
          let tokenResponse
          try {
            tokenResponse = await axios.post('https://gitlab.com/oauth/token', params.toString(), {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            });
            console.log(tokenResponse);
          } catch (error) {
            if (error.response) {
              console.error('Error response:', error.response.status, error.response.statusText);
              console.error('Error response data:', error.response.data);
              console.error('Error response headers:', error.response.headers);
            } else if (error.request) {
              console.error('Error request:', error.request);
            } else {
              console.error('Error message:', error.message);
            }
            console.error('Error config:', error.config);
            throw error
          }
          
          

          console.log('tokenResponse',{
            data:tokenResponse.data
          })
          const accessToken = tokenResponse.data.access_token;

          // Use access token to get user details
          let userResponse
          try {
            userResponse = await axios.get('https://gitlab.com/api/v4/user', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            console.log(userResponse.data);
          } catch (error) {
            if (error.response) {
              console.log('Error Response:', error.response.data);
              console.log('Error Status:', error.response.status);
              console.log('Error Headers:', error.response.headers);
            } else if (error.request) {
              console.log('Error Request:', error.request);
            } else {
              console.log('Error Message:', error.message);
            }
            throw error
          }
          

          const userData = userResponse.data;

          console.log('getGitLabDetailsGivenCode', {
            userData
          });

          // Transform GitLab user data to match the structure of Google payload
          return {
            sub: userData.id.toString(),
            name: userData.name,
            given_name: userData.name.split(' ')[0],
            family_name: userData.name.split(' ').slice(1).join(' '),
            picture: userData.avatar_url,
            email: userData.email,
            email_verified: userData.confirmed_at !== null
          };
        },
      };
    },
  };
}

module.exports = {
  useGitLabAPI,
};