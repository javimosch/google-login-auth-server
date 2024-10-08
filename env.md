# Main application config

PORT=3000

# MongoDB Configuration
MONGO_URI=mongodb://xx:xx@xx:27017?authSource=admin
DB_NAME=sso-auth-server

# Auth Applications can be configured be either configuring apps.yml or overriding single properties here

GITLAB__CLIENT_ID=xx
GITLAB__CLIENT_SECRET=xx
GITLAB__REDIRECT_URL=http://localhost:3000/auth/callback/gitlab

GOOGLE__CLIENT_ID=xx
GOOGLE__CLIENT_SECRET=xx
GOOGLE__REDIRECT_URL=http://localhost:3000/auth/callback/google

# External app config -------------------------------------------------------

# If a request has this bearer, we grants access to /ssoauth routes
MICROSERVICE_SSOLOGIN_API_KEY=secret

JWT_SECRET=secret



# Extra applications configuration (envs will override apps.yml configuration)

## These are our internal apps (Can be added/removed in apps.yml)
GEOREDV3__APPNAME
GEOREDV3__EXTERNAL_APP_URL
GEOREDV3__EXTERNAL_APP_API_KEY
GEOREDV3__EXTERNAL_APP_LINK_FIELDS
GEOREDV3__EXTERNAL_APP_API_URL
GEOREDV3__EXTERNAL_API__GET_EXTERNAL_ID_ROUTE
GEOREDV3__EXTERNAL_API__GET_JWT_ROUTE
STYX__APPNAME
STYX__EXTERNAL_APP_URL
STYX__EXTERNAL_APP_API_KEY
STYX__EXTERNAL_APP_LINK_FIELDS
STYX__EXTERNAL_APP_API_URL
STYX__EXTERNAL_API__GET_EXTERNAL_ID_ROUTE
STYX__EXTERNAL_API__GET_JWT_ROUTE

## These are the supported openid providers (Can be added/removed in apps.yml)
GOOGLE__APPNAME
GOOGLE__OPENID_PROVIDER
GOOGLE__CLIENT_ID
GOOGLE__CLIENT_SECRET
GOOGLE__REDIRECT_URL
GOOGLE__SCOPE
GOOGLE__AUTH_URL
GITLAB__APPNAME
GITLAB__OPENID_PROVIDER
GITLAB__CLIENT_ID
GITLAB__CLIENT_SECRET
GITLAB__REDIRECT_URL
GITLAB__SCOPE
GITLAB__AUTH_URL


