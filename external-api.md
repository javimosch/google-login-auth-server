# Documentation for Required External APIs

This documentation outlines the required external APIs for the SSO Login Auth server, detailing their expected behavior and the routes involved. Each application defined in apps.yml should expose some external API to be able to retrieve an unique user id and generate a JWT.

## 1. Overview

The SSO Login Auth server interacts with an external application to manage user authentication and linking idp (Google/Gitlab/etc) accounts. The external APIs are defined in the environment configuration file (`env.md`) and are called from the authentication routes in `auth.js`.

## 2. External API Configuration

The following environment variables define the external API configuration.
Available in apps.yml. Customizable via envs (Sensitive envs).

- **Base URL**: 
  - `{APPNAME}__EXTERNAL_APP_API_URL`: The base URL for the external API (e.g., `http://localhost:3001`).

- **API Routes**:
  - `{APPNAME}__EXTERNAL_API__GET_EXTERNAL_ID_ROUTE`: Route for retrieving the external ID associated with a Google email (default: `/googleauth/external-id`).
  - `{APPNAME}__EXTERNAL_API__GET_JWT_ROUTE`: Route for obtaining a JWT token using a Google email (default: `/googleauth/get_jwt`).

- **API Key**:
  - `{APPNAME}__EXTERNAL_APP_API_KEY`: The API key required for authentication with the external application.


## 3. External API Endpoints

The following endpoints are utilized in the authentication process:

### 3.1 Get External ID by Username and Client Name

The params received could change given the EXTERNAL_APP_LINK_FIELDS configured for the specific application.

- **Endpoint**: `POST /ssoauth/external-id`
- **Description**: This endpoint retrieves the external user identifier based on the provided username (email), client name, and password (mock).
- **Request Body**: 
  - **Required**: true
  - **Content**: 
    - `application/json`: 
      - **Schema**: 
        - **Type**: object
        - **Properties**: 
          - `username`: 
            - **Type**: string
            - **Description**: The user's email (username) to look up.
          - `clientName`: 
            - **Type**: string
            - **Description**: The name of the client associated with the user.
          - `password`: 
            - **Type**: string
            - **Description**: The user's password (for mock purposes, not processed).
- **Responses**: 
  - **200**: 
    - **Description**: Successfully retrieved external user identifier.
    - **Content**: 
      - `application/json`: 
        - **Schema**: 
          - **Type**: object
          - **Properties**: 
            - `externalId`: 
              - **Type**: string
              - **Description**: A string combining userId and clientId (formatted as `userId_clientId`).
  - **400**: 
    - **Description**: Missing required parameters.
    - **Content**: 
      - `application/json`: 
        - **Schema**: 
          - **Type**: object
          - **Properties**: 
            - `error`: 
              - **Type**: string
              - **Description**: Error message indicating that required parameters are missing.
  - **403**: 
    - **Description**: Client name does not match the user's associated client.
    - **Content**: 
      - `application/json`: 
        - **Schema**: 
          - **Type**: object
          - **Properties**: 
            - `error`: 
              - **Type**: string
              - **Description**: Error message indicating that the client name does not match.
  - **404**: 
    - **Description**: User not found based on the provided username.
    - **Content**: 
      - `application/json`: 
        - **Schema**: 
          - **Type**: object
          - **Properties**: 
            - `error`: 
              - **Type**: string
              - **Description**: Error message indicating that the user was not found.
  - **500**: 
    - **Description**: Internal Server Error.
    - **Content**: 
      - `application/json`: 
        - **Schema**: 
          - **Type**: object
          - **Properties**: 
            - `error`: 
              - **Type**: string
              - **Description**: Error message indicating that an internal server error has occurred.

### 3.2 Get JWT by Google Email

- **Endpoint**: `GET /ssoauth/get_jwt`
- **Description**: This endpoint retrieves a JWT token for a user based on their external user ID, which combines the user ID and client ID in the format `userId_clientId`.
- **Query Parameter**: 
  - `externalUserId`: 
    - **Type**: string
    - **Required**: true
    - **Description**: The external user ID consisting of userId and clientId in the format `userId_clientId`.
- **Responses**: 
  - **200**: 
    - **Description**: Successful JWT token generation.
    - **Content**: 
      - `application/json`: 
        - **Schema**: 
          - **Type**: object
          - **Properties**: 
            - `token`: 
              - **Type**: string
              - **Description**: The generated JWT token.
  - **400**: 
    - **Description**: Missing or invalid `externalUserId` format.
    - **Content**: 
      - `application/json`: 
        - **Schema**: 
          - **Type**: object
          - **Properties**: 
            - `error`: 
              - **Type**: string
              - **Description**: Error message indicating invalid `externalUserId` format or missing parameters.
  - **404**: 
    - **Description**: User not found based on the provided user ID.
    - **Content**: 
      - `application/json`: 
        - **Schema**: 
          - **Type**: object
          - **Properties**: 
            - `error`: 
              - **Type**: string
              - **Description**: Error message indicating no user was found.
  - **500**: 
    - **Description**: Internal Server Error.
    - **Content**: 
      - `application/json`: 
        - **Schema**: 
          - **Type**: object
          - **Properties**: 
            - `error`: 
              - **Type**: string
              - **Description**: Error message indicating an internal server error has occurred.

## 4. Error Handling

The external API calls should handle errors gracefully. If an error occurs during the API call, it should be logged, and an appropriate error message should be returned to the client. Common error scenarios include:

- User not found when attempting to get a JWT.
- Issues with linking accounts due to invalid credentials or other reasons.

## 5. Conclusion

This documentation provides a comprehensive overview of the external APIs required for the Google Login Auth server. The defined endpoints facilitate account linking and token retrieval, ensuring a smooth authentication process for users.