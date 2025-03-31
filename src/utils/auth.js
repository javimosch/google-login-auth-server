/**
 * Handles OAuth authorization flow for different providers
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Object} config Provider identifier
 */
function handleOAuthByClientConfig(req, res, config) {
  const redirectUri = process.env.CONFIG_CALLBACK_URL
  let callbackUrl = new URL(redirectUri);
  callbackUrl += "/" + config.provider;
  callbackUrl += "/" + config.applications[0];
  let clientId = ''
  let authUrl = ''
  const scope = config.scopes.join(' ')
  if (config.provider === 'keycloak' || config.provider === 'auth0') {
    clientId = config.clientId
    authUrl = config.authorizationURL
    if (config.provider === 'keycloak') {
      callbackUrl += "/" + config._id;
    }
  } else {
    let app = global.useAppDetails(
      config.provider,
      `/auth/authorize/${config.provider}`
    );
    clientId = app.clientId
    authUrl = app.authUrl
  }

  const authUrlObj = new URL(authUrl);
  let clientParamName = authUrlObj.toString().includes('auth0')?'client':'client_id'

  const url = new URL(authUrlObj.toString());
  url.searchParams.append(clientParamName, clientId);
  url.searchParams.append("redirect_uri", callbackUrl.toString());
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", scope);
  url.searchParams.append("state", config._id);

  res.redirect(url.toString());
}

/**
 * Handles OAuth authorization flow for different providers
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {string} providerId Provider identifier
 */
function handleOAuth(req, res, providerId) {
  const query = req.query;

  let app = global.useAppDetails(
    req.query.appId,
    `/auth/authorize/${providerId}`
  );

  let providerDetails = global.useAppDetails(
    providerId,
    `/auth/authorize/${providerId}`
  );

  console.log('providerDetails for', providerId, {providerDetails});

  if (!providerDetails.openidProvider) {
    throw new Error("Invalid provider");
  }
  if (app.openidProvider) {
    throw new Error("Invalid app"); // Apps (Geored/Styx) vs idp Providers (Google/Gitlab/Veolia)
  }

  const {
    redirectUrl: redirectUri,
    clientId,
    authUrl,
    scope,
  } = providerDetails;

  console.log(`/auth/authorize/${providerId}`, {
    app,
    redirectUri,
    providerDetails,
  });

  let callbackUrl = new URL(redirectUri);
  callbackUrl += "/" + req.query.appId;

  console.log("callbackUrl", callbackUrl.toString());

  console.log("authUrl", authUrl);
  const authUrlObj = new URL(authUrl);
  let clientParamName = authUrlObj.toString().includes('auth0')?'client':'client_id'

  const url = new URL(authUrlObj.toString());
  url.searchParams.append(clientParamName, clientId);
  url.searchParams.append("redirect_uri", callbackUrl.toString());
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", scope);

  console.log(
    "authorize",
    {
      client_id: clientId,
      redirect_uri: callbackUrl.toString(),
      response_type: "code",
      scope,
    },
    "Full-url",
    decodeURIComponent(url.toString())
  );

  res.redirect(url.toString());
}

/**
 * Helper to call an external app API route to get a user identifier given Google email and account details.
 *
 * This function validates that the keys in the provided account details match the expected fields defined in the app's
 * external application link configuration. It also logs a warning if any unexpected keys are found.
 *
 * @param {string} appId - The unique identifier for the external application.
 * @param {Object} accountDetails - An object containing sensitive external app user account details.
 *        This may include information such as client credentials, login information, password, etc.
 * @returns {Promise<string>} A promise that resolves to the user's external identifier or rejects with an error.
 *
 * @throws {Error} Throws an error if the provided appId is invalid or if the API call fails.
 */
async function getExternalUserIdGivenAppAccountDetails(appId, accountDetails) {
  try {
    let app = global.useAppDetails(
      appId,
      "getExternalUserIdGivenAppAccountDetails"
    );

    // Log initialization (excluding sensitive data)
    console.log("getExternalUserIdGivenAppAccountDetails - Starting:", {
      appId,
      endpoint: app.externalApiGetExternalIdRoute,
      providedFields: Object.keys(accountDetails)
    });

    // Validate that accountDetails keys match app.externalAppLinkFields
    const validKeys = new Set(app.externalAppLinkFields);
    const invalidKeys = Object.keys(accountDetails).filter(
      (key) => !validKeys.has(key)
    );

    if (invalidKeys.length > 0) {
      console.warn(
        "getExternalUserIdGivenAppAccountDetails Warning: Invalid account details keys:",
        invalidKeys.join(", ")
      );
    }

    if (!app.externalApiGetExternalIdRoute) {
      console.error("Configuration Error:", {
        appId,
        error: "Missing externalApiGetExternalIdRoute",
        availableConfig: Object.keys(app)
      });
      throw new Error("app.externalApiGetExternalIdRoute required");
    }

    const { callExternalApi } = global.useAppAPIs(appId);
    
    console.log("Making external API call:", {
      method: "POST",
      endpoint: app.externalApiGetExternalIdRoute,
      requestFields: Object.keys(accountDetails)
    });

    const response = await callExternalApi(
      "POST",
      `${app.externalApiGetExternalIdRoute}`,
      { ...accountDetails }
    );

    // Log successful response (excluding sensitive data)
    console.log("getExternalUserIdGivenAppAccountDetails - Success:", {
      appId,
      endpoint: app.externalApiGetExternalIdRoute,
      hasExternalId: !!response.externalId,
      responseFields: Object.keys(response),
      status: response.status,
      headers: response.headers
    });

    return response;
  } catch (error) {
    // Log error with context but without sensitive data
    console.error("getExternalUserIdGivenAppAccountDetails - Error:", {
      appId,
      errorType: error.name,
      errorMessage: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      requestConfig: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    throw error;
  }
}

/**
 * Fetches an external application JWT (JSON Web Token) using the provided external user ID.
 * The caller must ensure that the user is linked to the external application before invoking this function.
 *
 * @param {string} externalUserId - The unique identifier for the external user.
 * It should correspond to the user's ID as recognized by the external application.
 * @param {string} appId - The application identifier
 *
 * @returns {Promise<string|null>}
 * A promise that resolves to the JWT token as a string if successful,
 * or null if there was a client-side or server-side error (e.g., HTTP status 400, 404, 500).
 *
 * @throws {Error} Throws an error if the JWT cannot be fetched due to an unexpected response format
 * or other issues not related to the external service's status codes.
 *
 * @example
 * const token = await getExternalToken("userId_clientId");
 * if (token) {
 *   console.log("Received JWT:", token);
 * } else {
 *   console.log("Failed to retrieve JWT.");
 * }
 *
 * @async
 */
async function getExternalToken(externalUserId, appId) {
  try {
    let app = global.useAppDetails(appId, "getExternalToken");
    const { callExternalApi } = global.useAppAPIs(appId);
    const usePostMethod = app.usePostForToken === 'true';

    console.log("getExternalToken - Starting:", {
      appId,
      endpoint: app.externalApiGetJwtRoute,
      externalUserId: externalUserId,
      method: usePostMethod ? 'POST' : 'GET'
    });

    if (!app.externalApiGetJwtRoute) {
      console.error("Configuration Error:", {
        appId,
        error: "Missing externalApiGetJwtRoute",
        availableConfig: Object.keys(app)
      });
      throw new Error("app.externalApiGetJwtRoute required");
    }

    const payload = {
      externalUserId,
      externalId: externalUserId // Remove this once APIV3 is iso with the API spec
    };

    console.log("Making external API call for JWT:", {
      method: usePostMethod ? 'POST' : 'GET',
      endpoint: app.externalApiGetJwtRoute,
      payload
    });

    const response = await callExternalApi(
      usePostMethod ? 'POST' : 'GET',
      app.externalApiGetJwtRoute,
      payload
    );

    // Log response details
    console.log("getExternalToken - Response:", {
      status: response.status,
      headers: response.headers,
      hasToken: !!(response[app.getJwtTokenField || 'token']),
      responseFields: Object.keys(response)
    });

    // Check response status and handle response data
    if (
      response.status === 400 ||
      response.status === 404 ||
      response.status === 500
    ) {
      console.error(
        "Error fetching JWT: HTTP status",
        response.status,
        "Response:",
        {
          status: response.status,
          message: response.message || 'No error message provided',
          fields: Object.keys(response)
        }
      );
      return null; // Return null on specific client or server error
    }

    const tokenFieldName = app.getJwtTokenField || 'token';
    const token = response[tokenFieldName];

    if (token) {
      console.log("JWT successfully retrieved from field:", tokenFieldName);
      return token;
    } else {
      console.error("JWT missing from response:", {
        status: response.status,
        expectedField: tokenFieldName,
        availableFields: Object.keys(response)
      });
      throw new Error(
        `Failed to fetch JWT: Token not found in '${tokenFieldName}' field`
      );
    }
  } catch (error) {
    // Log error details
    console.error("getExternalToken - Error:", {
      appId,
      errorType: error.name,
      errorMessage: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      requestConfig: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    throw error;
  }
}

/**
 * Gets the appropriate provider client based on the provider ID
 * @param {string} providerId Provider identifier
 * @param {string} appId Application identifier
 * @param {Object} config
 * @returns {Object} Provider client with getDetailsGivenCode method
 * @throws {Error} If provider is not supported
 */
function getProviderClient(providerId, appId, config = null) {
  if(providerId.toLowerCase().includes('keycloak')) {
    return getKeycloakClientByApp(providerId, appId, config);
  }
  if(providerId.toLowerCase().includes('google')) {
    return getGoogleClientByApp(providerId, appId, config);
  }
  if(providerId.toLowerCase().includes('gitlab')) {
    return getGitLabClientByApp(providerId, appId, config);
  }
  if(providerId.toLowerCase().includes('auth0')) {
    return getAuth0ClientByApp(providerId, appId, config);
  }

  throw new Error(`Unsupported provider: ${providerId}`);
}

function getAuth0ClientByApp(providerId, appId, config = null) {
  const { useAuth0API } = require('../config/auth0');
  const { createAuth0ClientByApp } = useAuth0API();
  const client = createAuth0ClientByApp(providerId, appId, config);
  return {
    getDetailsGivenCode: client.getDetailsGivenCode.bind(client)
  };
}

function getGitLabClientByApp(providerId, appId, config = null) {
  const { useGitLabAPI } = require('../config/gitlab');
  const { createGitLabClientByApp } = useGitLabAPI();
  const client = createGitLabClientByApp(providerId, appId, config);
  return {
    getDetailsGivenCode: client.getGitLabDetailsGivenCode.bind(client)
  };
}

function getGoogleClientByApp(providerId, appId, config = null) {
  const { useGoogleAPI } = require('../config/google');
  const { createGoogleClientByApp } = useGoogleAPI();
  const client = createGoogleClientByApp(providerId, appId, config);
  return {
    getDetailsGivenCode: client.getGoogleDetailsGivenCode.bind(client)
  };
}

function getKeycloakClientByApp(providerId, appId, config = null) {
  const { useKeycloakAPI } = require('../config/keycloak');
  const { createKeycloakClientByApp } = useKeycloakAPI();
  const client = createKeycloakClientByApp(providerId, appId, config);
  return {
    getDetailsGivenCode: client.getKeycloakDetailsGivenCode.bind(client)
  };
}

module.exports = {
  handleOAuth,
  handleOAuthByClientConfig,
  getExternalUserIdGivenAppAccountDetails,
  getExternalToken,
  getProviderClient
};
