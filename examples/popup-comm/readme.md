# Popup Communication Example

This example demonstrates a simple HTML5 template that uses a popup window to facilitate communication between a main application and a popup window. The ultimate goal of this project is to pass a valid external application JWT (JSON Web Token) from an authentication server view (the popup) into the main application. Specifically, this example can be extended to work with services like GeoRev3.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [How it Works](#how-it-works)
- [Usage](#usage)
- [Security Considerations](#security-considerations)
- [Further Improvements](#further-improvements)

## Overview

In this example, we create a simple web page with a button that, when clicked, opens a popup window. The main application listens for messages sent from the popup, allowing us to send data back to the main page. The ultimate goal is to send a valid JWT back into an external application like GeoredV3 (When using an external google-auth/openId-auth server)

## Getting Started

To run this example, follow these steps:

1. Clone the repository or download the files.
2. Ensure you have a local web server running (as browser security may restrict file access).
3. Open `index.html` in your browser.

## How it Works

- **Main Application:** The main application (`index.html`) contains a button that triggers the `openPopup()` function. This function opens a new window (`popup.html`) with specified dimensions.
- **Popup Window:** The popup window can be set up to authenticate users and retrieve a valid JWT.
- **Message Passing:** The main application listens for messages from the popup using the `message` event listener. When a message is received, it displays the information in the main content area.
