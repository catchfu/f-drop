# f-drop - Temporary File Drop

## Project Overview

**f-drop** is a serverless application built using Cloudflare Workers. It provides a temporary file dropping service, allowing users to upload and download files through a web UI or API. 

### Architecture
- **Runtime:** Cloudflare Workers (Node.js/JavaScript ES Modules).
- **Storage:** Cloudflare R2 is configured in `wrangler.toml` (Bucket: `f-drop-bucket`, Binding: `f_drop_bucket`). 
- **Email:** Integrated with Resend API for sending optional email notifications containing download links.
- **Routing:** Configured to run on the custom domain `f-drop.moltbot.de5.net`.
- **API Endpoints:**
  - `GET /`: Returns the HTML UI for uploading/downloading.
  - `POST /upload`: Uploads a file to R2, checks the upload password, and optionally triggers a Resend email.
  - `GET /download/:id`: Retrieves a file stream from R2 using its unique ID.
- **Security:** Uploads are protected by an `UPLOAD_PASSWORD` environment variable.

## Building and Running

The project relies on `wrangler` for local development and deployment. 

### Key Commands
- **Run Local Development Server:**
  ```bash
  npm run dev
  # or
  npx wrangler dev
  ```
- **Deploy to Cloudflare:**
  ```bash
  npm run deploy
  # or
  npx wrangler deploy
  ```

### Secrets Management
The application relies on two sensitive secrets that must be managed via Cloudflare, not committed to the repository:
- `UPLOAD_PASSWORD`: Required to authenticate upload requests.
- `RESEND_API_KEY`: Required to send emails via the Resend API.

Add these via: `npx wrangler secret put <SECRET_NAME>`

## Development Conventions

- **Language:** JavaScript (`src/worker.js`). 
- **Worker Syntax:** Modern ES Modules syntax (`export default { async fetch(request, env, ctx) { ... } }`).
- **Data Deletion:** The worker does not handle file deletion. Instead, Cloudflare R2 Object Lifecycle Rules should be used to automatically clean up the bucket.
- **Email Verification:** To prevent Resend 403 Validation Errors, DNS records (SPF/DKIM/MX) must be properly configured in Cloudflare without duplicating the root domain name in the hostname fields.