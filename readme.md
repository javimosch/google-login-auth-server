## Custom SSO Login Integration POC

## **Overview**

This Proof of Concept (POC) implements a custom SSO login integration that acts as an intermediary between an external application and some idp provider such as Google/Gitlab or other OpenID idp. It provides a seamless way to link idp accounts with existing user accounts in an external application (i.g Geored/Styx/Ecobox)

## **Key Features**

1. Custom SSO authentication flow
2. External user account linking
3. JWT generation for authenticated users
4. Popup-based authentication process

## **How It Works**

## **Authentication Flow**

1. User clicks an idp login button in the external application.
2. A popup window opens, loading a custom view from this project.
3. The custom view attempts to log in with idp.
4. The system checks if the idp email is already linked to an external user.
5. If linked:
    - The external JWT is generated.
    - The external JWT is submitted to the parent app along with a redirect URL.
    - The parent app decides whether to redirect to the external app or use the JWT directly.
6. If not linked:
    - The custom view displays a form for external auth details (e.g., username/password).
    - User enters external auth details.
    - The system verifies the auth details with the external app.
    - User clicks a link button to associate their idp account with the external account.
    - The system links the accounts via an API route.
    - The external JWT is generated and submitted to the parent app along with a redirect URL.
    - The parent app decides whether to redirect to the external app or use the JWT directly.

## **Implementation Details**

- Built with Node.js and Express
- Uses idp OpenID for authentication
- Implements a custom view for the authentication process
- Manages token generation and user linking logic

## **API Routes**

See external-apis.md or external-app folder for example.

## **Security Considerations**

- Implements HTTPS for all communications
- Uses secure popup window for authentication process
- Securely manages token exchange and user linking
- Implements proper error handling and logging

## **Setup and Configuration**

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Google OAuth by creating a project in the Google Developer Console and obtaining the necessary credentials.
4. Create a `.env` file in the root directory using `env.md` as a template and add your environment variables:
   ```
   cp env.md .env
   ```

5. External applications have a config file apps.yml, but sesitive envs can be overriden using the .env file

```bash
# {APPID}__{ENVNAME}
GEORED__EXTERNAL_APP_API_KEY=secret
```

## **Usage**

1. Integrate the idp login button in your external application. See useOpenIdPopupLogin inside views/index.ejs

2. When clicked, open a popup window pointing to this project's custom authentication URL.

3. Handle the received JWT in your external application for user authentication.

## **Installation**

To install the application, follow the steps in the Setup and Configuration section. Ensure that you have Node.js and npm installed on your machine.

## **Development**

To run the application in development mode, use the following command:
```bash
npm run dev
```
This will start both the external application and the main server using nodemon for hot reloading.

## **Deployment**

To deploy the application, build the Docker image and push it to your Docker repository using the `publish.sh` script:
```bash
./publish.sh
```
Ensure that your Docker environment is properly set up before running this command.

## **Limitations**

- Currently supports only one external application
- Requires the external application to implement JWT-based authentication

## **Future Enhancements**

- Support for multiple external applications
- Additional authentication providers
- Enhanced error handling and user feedback

## Google idp/openid configuration

I follow the steps from Rclone Google drive configuration:

"Here is how to create your own Google Drive client ID for rclone"

https://rclone.org/drive/#:~:text=You%20can%20set%20up%20rclone%20with%20Google%20Drive#:~:text=You%20can%20set%20up%20rclone%20with%20Google%20Drive

Note: You can skip enabling the Google drive API.

## Gitlab idp/openid configuration

https://docs.gitlab.com/ee/integration/oauth_provider.html

## **Conclusion**

This POC demonstrates a flexible approach to integrating openid authentication with external user management systems. It provides a seamless user experience for linking idp accounts (i.g Google/Gitlab/Veolia-openid) with existing user accounts in external applications. (Geored/Styx/Ecobox)