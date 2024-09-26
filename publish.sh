#!/bin/sh

# Build the Docker image
docker build -t javimosch/google-login-auth-server .

# Push the Docker image to the repository
docker push javimosch/google-login-auth-server