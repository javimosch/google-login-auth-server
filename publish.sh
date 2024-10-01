#!/bin/sh

TAG=${1:-latest}

# Build the Docker image with a custom tag
docker build -t javimosch/google-login-auth-server${TAG:+:$TAG} .

# Push the Docker image to the repository with the custom tag
docker push javimosch/google-login-auth-server${TAG:+:$TAG}