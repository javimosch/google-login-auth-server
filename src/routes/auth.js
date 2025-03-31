const express = require("express");
const router = express.Router();
const {
  handleOAuthByClientConfig,
  handleOAuth,
  getExternalUserIdGivenAppAccountDetails,
  getExternalToken,
  getProviderClient
} = require("../utils/auth");
const ClientConfig = require("../models/ClientConfig");

router.get("/authorize/:providerId", (req, res) => {
  const providerId = req.params.providerId;
  let match = global.applications.find((a) => a.appId.toLowerCase() === providerId.toLowerCase());
  if (!match) {
    console.error(`Invalid providerId specified: ${providerId}`,{
      providerId,
      applications: global.applications
    });
    return res.status(400).send("Invalid provider specified");
  }
  handleOAuth(req, res, providerId);
});

router.get("/authorize/config/:configId", async (req, res) => {
  const configId = req.params.configId;
  const config = await ClientConfig.findOne({_id: configId});
  if (!config) {
    console.error(`Invalid providerId specified: ${configId}`);
    return res.status(400).send("Invalid provider specified");
  }
  console.log('Config client', {config})
  handleOAuthByClientConfig(req, res, config);
});

/**
 * openid idp will redirect to this route
 */
router.get("/callback/:providerId/:appId?/:configId?", async (req, res) => {
  const { code } = req.query;
  const decodedState = { appId: req.params.appId, configId: req.params.configId };
  const providerId = req.params.providerId;
  const routePath = `/callback/${providerId}`;

  console.log(routePath, {
    query: req.query,
  });

  try {
    const { appId, configId } = decodedState;
    let app = global.useAppDetails(appId, `/callback/${providerId}`);
    console.log("App data:", {app});
    let config = null;
    if (configId) {
      config = await ClientConfig.findOne({_id: configId});
    } else if (req.query.state) {
      config = await ClientConfig.findOne({_id: req.query.state});
    }
    console.log('config client', {config})

    // Get provider client and fetch user details
    const providerClient = getProviderClient(providerId, appId, config);
    const payload = await providerClient.getDetailsGivenCode(code);
    const idpEmail = payload.email;

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
        payload.redirectUrl = app.externalAppUrl + "/?_token=" + token;
      } catch (err) {
        console.log(`ERROR ${routePath} get jwt`, {
          err,
        });
      }
    }

    console.log(routePath, {
      payload,
    });

    let linkFields = app.externalAppLinkFields || ["email,password"];
    linkFields =
      linkFields instanceof Array ? linkFields : linkFields.split(",");

    res.render("popup-login", {
      user: payload,
      linkFields: linkFields.join(","),
      appId,
      providerId,
      configId: config === null ? '' : config._id,
    });
  } catch (error) {
    console.error("Authentication error:", {
      error,
      data: error.response?.data||"",
    });
    res.render("error", {
      error: error.message,
    });
  }
});

/**
 * Triggers a verification and linking process for an auth provider account
 * on an external application. This route is called when a popup
 * (if no linked account exists) initiates a request to link a
 * user's account.
 */
router.post("/link-account", async (req, res) => {
  console.log("/link-account", {
    body: req.body,
  });

  let payload = req.body.payload; // from popup-login.ejs
  let appId = req.body.appId;
  let app = global.useAppDetails(appId, "/link-account");
  let { email: idpEmail } = payload;

  try {
    let { externalId: externalUserId } =
      await getExternalUserIdGivenAppAccountDetails(appId, payload);

    //@todo Store/Retrieve google metadata from redis/cache
    await linkExternalUser(
      req.body.providerId,
      appId,
      externalUserId,
      idpEmail,
      {}
    );
    
    let token = await getExternalToken(externalUserId, appId);

    let response = {
      redirectUrl: app.externalAppUrl + "/?_token=" + token,
      token,
    };
  
    res.json(response);
  } catch (error) {
    if (error.response && error.response.status === 422) {
      // If it's a 422 error, respond with the error message
      return res.status(422).json({
        error: 'Unprocessable Entity',
        details: error.response.data, // Send back the response data if available
      });
    } else {
      // Handle other errors (optional)
      console.error("Error linking account:", error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
});

module.exports = router;
