# ABIS Frontend - Vercel Deployment Guide

## Prerequisites
1. Push your code to GitHub (frontend repository)
2. Create a Vercel account: https://vercel.com
3. Connect your GitHub account to Vercel

## Step 1: Update Frontend Configuration

### Update frontend/.env.production:
Create a new file `frontend/.env.production` with:
```
REACT_APP_API_URL=https://abis-backend.onrender.com/api/
REACT_APP_CLOUDINARY_CLOUD_NAME=dtormrsdd
REACT_APP_CLOUDINARY_DOCUMENTS_PRESET=abis_documents
REACT_APP_CLOUDINARY_BLOTTER_PRESET=abis_blotter
```

Replace `https://abis-backend.onrender.com` with your actual Render backend URL!

## Step 2: Deploy Frontend on Vercel

### Import Project:
1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Select your `ABIS-Frontend` GitHub repository
4. Click **"Import"**

### Configure Project:
1. **Framework Preset**: React
2. **Build Command**: `npm run build` (default)
3. **Output Directory**: `build` (default)
4. **Install Command**: `npm install` (default)

### Add Environment Variables:
1. Go to **"Environment Variables"** section
2. Add these variables:
   ```
   REACT_APP_API_URL=https://abis-backend.onrender.com/api/
   REACT_APP_CLOUDINARY_CLOUD_NAME=dtormrsdd
   REACT_APP_CLOUDINARY_DOCUMENTS_PRESET=abis_documents
   REACT_APP_CLOUDINARY_BLOTTER_PRESET=abis_blotter
   ```

3. Click **"Deploy"**

### Get Your Frontend URL:
After deployment, you'll get a URL like: `https://abis-frontend.vercel.app`

## Important Notes

### 1. Update Backend CORS Settings
After getting your Vercel URL, update backend `server.js`:
```javascript
const corsOptions = {
  origin: ['https://abis-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));
```

Then redeploy the backend!

### 2. Environment Variables
- **Never commit `.env` files**
- Always use platform's environment variable settings
- `.env.production` should be in `.gitignore` or have placeholder values

### 3. Update API URL
Make sure frontend is using the correct backend URL from Render

## Testing After Deployment

1. Visit your Vercel frontend URL
2. Try uploading a document/certificate
3. Check if it connects to Render backend
4. Verify Cloudinary uploads work

## Troubleshooting

### CORS errors?
- Update backend CORS settings with your Vercel URL
- Redeploy backend

### API 404 errors?
- Verify `REACT_APP_API_URL` is correct in Vercel env vars
- Check if backend is running on Render

### Free Tier Limitations:
- **Vercel Free**: Unlimited deployments, 6GB storage
- **Render Free**: Service spins down after 15 min inactivity

## Making Updates

After making code changes:

**Backend:**
```bash
git add .
git commit -m "Your message"
git push origin main
# Render auto-deploys on push
```

**Frontend:**
```bash
git add .
git commit -m "Your message"
git push origin main
# Vercel auto-deploys on push
```
