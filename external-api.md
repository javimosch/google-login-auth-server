# Documentation for Required External APIs

This documentation outlines the required external APIs for the Google Login Auth server, detailing their expected behavior and the routes involved.

## 1. Overview

The Google Login Auth server interacts with an external application to manage user authentication and linking Google accounts. The external APIs are defined in the environment configuration file (`env.md`) and are called from the authentication routes in `auth.js`.

## 2. External API Configuration

The following environment variables define the external API configuration:

- **Base URL**: 
  - `EXTERNAL_APP_API_URL`: The base URL for the external API (e.g., `http://localhost:3001`).

- **API Routes**:
  - `EXTERNAL_API__LINK_ACCOUNT_ROUTE`: Route for linking a Google account (default: `/googleauth/link`).
  - `EXTERNAL_API__GET_EXTERNAL_ID_ROUTE`: Route for retrieving the external ID associated with a Google email (default: `/googleauth/external-id`).
  - `EXTERNAL_API__GET_JWT_ROUTE`: Route for obtaining a JWT token using a Google email (default: `/googleauth/get_jwt`).

- **API Key**:
  - `EXTERNAL_APP_API_KEY`: The API key required for authentication with the external application.

## 3. External API Endpoints

The following endpoints are utilized in the authentication process:

### 3.1 Link Google Account

- **Endpoint**: `POST /googleauth/link`
- **Description**: This endpoint is called when a user attempts to link their Google account. The request body should contain the necessary information to link the account.
- **Request Body**: 
  - The body should include fields as specified in `EXTERNAL_APP_LINK_FIELDS`, which defaults to `client`, `username`, and `password`.
- **Response**: 
  - On success, the response will include a JWT token and a redirect URL for the user.
  - Example Response:
    ```json
    {
      "message": "Google email linked successfully.",
      "token": "<JWT_TOKEN>"
    }
    ```

### 3.2 Get External ID by Google Email

- **Endpoint**: `GET /googleauth/external-id/{googleEmail}`
- **Description**: This endpoint retrieves the external ID associated with a given Google email.
- **Path Parameter**: 
  - `googleEmail`: The email address of the Google account.
- **Response**: 
  - On success, the response will include an identifier if the account is linked.
  - Example Response:
    ```json
    {
      "identifier": "<userId>_<clientId>"
    }
    ```
  - If not linked:
    ```json
    {
      "identifier": null
    }
    ```

### 3.3 Get JWT by Google Email

- **Endpoint**: `GET /googleauth/get_jwt`
- **Description**: This endpoint retrieves a JWT token for a user based on their Google email, provided that the account is linked.
- **Query Parameter**: 
  - `googleEmail`: The email address of the Google account.
- **Response**: 
  - On success, the response will include a JWT token.
  - Example Response:
    ```json
    {
      "token": "<JWT_TOKEN>"
    }
    ```
  - If the user is not found:
    ```json
    {
      "error": "USER_NOT_FOUND"
    }
    ```

## 4. Error Handling

The external API calls should handle errors gracefully. If an error occurs during the API call, it should be logged, and an appropriate error message should be returned to the client. Common error scenarios include:

- User not found when attempting to get a JWT.
- Issues with linking accounts due to invalid credentials or other reasons.

## 5. Conclusion

This documentation provides a comprehensive overview of the external APIs required for the Google Login Auth server. The defined endpoints facilitate account linking and token retrieval, ensuring a smooth authentication process for users.