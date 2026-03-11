# f-drop - Temporary File Drop Service

**f-drop** is a fast, serverless temporary file dropping service built entirely on Cloudflare Workers and Cloudflare R2 storage. It features a modern web UI, secure upload passwords, and email notifications for shared files via Resend.

## Features
- **Serverless Architecture:** Runs on the edge using Cloudflare Workers.
- **Persistent Storage:** Files are safely stored in Cloudflare R2.
- **Secure Uploads:** Uploads are protected by an environment-level password.
- **Email Notifications:** Optionally send download links via email using the Resend API.
- **Drag-and-Drop UI:** A clean, responsive frontend built directly into the worker response.
- **Shareable Links:** Easily copy and share direct download links.

## Architecture
- **Runtime:** Cloudflare Workers (Node.js/JavaScript ES Modules).
- **Storage:** Cloudflare R2 (`f-drop-bucket`).
- **Email Provider:** Resend HTTP API.
- **Routing:** Custom domain routing (`f-drop.moltbot.de5.net`).

## Setup & Local Development

### Prerequisites
1. [Node.js](https://nodejs.org/) installed.
2. A Cloudflare account with R2 enabled.
3. A [Resend](https://resend.com) account (for email functionality).
4. Wrangler CLI installed (`npm install -g wrangler`).

### Installation
1. Clone the repository and navigate into the project directory:
   ```bash
   cd f-drop
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

### Configuration
1. **Create an R2 Bucket:**
   ```bash
   npx wrangler r2 bucket create f-drop-bucket
   ```
2. **Update `wrangler.toml`:**
   Ensure the custom domain and R2 bucket bindings match your Cloudflare environment.
3. **Set Secrets:**
   You must securely store the upload password and the Resend API key in Cloudflare.
   ```bash
   npx wrangler secret put UPLOAD_PASSWORD
   npx wrangler secret put RESEND_API_KEY
   ```
   *(During local development, you can create a `.dev.vars` file at the root of the project with these variables).*

### Running Locally
To test the worker locally with a simulated R2 bucket:
```bash
npm run dev
```

## Deployment
To deploy the worker to your Cloudflare production environment:
```bash
npm run deploy
```

## API Endpoints

While the service provides a web UI, it can also be interacted with programmatically.

### Upload a File
- **Endpoint:** `POST /upload`
- **Body:** `multipart/form-data`
  - `file`: The file to upload.
  - `password`: The secure upload password (Required).
  - `email`: An optional email address to send the download link to.
- **Success Response:**
  ```json
  {
    "success": true,
    "id": "m0xk2-8f4v1",
    "name": "example.txt",
    "emailSent": true,
    "emailError": null
  }
  ```

### Download a File
- **Endpoint:** `GET /download/:id`
- **Response:** The raw file stream with the `Content-Disposition` header set to the original filename.

## Data Retention Note
Currently, files remain in the R2 bucket indefinitely. To implement true "temporary" storage, you should configure an **Object Lifecycle Rule** in the Cloudflare R2 dashboard to automatically delete files in `f-drop-bucket` that are older than your desired retention period (e.g., 1 day).