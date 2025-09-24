# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Pinata Configuration
PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_GATEWAY_URL=your_gateway_domain.mypinata.cloud

# Reown AppKit Configuration
NEXT_PUBLIC_PROJECT_ID=your_project_id_here
```

## How to Get These Values

### 1. PINATA_JWT
1. Visit [Pinata Keys Page](https://app.pinata.cloud/developers/keys)
2. Click "New Key" in the top right
3. Select Admin privileges (recommended for development)
4. Give the key a name and click "Create Key"
5. Copy the **JWT** value (not the API Key or Secret)

### 2. NEXT_PUBLIC_GATEWAY_URL
1. Visit [Pinata Gateways Page](https://app.pinata.cloud/gateway)
2. Find your gateway domain (e.g., `aquamarine-casual-tarantula-177.mypinata.cloud`)
3. Copy the full domain name

### 3. NEXT_PUBLIC_PROJECT_ID
1. Visit [Reown Cloud](https://cloud.reown.com/)
2. Create a new project or use existing one
3. Copy the Project ID

## Example .env.local

```bash
# Pinata Configuration
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkYjY5YjQ4ZC1hYzQwLTRhYjctOTQ5ZC1hYzQwYzQwYzQwYzQwIiwidXNlcm5hbWUiOiJteS1hcHAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifSwiaWF0IjoxNjQwOTk5OTk5LCJleHAiOjE2NDA5OTk5OTl9.example_signature
NEXT_PUBLIC_GATEWAY_URL=aquamarine-casual-tarantula-177.mypinata.cloud

# Reown AppKit Configuration
NEXT_PUBLIC_PROJECT_ID=1234567890abcdef1234567890abcdef
```

## Important Notes

- **Never commit `.env.local` to version control**
- The `NEXT_PUBLIC_` prefix makes variables available in the browser
- Variables without this prefix are only available on the server side
- Restart your development server after changing environment variables

## Fallback Behavior

If `NEXT_PUBLIC_GATEWAY_URL` is not set, the application will fall back to using the public Pinata gateway (`gateway.pinata.cloud`). However, using your own gateway is recommended for better performance and reliability.
