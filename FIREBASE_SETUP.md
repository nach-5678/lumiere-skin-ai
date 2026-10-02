# Firebase Setup

This project uses Firebase for Authentication and Firestore Database.

## Setup Instructions

1.  **Firebase Project**: A Firebase project has been automatically provisioned for you.
2.  **Configuration**: The configuration is stored in `firebase-applet-config.json`.
3.  **Authentication**:
    *   **Email/Password**: Enabled by default.
    *   **Google Login**: You need to enable Google Sign-In in the Firebase Console.
        *   Go to [Firebase Console](https://console.firebase.google.com/).
        *   Select your project.
        *   Go to **Authentication** > **Sign-in method**.
        *   Enable **Google**.
        *   Follow the instructions to set up your support email.
        *   **Important**: If you are running this app locally or on a new domain, add the domain to **Authorized Domains** in the Authentication settings.

## Firestore Rules

The Firestore rules are defined in `firestore.rules` and have been deployed. They ensure:
*   Users can only read/write their own profile data.
*   Users can only read/write their own scan data.
*   Data validation is enforced for all writes.

## Data Structure

*   **users/{userId}**: Stores user profile information.
*   **scans/{scanId}**: Stores skin analysis scans.
