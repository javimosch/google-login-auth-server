# Use the official Node.js image with Alpine
FROM node:20.17.0-alpine

# Set the working directory
WORKDIR /usr/src/app

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD [ "npm", "run", "start" ]