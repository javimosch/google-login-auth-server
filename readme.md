## Custom Google Login Integration POC

## **Overview**

This Proof of Concept (POC) implements a custom Google login integration that acts as an intermediary between an external application and Google authentication. It provides a seamless way to link Google accounts with existing user accounts in an external application.

## **Key Features**

1. Custom Google authentication flow
2. External user account linking
3. JWT generation for authenticated users
4. Popup-based authentication process

## **How It Works**

## **Authentication Flow**

1. User clicks a Google login button in the external application.
2. A popup window opens, loading a custom view from this project.
3. The custom view attempts to log in with Google.
4. The system checks if the Google email is already linked to an external user.
5. If linked:
    - The external JWT is generated.
    - The JWT is submitted to the parent app (external app).
    - Normal login via JWT is performed in the external app.
6. If not linked:
    - The custom view displays a form for external auth details (e.g., username/password).
    - User enters external auth details.
    - The system verifies the auth details with the external app.
    - User clicks a link button to associate their Google account with the external account.
    - The system links the accounts via an API route.
    - The external JWT is generated and submitted to the parent app.
    - Normal login via JWT is performed in the external app.

## **Implementation Details**

- Built with Node.js and Express
- Uses Google OAuth 2.0 for authentication
- Implements a custom view for the authentication process
- Manages token generation and user linking logic

## **API Routes**

1. **Verify External Auth**: Validates the external application's username and password.
2. **Link Google Account**: Associates a Google email with an external user account.
3. **Generate JWT**: Creates a JWT for the authenticated user.

## **Security Considerations**

- Implements HTTPS for all communications
- Uses secure popup window for authentication process
- Securely manages token exchange and user linking
- Implements proper error handling and logging

## **Setup and Configuration**

(Include steps for setting up the project, configuring Google OAuth, and integrating with the external application)

## **Usage**

1. Integrate the Google login button in your external application.
2. When clicked, open a popup window pointing to this project's custom authentication URL.
3. Handle the received JWT in your external application for user authentication.

## **Limitations**

- Currently supports only one external application
- Requires the external application to implement JWT-based authentication

## **Future Enhancements**

- Support for multiple external applications
- Additional authentication providers
- Enhanced error handling and user feedback

## Google API configuration

I follow the steps from Rclone Google drive configuration:

"Here is how to create your own Google Drive client ID for rclone"

https://rclone.org/drive/#:~:text=You%20can%20set%20up%20rclone%20with%20Google%20Drive#:~:text=You%20can%20set%20up%20rclone%20with%20Google%20Drive

Note: You can skip enabling the Google drive API.


## **Conclusion**

This POC demonstrates a flexible approach to integrating Google authentication with external user management systems. It provides a seamless user experience for linking Google accounts with existing user accounts in external applications.