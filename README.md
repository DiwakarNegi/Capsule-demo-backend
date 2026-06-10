# Sirhaana Services

NestJS backend for the Sirhaana AI product-image pipeline. Accepts a raw product photo and returns 4 lifestyle/studio variants with the product identity preserved, using Gemini 2.5 Flash for vision analysis and `gemini-2.5-flash-image` (true image-to-image editing) for scene generation.

---

## Prerequisites

- **Node.js 18+** and npm
- **MySQL 8+** running locally (or a remote host)
- **Redis** running locally (default port 6379)
- **Google Cloud account** with Vertex AI enabled (see section below)
- **gcloud CLI** installed — [install guide](https://cloud.google.com/sdk/docs/install)

---

## 1. Clone and install

```bash
git clone <repo-url>
cd sirhaana-services-develop
npm install
```

---

## 2. Environment variables

Copy the example and fill in every value:

```bash
cp .env.example .env
```

If `.env.example` doesn't exist, create `.env` from scratch with the variables below.

### App

```env
APP_NAME=sirhaana-services
APP_PORT=6000
APP_ENV=local                         # local | development | production
APP_DEBUG=true
APP_URL=http://localhost:6000
ACTIVATE_OTP=false
USER_DELETION_PROMPT=some-prompt-string
```

### Database (MySQL)

```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=sirhaana
```

### Redis

```env
CACHE_HOST=localhost
CACHE_PORT=6379
CACHE_USERNAME=
CACHE_PASSWORD=
CACHE_SENDER=0
CACHE_PREFIX=
```

### JWT

```env
JWT_SECRET=a-long-random-secret-at-least-12-chars
JWT_TTL=1h
```

### AI — Vertex AI / Gemini (required for image generation)

```env
GOOGLE_CLOUD_PROJECT=your-gcp-project-id    # see Section 3 below
GEMINI_MODEL_TEXT=gemini-2.5-flash
GEMINI_MODEL_NANO_BANANA=gemini-2.5-flash-image
GEMINI_API_KEY=                              # leave blank — app uses ADC, not an API key
```

### File storage (local disk — AWS vars are required by validation but not actually used)

```env
AWS_REGION=ap-south-1
AWS_BUCKET=sirhaana
AWS_KEY_ID=placeholder
AWS_KEY_SECRET=placeholder
```

> Uploaded and generated images are stored under `uploads/` in the project root. No real S3 bucket is needed.

### Super admin seed values

```env
SUPER_ADMIN_UUID=super-admin
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_COUNTRY_CODE=+91
SUPER_ADMIN_MOBILE_NUMBER=9999999999
```

### SMTP (required by schema — use any values for local dev if you don't need email)

```env
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=you@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SENDER=you@gmail.com
```

### SMS — MSG91 (required by schema)

```env
MSG91_HOST=https://api.msg91.com
MSG91_AUTHKEY=your-msg91-authkey
MSG91_TEMPLATE_ID=your-template-id
```

---

## 3. Google Cloud setup (Vertex AI)

The AI pipeline calls Vertex AI via **Application Default Credentials (ADC)** — no API key is needed. The steps below take about 5 minutes.

### Step 1 — Create or pick a project

Go to [console.cloud.google.com](https://console.cloud.google.com), open the project dropdown at the top, and either create a new project or pick an existing one.

Copy the **Project ID** (not the project name — the ID looks like `my-project-123456` or `sirhaana-ai`). This goes in `GOOGLE_CLOUD_PROJECT`.

### Step 2 — Enable the Vertex AI API

In the console, go to **APIs & Services → Library**, search for **Vertex AI API**, and click **Enable**.

Or run:

```bash
gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
```

### Step 3 — Authenticate with gcloud (developer machine)

```bash
gcloud auth login                                    # signs in your Google account
gcloud auth application-default login               # sets up ADC credentials the app reads
gcloud config set project YOUR_PROJECT_ID           # sets the active project
```

After running `application-default login`, a credentials JSON is written to:
- **Mac/Linux**: `~/.config/gcloud/application_default_credentials.json`
- **Windows**: `%APPDATA%\gcloud\application_default_credentials.json`

The `@langchain/google-vertexai` library automatically picks this up — nothing else needed.

### Step 4 — Verify your project ID

```bash
gcloud projects list
```

Find your project in the list. The value in the **PROJECT_ID** column is what goes in `GOOGLE_CLOUD_PROJECT`.

### Alternative — service account key (for CI or shared machines)

If you need credentials that aren't tied to your personal account:

1. Go to **IAM & Admin → Service Accounts** → Create service account
2. Grant it the **Vertex AI User** role
3. Create a JSON key and download it
4. Set the env var:

```env
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json
```

The app will use this file automatically instead of the gcloud ADC file.

### Models used

| Variable | Value | What it does |
|---|---|---|
| `GEMINI_MODEL_TEXT` | `gemini-2.5-flash` | Vision analysis, product description, output verification |
| `GEMINI_MODEL_NANO_BANANA` | `gemini-2.5-flash-image` | Image-to-image scene editing |

Both models are in the `us-central1` region — make sure your project has quota there (it does by default).

---

## 4. Database setup

### Create the database

```sql
CREATE DATABASE sirhaana CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Run migrations

```bash
npm run migrate:up
```

### Seed initial data (categories, prompts, brand)

```bash
npm run seed:local
```

This seeds product categories, all AI system prompts, and a demo brand. It is idempotent — safe to run multiple times.

### Seed roles and super admin

```bash
npm run cli -- init:super-admin
```

---

## 5. Run the app

```bash
# development (watch mode — restarts on file changes)
npm run start:dev

# production
npm run build
npm run start:prod
```

The server starts on `http://localhost:6000` (or whatever `APP_PORT` is set to).

---

## 6. Key endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/ai/process-inventory` | Upload a product photo → generate 4 lifestyle variants |
| `POST` | `/v1/media/upload` | Pre-signed upload URL for images |
| `GET` | `/v1/media/file/:key` | Serve a stored image |
| `POST` | `/v1/ai/capsules/generate` | Room redesign (Capsule feature) |

### Process inventory payload

```json
{
  "imageKeys": ["uploads/your-image-key"],
  "commerceCategory": "lifestyle",
  "supportingText": "optional vendor note about the product",
  "productWidth": 150,
  "productLength": 150,
  "productDimensionUnit": "cm"
}
```

`productWidth`, `productLength`, and `productDimensionUnit` are optional. When provided, the AI gets an explicit aspect-ratio anchor which prevents it from stretching or squashing the product in the generated scenes.

---

## 7. Skipping image generation during development

Set `MOCK_IMAGE_GEN=true` in `.env` to skip all Gemini calls and return the uploaded image keys directly. Useful when testing the API plumbing without burning credits.

```env
MOCK_IMAGE_GEN=true
```

---

## 8. Troubleshooting

**`Error: Could not load the default credentials`**
Run `gcloud auth application-default login` and make sure `GOOGLE_CLOUD_PROJECT` is set correctly.

**`RESOURCE_EXHAUSTED` / 429 from Vertex AI**
The `gemini-2.5-flash-image` model has per-minute quota limits. The pipeline has built-in retry with 30-second backoff and 12-second inter-call delays. If you consistently hit limits, wait a minute and retry, or request a quota increase in the GCP console under **IAM & Admin → Quotas**.

**`No categories found. Please seed categories.`**
Run `npm run seed:local` — the categories table is empty.

**`Prompts not defined` / AI returns generic output**
Run `npm run seed:local` — system prompts are missing from the DB.

**MySQL connection refused**
Make sure MySQL is running and `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are correct in `.env`.

**Redis connection refused**
Make sure Redis is running on `CACHE_HOST:CACHE_PORT`.
