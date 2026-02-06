# Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- Firebase project with Realtime Database
- Brevo account for email functionality

## Deployment Steps

### 1. Push to GitHub
Make sure your latest changes are pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Import to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository: `jfcanapati/Minima-Reports-Analytics`
4. Click "Import"

### 3. Configure Environment Variables
In the Vercel project settings, add these environment variables:

**Firebase Configuration:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

**Brevo Email API:**
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`

**Firebase Admin SDK:**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

### 4. Deploy
Click "Deploy" and wait for the build to complete.

### 5. Configure Domain (Optional)
- Go to Project Settings > Domains
- Add your custom domain if needed

## Post-Deployment

### Update Firebase Authentication
Add your Vercel domain to Firebase authorized domains:
1. Go to Firebase Console > Authentication > Settings
2. Add your Vercel domain (e.g., `your-app.vercel.app`) to Authorized domains

### Test the Deployment
1. Visit your Vercel URL
2. Test login/registration
3. Verify all features work correctly

## Automatic Deployments
Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every pull request

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Verify all environment variables are set correctly

### Authentication Issues
- Ensure Firebase authorized domains include your Vercel domain
- Check Firebase configuration in environment variables

### Email Not Working
- Verify Brevo API key is correct
- Check Brevo sender email is verified

## Useful Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from CLI
vercel

# Deploy to production
vercel --prod
```

## Support
For issues, check:
- Vercel Dashboard: https://vercel.com/dashboard
- Firebase Console: https://console.firebase.google.com
- Brevo Dashboard: https://app.brevo.com
