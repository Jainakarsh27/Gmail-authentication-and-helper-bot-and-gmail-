# Guide: Setting up Google Cloud for MailSense AI

To enable Gmail login and reading features, you need to create OAuth 2.0 credentials in the Google Cloud Console.

### Step 1: Create a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** > **New Project**.
3. Name it `MailSense AI` and click **Create**.

### Step 2: Enable Gmail API
1. In the sidebar, go to **APIs & Services** > **Library**.
2. Search for "Gmail API" and click **Enable**.

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** and click **Create**.
3. Fill in:
   - App name: `MailSense AI`
   - User support email: (Your email)
   - Developer contact info: (Your email)
4. Click **Save and Continue** until the end.
5. **CRITICAL**: Go back to the OAuth consent screen and click **Publish App** (or add your test email under "Test users").

### Step 4: Create Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Application type: **Web application**.
4. Name: `MailSense Web`.
5. **Authorized redirect URIs**:
   - `http://localhost:8080/login/oauth2/code/google`
6. Click **Create**.

### Step 5: Save Credentials
You will get a **Client ID** and **Client Secret**. Please keep these ready! I will ask you to paste them into the `application.properties` file shortly.
