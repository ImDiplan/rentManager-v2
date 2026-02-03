# GitHub Pages Deployment Guide

## ✅ Setup Complete

Your repository is now configured for GitHub Pages deployment. Here's what has been set up:

### Changes Made:

1. **Updated `vite.config.ts`** - Added base URL configuration for proper asset loading
2. **Created `.github/workflows/deploy.yml`** - GitHub Actions workflow for automatic deployment
3. **GitHub Actions will automatically build and deploy on push to main/master branch**

---

## 📋 Steps to Deploy

### 1. **Push your code to GitHub**
```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

### 2. **Enable GitHub Pages in Repository Settings**
   - Go to your repository on GitHub.com
   - Navigate to **Settings** → **Pages**
   - Under "Build and deployment":
     - **Source**: Select "GitHub Actions"
     - This tells GitHub to use the deployment workflow
   - Click **Save**

### 3. **Configure your deployment URL** (if using a custom domain or subfolder)

#### Option A: Repository Name as Base Path
If your repo is named something other than a simple domain (e.g., `hogar-gestionado`), update `vite.config.ts`:
```typescript
base: "/hogar-gestionado/"  // Replace with your repo name
```

#### Option B: Using a Custom Domain
If using a custom domain:
1. Add a `CNAME` file to the `public/` folder with your domain name
2. Update `vite.config.ts`:
```typescript
base: "/"
```
3. Configure DNS records to point to GitHub Pages

#### Option C: User/Organization Pages
If deploying to `username.github.io`:
- Use `base: "/"` in vite.config.ts
- The repo must be named `username.github.io`

---

## 🚀 How It Works

1. **Automatic Deployment**: When you push to `main` or `master` branch, GitHub Actions:
   - Checks out your code
   - Installs dependencies with `npm ci`
   - Builds the project with `npm run build`
   - Uploads the `dist/` folder to GitHub Pages

2. **Pull Requests**: The workflow also runs on pull requests to verify builds work

3. **Deployment Status**: Check the progress under:
   - Repository → **Actions** tab
   - Look for the "Deploy to GitHub Pages" workflow

---

## 📝 Important Notes

### Routing (Single Page Application)
This app uses React Router for client-side routing. GitHub Pages serves static files, so:
- Update your Router's `basename` if needed based on your deployment URL
- If deploying to `https://username.github.io/repo-name/`, set router basename to `/repo-name/`

Example in your routing setup:
```typescript
<BrowserRouter basename="/hogar-gestionado">
  {/* routes */}
</BrowserRouter>
```

### Environment Variables
For Supabase and other environment variables:
1. Create `.env.production` file locally (don't commit it)
2. Add GitHub Secrets for production values:
   - Go to Settings → Secrets and variables → Actions
   - Add your Supabase credentials and other secrets
3. Update workflow file if you need environment variables

---

## 🔍 Deployment Check

After pushing, verify deployment:

1. **Check workflow status**:
   - Go to Actions tab in GitHub
   - You should see "Deploy to GitHub Pages" workflow running
   - Wait for it to complete (usually 1-2 minutes)

2. **Access your site**:
   - **Default**: `https://yourusername.github.io/repo-name`
   - **Custom domain**: Your configured domain

3. **View deployment info**:
   - Go to Settings → Pages
   - You'll see the deployment URL and status

---

## 🐛 Troubleshooting

### Build fails
- Check the Actions tab for error details
- Ensure all dependencies are listed in `package.json`
- Verify `npm run build` works locally first

### Site shows 404
- Check the `base` URL in `vite.config.ts` matches your deployment path
- Verify deployment completed successfully in Actions tab
- Clear browser cache and try again

### Blank page loads
- Check browser console for errors (F12 → Console)
- Ensure the correct base path is set in vite config
- Verify the deployment URL is correct

---

## 📦 Local Preview

To test your build locally before deploying:
```bash
npm run build
npm run preview
```

This runs the production build locally on port 4173.

---

## ✨ Next Steps

1. Update your `base` path in `vite.config.ts` if needed
2. Push your code to GitHub
3. Enable GitHub Pages in repository settings
4. Check the Actions tab to verify deployment
5. Access your live site!

For more details, see [GitHub Pages Documentation](https://pages.github.com/)
