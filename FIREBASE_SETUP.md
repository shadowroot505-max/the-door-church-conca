# Guide: Configuring Firebase Backend

To make your website's authentication and database work correctly, you need to enable these features in your [Firebase Console](https://console.firebase.google.com/).

## 1. Enable Google Authentication
1. Go to your project in the **Firebase Console**.
2. Click on **"Authentication"** in the left sidebar.
3. Click the **"Get Started"** button (if you haven't already).
4. Go to the **"Sign-in method"** tab.
5. Click **"Add new provider"** and select **"Google"**.
6. Switch the toggle to **"Enable"**.
7. Provide a **"Project support email"** (your Gmail address) and click **"Save"**.

## 2. Set Up Cloud Firestore
1. Click on **"Firestore Database"** in the left sidebar.
2. Click the **"Create database"** button.
3. Choose a location (e.g., `nam5 (us-central)`) and click **"Next"**.
4. Select **"Start in production mode"** and click **"Create"**.

### 3. Firebase Storage (For Sermon Video Uploads)
1. Go to **Storage** in the Firebase Console and click **Get Started**.
2. Click **Next** and **Done**.
3. Go to the **Rules** tab and set them to:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /sermons/{allPaths=**} {
      // Allow anyone to read
      allow read: if true;
      // Only allow the admin to upload
      allow write: if request.auth != null && request.auth.token.email == 'shadowroot505@gmail.com';
    }
  }
}
```

### 4. Firestore Security Rules (VERY IMPORTANT)
Your app needs permission to read and write data. You must update the rules to allow the contact form to save messages and let you read them as an admin.

1. In the Firestore tab, click on **"Rules"**.
2. Replace the existing rules with the following code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow anyone to submit a contact message
    match /messages/{messageId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null && request.auth.token.email == "shadowroot505@gmail.com";
    }
    
    // Site settings, sermons, and events:
    // Anyone can read, only the admin can modify
    match /{collection}/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == "shadowroot505@gmail.com";
    }
  }
}
```
3. Click **"Publish"**.

## 4. Troubleshooting
- **Unauthorized Admin**: Ensure the email address in the security rules matches the one you use to sign in.
- **Form Submission Error**: If messages don't save, check the "Data" tab in Firestore to see if the `messages` collection is being created.
