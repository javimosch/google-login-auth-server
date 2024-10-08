const dotenv = require("dotenv");
const yaml = require("js-yaml");
const fs = require("fs");
const axios = require("axios");

dotenv.config();

// Load configurations from apps.yml
const loadConfig = () => {
  try {
    const fileContents = fs.readFileSync("./src/config/apps.yml", "utf8");
    return yaml.load(fileContents);
  } catch (e) {
    console.error(e);
    return {};
  }
};

const applicationsConfig = loadConfig();

console.log({
  applicationsConfig,
});

let applications = (process.env.AUTH_APPLICATIONS||"").split(",").map((app) => {
  const [appId, appName] = app.split(":");
  return { appId, appName };
}).filter(a=>!!a.appId);

if(applications.length===0&&Object.keys(applicationsConfig.apps).length>0){
  applications = Object.keys(applicationsConfig.apps).map((n)=>{
    return {
      appId:n,
      appName: applicationsConfig.apps[n].name||applicationsConfig.apps[n].appName||n
    }
  })
}

applications = applications.map((app) => {
  const appConfig = applicationsConfig.apps[app.appId];
  return { appId:app.appId, appName:app.appName, ...appConfig };
});


for (let index in applications) {
  let app = applications[index];
  let appId = app.appId;
  for (let x in app) {
    if (!["appId"].includes(x)) {
      console.log("CHECK",`${appId.toUpperCase()}__${x.toUpperCase()}`)
      if (process.env[`${appId.toUpperCase()}__${x.toUpperCase()}`]) {
        applications[index][x] = process.env[`${appId.toUpperCase()}__${x.toUpperCase()}`];
      }
    }
  }
}

global.useAppDetails = function (appId, scope) {
  let app = global.applications.find((a) => a.appId === appId);
  if (!app) {
    throw new Error(`${scope || ""}: Invalid appId: ` + appId);
  }
  return app;
};

global.useAppAPIs = function (appId) {
  let app = global.useAppDetails(appId,'useAppAPIs')
  return {
    /**
     * Helper to call external app api
     * @param {*} method
     * @param {*} relativePath
     * @param {*} payload
     * @returns
     */
    async callExternalApi(method, relativePath, payload = null) {
      const externalAppApiUrl = app.EXTERNAL_APP_API_URL;
      const externalAppApiKey = app.EXTERNAL_APP_API_KEY;

      console.log('callExternalApi',{
        url:`${externalAppApiUrl}${relativePath}`
      })
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
        console.log('callExternalApi',{
          relativePath,
          data:response.data
        })
        return response.data; // Return the data received from the API
      } catch (err) {
        console.error("callExternalApi error:", { err:err.stack });
        //throw err; // Rethrow the error for handling in the calling function
        return null
      }
    },
  };
};

global.applications=applications

module.exports = applications;
