ARG NODE_VERSION

FROM node:${NODE_VERSION} AS node_base

ENV TZ=Europe/Paris
USER root
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" > /etc/timezone
USER node

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++

# Copy package.json and package-lock.json
COPY package*.json ./

FROM node:${NODE_VERSION} AS node_build

WORKDIR /home/node/app
COPY . /home/node/app/

RUN npm install && \
    npm run build --mode=${RELASE_ENV}


FROM nginx:stable-alpine AS release

COPY --from=node_build /home/node/app/dist /usr/share/nginx/html