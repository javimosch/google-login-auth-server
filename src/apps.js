const dotenv = require("dotenv");
const yaml = require("js-yaml");
const fs = require("fs");
const axios = require("axios");

dotenv.config();

/**
 * Loads configuration from apps.yml file
 * @returns {Object} Configuration object
 */
const loadConfig = () => {
  try {
    const fileContents = fs.readFileSync("./src/config/apps.yml", "utf8");
    return yaml.load(fileContents);
  } catch (e) {
    console.error(e);
    return {};
  }
};

/**
 * Parses applications from environment variables
 * @returns {Array} Array of application objects
 */
const parseApplicationsFromEnv = () => {
  return (process.env.AUTH_APPLICATIONS || "")
    .split(",")
    .map((app) => {
      const [appId, appName] = app.split(":");
      return { appId, appName };
    })
    .filter(a => !!a.appId);
};

/**
 * Parses applications defined purely through environment variables
 * Format: APP_NAMES=app1,app2,app3
 * Then for each app: APP1__NAME, APP1__EXTERNAL_APP_API_URL, etc.
 * @returns {Array} Array of application objects
 */
const parseApplicationsFromAppNames = () => {
  const appNames = (process.env.APP_NAMES || "").split(",").filter(name => name.trim());
  
  return appNames.map(appName => {
    const appId = appName.trim();
    const envPrefix = appId.toUpperCase();
    const app = {
      appId,
      appName: process.env[`${envPrefix}__NAME`] || appId
    };

    // Get all environment variables for this app
    Object.keys(process.env)
      .filter(key => key.startsWith(`${envPrefix}__`))
      .forEach(key => {
        const propName = key.replace(`${envPrefix}__`, '');
        if (propName !== 'NAME') {  // Skip NAME as it's already handled
          app[propName.toLowerCase()] = process.env[key];
        }
      });

    return app;
  });
};

/**
 * Gets applications from config file
 * @param {Object} config Configuration object
 * @returns {Array} Array of application objects
 */
const getApplicationsFromConfig = (config) => {
  return Object.keys(config.apps).map((n) => ({
    appId: n,
    appName: config.apps[n].name || config.apps[n].appName || n
  }));
};

/**
 * Merges application config with environment variables
 * @param {Array} apps Array of application objects
 * @param {Object} config Configuration object
 * @returns {Array} Array of merged application objects
 */
const mergeApplicationsWithConfig = (apps, config) => {
  return apps.map((app) => {
    const appConfig = config.apps[app.appId];
    return { appId: app.appId, appName: app.appName, ...appConfig };
  });
};

/**
 * Overrides application properties with environment variables
 * @param {Array} apps Array of application objects
 * @returns {Array} Array of applications with overridden properties
 */
const overrideWithEnvVars = (apps) => {
  return apps.map(app => {
    const newApp = { ...app };
    Object.keys(app).forEach(key => {
      if (!["appId"].includes(key)) {
        const envKey = `${app.appId.toUpperCase()}__${key.toUpperCase()}`;
        if (process.env[envKey]) {
          newApp[key] = process.env[envKey];
        }
      }
    });
    return newApp;
  });
};

/**
 * Initializes the applications
 * @returns {Array} Array of initialized applications
 */
const initializeApplications = () => {
  const config = loadConfig();
  console.log({ applicationsConfig: config });

  // Try to get apps from different sources in order of priority:
  // 1. AUTH_APPLICATIONS env var (legacy format)
  // 2. APP_NAMES env var (new format)
  // 3. apps.yml config file
  let apps = parseApplicationsFromEnv();
  
  if (apps.length === 0) {
    apps = parseApplicationsFromAppNames();
  }
  
  if (apps.length === 0 && Object.keys(config.apps || {}).length > 0) {
    apps = getApplicationsFromConfig(config);
    apps = mergeApplicationsWithConfig(apps, config);
  }

  apps = overrideWithEnvVars(apps);

  // Log the final applications configuration
  console.log('Initialized applications:', apps);
  
  return apps;
};

/**
 * Gets application details by appId
 * @param {string} appId Application ID
 * @param {string} scope Scope for error message
 * @returns {Object} Application details
 */
global.useAppDetails = function (appId, scope) {
  let app = global.applications.find((a) => a.appId === appId);
  if (!app) {
    throw new Error(`${scope || ""}: Invalid appId: ` + appId);
  }
  return app;
};

/**
 * Creates API helper functions for an application
 * @param {string} appId Application ID
 * @returns {Object} Object containing API helper functions
 */
global.useAppAPIs = function (appId) {
  let app = global.useAppDetails(appId, 'useAppAPIs');
  
  return {
    /**
     * Helper to call external app api
     * @param {string} method HTTP method
     * @param {string} relativePath API endpoint path
     * @param {Object} payload Request payload
     * @returns {Promise} API response
     */
    async callExternalApi(method, relativePath, payload = null) {
      const externalAppApiUrl = app.EXTERNAL_APP_API_URL;
      const externalAppApiKey = app.EXTERNAL_APP_API_KEY;

      console.log('callExternalApi', {
        url: `${externalAppApiUrl}${relativePath}`,
        payload
      });

      try {
        const config = {
          method: method,
          url: `${externalAppApiUrl}${relativePath}`,
          headers: {
            Authorization: `Bearer ${externalAppApiKey}`,
            Accept: "application/json",
          },
        };

        if (method.toUpperCase() === "GET" && payload) {
          config.params = payload;
        }

        if (method.toUpperCase() === "POST" && payload) {
          config.data = payload;
        }

        const response = await axios(config);
        console.log('callExternalApi', {
          relativePath,
          data: response.data
        });
        return response.data;
      } catch (err) {
        if (err.response && err.response.status === 422) {
          console.error("callExternalApi error:", {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data,
          });
        } else {
          console.error("callExternalApi error:", { err: err.stack });
        }
        throw err;
      }
    },
  };
};

// Initialize applications
global.applications = initializeApplications();

module.exports = global.applications;
