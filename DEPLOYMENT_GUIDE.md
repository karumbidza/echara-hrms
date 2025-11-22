# 🚀 Deploy ECHARA HRMS to Railway - Step by Step

## ✅ What We've Done:
- Created Railway configuration files
- Updated backend for production deployment
- Set up environment variables
- Initialized Git repository

---

## 📋 DEPLOYMENT STEPS:

### **Step 1: Create Railway Account** (2 minutes)
1. Go to: **https://railway.app**
2. Click **"Start a New Project"** or **"Login with GitHub"**
3. Sign up using your GitHub account (recommended)
4. You'll get **$5 free credit** to start

---

### **Step 2: Push Code to GitHub** (3 minutes)

**In VS Code Terminal, run these commands:**

```bash
# Create a new repository on GitHub first:
# Go to https://github.com/new
# Repository name: echara-hrms
# Keep it Private
# Don't initialize with README (we already have code)
# Click "Create repository"

# Then run these commands (replace YOUR_USERNAME with your GitHub username):
cd /Users/allen/projects/echara-hrms
git remote add origin https://github.com/YOUR_USERNAME/echara-hrms.git
git branch -M main
git push -u origin main
```

---

### **Step 3: Deploy Backend on Railway** (5 minutes)

1. **Go to Railway Dashboard**: https://railway.app/dashboard

2. **Create New Project**:
   - Click **"+ New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose **"echara-hrms"** repository
   - Railway will detect it automatically

3. **Configure Backend Service**:
   - Railway will try to deploy the whole project
   - Click on the service → **Settings**
   - **Root Directory**: Set to `backend`
   - **Start Command**: `npm run start:prod`

4. **Add PostgreSQL Database**:
   - In your project, click **"+ New"**
   - Select **"Database"** → **"Add PostgreSQL"**
   - Railway will create a database automatically
   - Copy the **DATABASE_URL** (you'll see it in Variables tab)

5. **Set Environment Variables**:
   - Click on your backend service
   - Go to **"Variables"** tab
   - Click **"+ Add Variable"** and add these:
   
   ```
   DATABASE_URL → (automatically added by Railway)
   JWT_SECRET → your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET → your-refresh-secret-key-change-this-in-production
   PORT → 5001
   NODE_ENV → production
   FRONTEND_URL → (we'll add this after deploying frontend)
   ```

6. **Deploy**:
   - Click **"Deploy"**
   - Wait 3-5 minutes for build to complete
   - Once done, click **"Settings"** → **"Generate Domain"**
   - Copy your backend URL (e.g., `https://echara-hrms-backend.up.railway.app`)

---

### **Step 4: Deploy Frontend on Vercel** (3 minutes)

1. **Go to Vercel**: https://vercel.com

2. **Import Project**:
   - Click **"Add New"** → **"Project"**
   - Connect your GitHub account
   - Select **"echara-hrms"** repository
   - Click **"Import"**

3. **Configure Build Settings**:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. **Add Environment Variable**:
   - Click **"Environment Variables"**
   - Add:
     ```
     REACT_APP_API_URL → https://YOUR-BACKEND-URL.up.railway.app/api
     ```
     (Use the Railway backend URL from Step 3)

5. **Deploy**:
   - Click **"Deploy"**
   - Wait 2-3 minutes
   - Once done, you'll get a URL like: `https://echara-hrms.vercel.app`

---

### **Step 5: Connect Frontend & Backend** (1 minute)

1. **Go back to Railway**:
   - Open your backend service
   - Go to **"Variables"**
   - Add/Update:
     ```
     FRONTEND_URL → https://YOUR-FRONTEND-URL.vercel.app
     ```
     (Use the Vercel URL from Step 4)

2. **Redeploy Backend**:
   - Click **"Deploy"** again to apply the new variable

---

### **Step 6: Test Your App!** 🎉

1. **Open your frontend URL** (from Vercel)
2. **Click "Register"**
3. **Fill in the form**:
   - Full Name: Your Name
   - Email: your@email.com
   - Password: SecurePass123
   - Company Name: Test Company
   - Currency: USD

4. **Submit** - Your account will be created!
5. **Login** with your credentials
6. **See your dashboard!**

---

## 🔍 Troubleshooting:

**Backend won't build?**
- Check Railway logs: Service → "Deployments" → Click latest → "View Logs"
- Make sure DATABASE_URL is set

**Frontend shows error?**
- Check if REACT_APP_API_URL is correct
- Make sure it ends with `/api`
- Redeploy on Vercel

**CORS error?**
- Make sure FRONTEND_URL is set in Railway backend
- It should match your Vercel URL exactly

**Database connection failed?**
- Railway's PostgreSQL URL should be automatically set
- Check if it's in the Variables tab

---

## 💰 Costs:

- **Railway**: $5 free credit (lasts ~1 month for testing)
  - After free credit: ~$5-10/month
- **Vercel**: Completely FREE for frontend
- **Total**: FREE to start, ~$5-10/month after trial

---

## 📱 Your Live URLs:

After deployment, you'll have:
- **Frontend**: `https://echara-hrms.vercel.app` (or similar)
- **Backend API**: `https://echara-hrms-backend.up.railway.app` (or similar)
- **Database**: Managed by Railway (automatic backups)

---

## 🎯 Next Steps After Deployment:

1. Test registration and login
2. Add your first employees
3. Explore the dashboard
4. Share the URL with your team!

---

Need help? Let me know which step you're on and I'll guide you through it!
