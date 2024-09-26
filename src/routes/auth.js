const express = require("express");
const router = express.Router();
const axios = require("axios");
const {
  client,
  clientId,
  clientSecret,
  redirectUri,
} = require("../config/google");

/**
 * When popup is opened the first time, this route is called and google login is triggered
 */
router.get("/google", (req, res) => {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", "profile email");
  res.redirect(url.toString());
});

/**
 * Google will redirect to this route
 */
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const ticket = await client.verifyIdToken({
      idToken: data.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    await injectLinkedPropertyToGoogleDetails(payload);

    if (payload.linked) {
      try {
        let token = await getExternalApiJWTByGoogleEmail(payload.email);
        payload.token=token
        payload.redirectUrl =
          process.env.EXTERNAL_APP_URL + "/?_token=" + token;
      } catch (err) {
        console.log("ERROR /google/callback get jwt", {
          err,
        });
      }
    }

    console.log("/google/callback", {
      payload,
    });

    let linkFields = (
      process.env.EXTERNAL_APP_LINK_FIELDS || "email,password"
    ).split(",");

    res.render("google-login", {
      user: payload,
      linkFields: linkFields.join(","),
    });
  } catch (error) {
    console.error("Authentication error:", {
      error
    });
    res.render("error",{
      error:error.message
    });
  }
});

/**
 * Popup (if no linked) will call this route to trigger a verification/linking and jwt gen on external app
 */
router.post("/link-google-account", async (req, res) => {
  console.log('/link-google-account', {
    body:req.body
  })
  let r = await callExternalApi(
    "POST",
    process.env.EXTERNAL_API__LINK_ACCOUNT_ROUTE||"/googleauth/link",
    req.body
  );
  let { token } = r
  console.log('token',{
    r
  })
  let payload = {
    redirectUrl : process.env.EXTERNAL_APP_URL + "/?_token=" + token
  }
  res.json(payload);
});

/**
 * Helper to call external app api
 * @param {*} method 
 * @param {*} relativePath 
 * @param {*} payload 
 * @returns 
 */
async function callExternalApi(method, relativePath, payload = null) {
  const externalAppApiUrl = process.env.EXTERNAL_APP_API_URL;
  const externalAppApiKey = process.env.EXTERNAL_APP_API_KEY;

  try {
    const config = {
      method: method,
      url: `${externalAppApiUrl}${relativePath}`,
      headers: {
        Authorization: `Bearer ${externalAppApiKey}`,
        Accept: "application/json",
      },
    };

    // If it's a GET request, include the payload as query parameters
    if (method.toUpperCase() === "GET" && payload) {
      config.params = payload; // Axios will automatically handle the serialization
    }

    // If it's a POST request, include the payload in the request body
    if (method.toUpperCase() === "POST" && payload) {
      config.data = payload;
    }

    const response = await axios(config);
    return response.data; // Return the data received from the API
  } catch (err) {
    console.error("callExternalApi error:", { err });
    throw err; // Rethrow the error for handling in the calling function
  }
}

async function injectLinkedPropertyToGoogleDetails(payload) {
  console.log("injectLinkedPropertyToGoogleDetails");

  try {
    // Call the external API using the extracted function
    const responseData = await getExternalApiExternalIdByGoogleEmail(
      payload.email
    );

    console.log("response", { data: responseData });

    // Check if the linked response is present
    if (responseData && responseData.identifier) {
      payload.linked = responseData.identifier !== null; // Set to true if identifier is not null
    } else {
      payload.linked = false; // Set to false if not linked
    }
  } catch (err) {
    console.error("injectLinkedPropertyToGoogleDetails", { err });
  }
}

/**
 * Helper to call external app api route to get user identifier given googleEmail
 * @param {*} googleEmail 
 * @returns 
 */
async function getExternalApiExternalIdByGoogleEmail(googleEmail) {
  return await callExternalApi(
    "GET",
    `${process.env.EXTERNAL_API__GET_EXTERNAL_ID_ROUTE||'/googleauth/external-id'}/${encodeURIComponent(googleEmail)}`
  );
}

/**
 * Helper to get external app api JWT given google email (ensure link is done first)
 * @param {*} googleEmail 
 * @returns 
 */
async function getExternalApiJWTByGoogleEmail(googleEmail) {
  try {
    const response = await callExternalApi("GET", process.env.EXTERNAL_API__GET_JWT_ROUTE||`/googleauth/get_jwt`, {
      googleEmail,
    });

    // Check response status and handle response data
    if (response.token) {
      return response.token; // Assuming a successful response includes a token
    } else {
      if (response.error === "USER_NOT_FOUND") {
        return null;
      }
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
