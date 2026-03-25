# Guide: Deploying to Render

This guide will walk you through the process of deploying your church website from GitHub to Render.

## Step 1: Create a Render Account
1. Go to [Render](https://render.com/) and sign up or log in.
2. Connect your **GitHub** account during the signup process.

## Step 2: Create a New Web Service
1. In your Render Dashboard, click the **"New +"** button and select **"Web Service"**.
2. Find the repository named `the-door-church-conca` in the list and click **"Connect"**.

## Step 3: Configure Your Service
1. **Name**: `door-church-website` (or any name you prefer).
2. **Region**: Choose the one closest to you (e.g., `Oregon (US West)` or `Frankfurt (EU Central)`).
3. **Branch**: `main`.
4. **Runtime**: `Node`.
5. **Build Command**: `npm install`
6. **Start Command**: `npm start`
7. **Instance Type**: Select the **"Free"** tier.

## Step 4: Set Environment Variables (CRITICAL)
Your site needs the Firebase configuration to work. You must add these manually:

1. Click on the **"Environment"** tab in the sidebar of your new Render service.
2. Click **"Add Environment Variable"**.
3. Copy each key and value from your local `.env` file:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
4. Click **"Save Changes"**.

## Step 5: Deploy
1. Click **"Deploy Web Service"** if it hasn't started already.
2. Wait for the build and deployment process to complete. 
3. Once the status turns to **"Live"**, you will see a URL (like `https://door-church-website.onrender.com`).

## Verification
1. Visit the URL provided by Render.
2. Test the **Contact Form** and ensure you can log in to the **Admin Dashboard** to see the messages.
