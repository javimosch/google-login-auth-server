const express = require("express");
const router = express.Router();
const { useGoogleAPI } = require("../config/google");
const { useGitLabAPI } = require('../config/gitlab');

router.get("/authorize/:providerId", (req, res) => {
  const providerId = req.params.providerId;
  let match = global.applications.find(a=>a.appId===providerId)
  if (!match) {
    console.error(`Invalid providerId specified: ${providerId}`)
    return res.status(400).send("Invalid provider specified");
  }
  handleOAuth(req, res, providerId);
});

function handleOAuth(req, res, providerId) {
  const query = req.query;

  let app = global.useAppDetails(req.query.appId, `/auth/authorize/${providerId}`);

  let providerDetails = global.useAppDetails(providerId, `/auth/authorize/${providerId}`);

  if(!providerDetails.openid_provider){
    throw new Error("Invalid provider")
  }
  if(app.openid_provider){
    throw new Error('Invalid app') // Apps (Geored/Styx) vs idp Providers (Google/Gitlab/Veolia)
  }

  const { redirect_url:redirectUri, client_id:clientId, auth_url:authUrl, scope } = providerDetails

  console.log(`/auth/authorize/${providerId}`, {
    app,
    redirectUri,
    providerDetails
  });

  const callbackUrl = new URL(redirectUri);
  Object.keys(query).forEach((key) => {
    if (key !== "provider") {
      callbackUrl.searchParams.append(key, query[key]);
    }
  });

  const url = new URL(authUrl);
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("redirect_uri", callbackUrl.toString());
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", scope);

  res.redirect(url.toString());
}

/**
 * When popup is opened the first time, this route is called and google login is triggered
 */
/* router.get("/google", (req, res) => {
  // Extract query parameters from request
  const query = req.query;

  let app = global.useAppDetails(req.query.appId, "/google");
  const redirectUri = app.GOOGLE_REDIRECT_URI;
  const clientId = app.GOOGLE_CLIENT_ID;

  console.log("/google", {
    app,
    redirectUri,
  });

  // Create a URL object for the redirect URI
  const callbackUrl = new URL(redirectUri);

  // Append the received query parameters to the callback URL
  Object.keys(query).forEach((key) => {
    callbackUrl.searchParams.append(key, query[key]);
  });

  // Build the Google authentication URL
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("redirect_uri", callbackUrl.toString());
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", "profile email");

  // Redirect to Google authentication
  res.redirect(url.toString());
}); */

/**
 * openid idp will redirect to this route
 */
router.get("/callback/:providerId", async (req, res) => {
  const { code } = req.query;
  const providerId = req.params.providerId //i.g google/gitlab/veolia
  const routePath = `/callback/${providerId}`
  
  console.log(routePath, {
    query: req.query,
  });

  try {
    const appId = req.query.appId;
    let app = global.useAppDetails(appId, `/callback/${providerId}`);

    let payload, idpEmail;
    
    if (providerId === 'google') {
      const { createGoogleClientByApp } = useGoogleAPI();
      const { getGoogleDetailsGivenCode } = createGoogleClientByApp(providerId,appId);
      payload = await getGoogleDetailsGivenCode(code);
      idpEmail = payload.email;
    } else if (providerId === 'gitlab') {
      const { createGitLabClientByApp } = useGitLabAPI();
      const { getGitLabDetailsGivenCode } = createGitLabClientByApp(providerId,appId);
      payload = await getGitLabDetailsGivenCode(code);
      idpEmail = payload.email;
    } else {
      throw new Error(`Unsupported provider: ${providerId}`);
    }

    const linkDocument = await global.getUserLinkByEmail(
      providerId,
      appId,
      idpEmail
    );

    payload.linked = !!linkDocument;

    if (payload.linked) {
      try {
        let token = await getExternalToken(linkDocument.externalUserId, appId);
        payload.token = token;
        payload.redirectUrl = app.EXTERNAL_APP_URL + "/?_token=" + token;
      } catch (err) {
        console.log(`ERROR ${routePath} get jwt`, {
          err,
        });
      }
    }

    console.log(routePath, {
      payload,
    });

    let linkFields = app.EXTERNAL_APP_LINK_FIELDS || ["email,password"];
    linkFields =
      linkFields instanceof Array ? linkFields : linkFields.split(",");

    res.render("popup-login", {
      user: payload,
      linkFields: linkFields.join(","),
      appId,
      providerId
    });
  } catch (error) {
    console.error("Authentication error:", {
      error,
    });
    res.render("error", {
      error: error.message,
    });
  }
});

/**
 * Triggers a verification and linking process for a Google account
 * on an external application. This route is called when a popup
 * (if no linked account exists) initiates a request to link a
 * user's Google account.
 *
 * @route POST /link-google-account
 * @param {object} req - The request object containing the payload and app ID.
 * @param {object} req.body - The body of the request.
 * @param {object} req.body.payload - The necessary details to identify the user
 * and link the Google account (exact structure depends on implementation).
 * @param {string} req.body.appId - The ID of the application making the request.
 * @param {object} res - The response object used to send back the desired HTTP response.
 *
 * @throws {Error} Throws an error if the app ID provided is invalid.
 *
 * @returns {object} A JSON response containing:
 *  - {string} redirectUrl - The URL to which the external application should redirect
 *    the user, appending the generated token as a query parameter.
 *  - {string} token - The generated JWT token for the authenticated user.
 *
 * @example
 * const response = await fetch('/link-google-account', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     payload: {
 *       // user-specific data
 *     },
 *     appId: 'your-app-id'
 *   }),
 *   headers: { 'Content-Type': 'application/json' }
 * });
 */
router.post("/link-google-account", async (req, res) => {
  console.log("/link-google-account", {
    body: req.body,
  });
  let payload = req.body.payload;//from popup-login.ejs
  let appId = req.body.appId;
  let app = global.useAppDetails(appId, "/link-google-account");
  let {email:idpEmail} = payload 
  let { externalId: externalUserId } =
    await getExternalUserIdGivenAppAccountDetails(appId, payload);

  //@todo Store/Retrieve google metadata from redis/cache
  await linkExternalUser(req.body.providerId,appId, externalUserId, idpEmail, {});
  let token = await getExternalToken(externalUserId,appId);

  let response = {
    redirectUrl: app.EXTERNAL_APP_URL + "/?_token=" + token,
    token,
  };
  res.json(response);
});

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
  let app = global.useAppDetails(
    appId,
    "getExternalUserIdGivenAppAccountDetails"
  );

  console.log('getExternalUserIdGivenAppAccountDetails',{
    appId,
    app,
    path:app.EXTERNAL_API__GET_EXTERNAL_ID_ROUTE
  })

  // Validate that accountDetails keys match app.EXTERNAL_APP_LINK_FIELDS
  const validKeys = new Set(app.EXTERNAL_APP_LINK_FIELDS);
  const invalidKeys = Object.keys(accountDetails).filter(
    (key) => !validKeys.has(key)
  );

  if (invalidKeys.length > 0) {
    console.warn(
      "getExternalUserIdGivenAppAccountDetails invalid accountDetails keys: " +
        invalidKeys.join(", ")
    );
  }

  const {callExternalApi} =  global.useAppAPIs(appId)

  if(!app.EXTERNAL_API__GET_EXTERNAL_ID_ROUTE){
    throw new Error('app.EXTERNAL_API__GET_EXTERNAL_ID_ROUTE required')
  }

  return await callExternalApi(
    "POST",
    `${app.EXTERNAL_API__GET_EXTERNAL_ID_ROUTE}`,
    { ...accountDetails }
  );
}

/**
 * Fetches an external application JWT (JSON Web Token) using the provided external user ID.
 * The caller must ensure that the user is linked to the external application before invoking this function.
 *
 * @param {string} externalUserId - The unique identifier for the external user.
 * It should correspond to the user's ID as recognized by the external application.
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
    let app = global.useAppDetails(
      appId,
      "getExternalToken"
    );
    const {callExternalApi} =  global.useAppAPIs(appId)

    if(!app.EXTERNAL_API__GET_JWT_ROUTE){
      throw new Error('app.EXTERNAL_API__GET_EXTERNAL_ID_ROUTE required')
    }

    const response = await callExternalApi(
      "GET",
      app.EXTERNAL_API__GET_JWT_ROUTE,
      {
        externalUserId,
      }
    );

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
        response
      );
      return null; // Return null on specific client or server error
    }

    if (response.token) {
      return response.token; // Assuming a successful response includes a token
    } else {
      throw new Error(
        "Failed to fetch JWT: " + (response.error || "Unknown error")
      );
    }
  } catch (error) {
    // Log general errors
    console.error("Error:", error.message);
    throw error; // Re-throw the error if it's not handled
  }
}

module.exports = router;
