# Google Login Auth server
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Base url for external api
EXTERNAL_APP_API_URL=http://localhost:3001

# Customize external endpoint routes
EXTERNAL_API__LINK_ACCOUNT_ROUTE=/googleauth/link
EXTERNAL_API__GET_EXTERNAL_ID_ROUTE=/googleauth/external-id
EXTERNAL_API__GET_JWT_ROUTE=/googleauth/get_jwt

# This is optional if we want to redirect to external app.
# If we integrate the popup from the external app, we will just retrieve the jwt
EXTERNAL_APP_URL=http://localhost:3001

# Auth with external app (/googleauth routes)
EXTERNAL_APP_API_KEY=secret

# What fields to ask if the link is needed
EXTERNAL_APP_LINK_FIELDS=client,username,password

PORT=3000

# External app config

# If a request has this bearer, we grants access to /googleauth routes
MICROSERVICE_GOOGLELOGIN_API_KEY=secret

JWT_SECRET=secret