const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

/**
 * Converts a string to camelCase
 * @param {string} str String to convert
 * @returns {string} Camelized string
 */
const toCamelCase = (str) => {
  return str.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

/**
 * Parses applications defined through environment variables
 * Format: APP_NAMES=app1,app2,app3
 * Then for each app: APP1__NAME, APP1__EXTERNAL_APP_API_URL, etc.
 * @returns {Array} Array of application objects
 */
const parseApplicationsFromEnv = () => {
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
        if (propName !== 'NAME') {
          const camelKey = toCamelCase(propName);
          app[camelKey] = process.env[key];
        }
      });

    return app;
  });
};

/**
 * Gets application details by appId
 * @param {string} appId Application ID
 * @param {string} scope Scope for error message
 * @returns {Object} Application details
 */
global.useAppDetails = function (appId, scope) {
  let app = global.applications.find((a) => a.appId.toLowerCase() === appId.toLowerCase());
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
      const externalAppApiUrl = app.externalAppApiUrl;
      const externalAppApiKey = app.externalAppApiKey;
      const useXApiKey = app.useXApiKey === 'true';

      // Log the request details (excluding sensitive data)
      console.log('callExternalApi Request:', {
        method,
        url: `${externalAppApiUrl}${relativePath}`,
        hasPayload: !!payload,
        hasApiKey: !!externalAppApiKey,
        authType: useXApiKey ? 'X-API-KEY' : 'Bearer'
      });

      try {
        const config = {
          method: method,
          url: `${externalAppApiUrl}${relativePath}`,
          headers: {
            "Content-Type": "application/json",
          },
        };

        if (externalAppApiKey) {
          if (useXApiKey) {
            config.headers["X-API-KEY"] = externalAppApiKey;
          } else {
            config.headers["Authorization"] = `Bearer ${externalAppApiKey}`;
          }
        }

        if (payload) {
          if (method === "GET") {
            config.params = payload;
          } else {
            config.data = payload;
          }
        }

        // Log the actual request configuration (with sensitive data masked)
        console.log('Request Configuration:', {
          method: config.method,
          url: config.url,
          headers: {
            ...config.headers,
            'Authorization': config.headers['Authorization'] ? '[BEARER TOKEN PRESENT]' : undefined,
            'X-API-KEY': config.headers['X-API-KEY'] ? '[API KEY PRESENT]' : undefined
          },
          params: config.params,
          data: config.data
        });

        const response = await axios(config);

        // Log the response (excluding sensitive data)
        console.log('API Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data ? '[DATA PRESENT]' : undefined
        });

        return response.data;
      } catch (error) {
        console.error('API Error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: {
              ...error.config?.headers,
              'Authorization': error.config?.headers?.Authorization ? '[BEARER TOKEN PRESENT]' : undefined,
              'X-API-KEY': error.config?.headers?.['X-API-KEY'] ? '[API KEY PRESENT]' : undefined
            }
          }
        });
        throw error;
      }
    },
  };
};

// Initialize applications
global.applications = parseApplicationsFromEnv();

module.exports = global.applications;
