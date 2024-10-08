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


