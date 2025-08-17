# Vercel Deployment Guide

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Git repository (GitHub, GitLab, or Bitbucket)
3. MetaMask wallet installed in users' browsers

## Deployment Steps

### 1. Push to Git Repository

```bash
git add .
git commit -m "Ready for Vercel deployment - MetaMask only"
git push origin main
```

### 2. Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect the configuration from `vercel.json`

### 3. Deploy

Click "Deploy" and Vercel will:
1. Install dependencies in the `gui` folder
2. Build the Vite application
3. Deploy the static files from `gui/dist`

No environment variables are required - the app uses MetaMask directly without any API keys.

## Local Testing

Before deploying, test locally:

```bash
cd gui
npm install
npm run build
npm run preview
```

## Configuration Details

The deployment is configured in:

### `/vercel.json` (root)
```json
{
  "rootDirectory": "gui",
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### `/gui/vercel.json`
```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## Features

- **MetaMask-only connection** - No API keys needed
- **Direct wallet integration** - Simple and secure
- **Lightweight build** - ~400KB vs 800KB+ with WalletConnect
- **Fast deployment** - No external dependencies

## Custom Domain

To add a custom domain:
1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS as instructed

## Troubleshooting

### Build Fails
- Check Node.js version (requires 18+)
- Verify all dependencies are installed
- Check build logs for specific errors

### MetaMask Connection Issues
- Ensure MetaMask is installed
- Check that the user is on the correct network (Polygon)
- Verify the app is served over HTTPS (automatic on Vercel)

### 404 Errors on Routes
The app is a single-page application. Vercel's Vite framework preset handles routing automatically.

## Network Configuration

The app connects to these networks:
- Polygon (Main network for trading)
- Ethereum Mainnet
- Arbitrum
- Optimism
- Base

Default RPC endpoints are used. No configuration needed.

## Live URL

Once deployed, your app will be available at:
- `https://[your-project-name].vercel.app`
- Or your custom domain if configured

## Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: For pull requests

## User Experience

Users will:
1. Visit your deployed site
2. Click "Connect MetaMask"
3. Approve the connection in MetaMask
4. Start trading prediction market positions

## Support

For issues specific to:
- Vercel deployment: https://vercel.com/docs
- Wagmi: https://wagmi.sh
- Vite: https://vitejs.dev