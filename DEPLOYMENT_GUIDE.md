# Deployment Guide - Narrativee

Complete guide for deploying backend to AWS and frontend to Vercel using GitHub Actions CI/CD.

---

## Overview

- **Backend**: AWS EC2 (Node.js + Express)
- **Frontend**: Vercel (Next.js)
- **CI/CD**: GitHub Actions (auto-deploy on push to main)

---

## Prerequisites

### AWS EC2 Setup

1. **Launch EC2 Instance**:
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t2.micro (free tier) or t3.small (recommended)
   - Security group: Allow ports 22 (SSH), 3002 (API), 80/443 (if using nginx)

2. **SSH into EC2**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js via nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   nvm use 18

   # Install pnpm
   npm install -g pnpm

   # Install PM2 (process manager)
   npm install -g pm2

   # Install nginx (optional, for reverse proxy)
   sudo apt install nginx -y
   ```

4. **Create App Directory**:
   ```bash
   mkdir -p ~/narrativee-backend
   cd ~/narrativee-backend
   ```

5. **Setup Environment Variables**:
   ```bash
   nano .env
   ```

   Add:
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/db
   BETTER_AUTH_SECRET=your_secret_key
   BETTER_AUTH_URL=https://your-frontend.vercel.app
   OPEN_ROUTER_KEY=your_openrouter_key
   GROK_API_KEY=your_grok_key
   FRONTEND_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   PORT=3002
   ```

6. **Configure PM2 to Load .env**:
   ```bash
   nano ecosystem.config.js
   ```

   Add:
   ```javascript
   module.exports = {
     apps: [{
       name: 'narrativee-backend',
       script: './dist/index.js',
       env_file: '.env',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
     }]
   };
   ```

7. **Setup PM2 Startup**:
   ```bash
   pm2 startup
   # Follow the command it outputs
   ```

### Vercel Setup

1. **Install Vercel CLI** (locally):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link Project**:
   ```bash
   cd apps/web
   vercel link
   ```

4. **Set Environment Variables** (Vercel Dashboard):
   - Go to your project settings
   - Add environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-ec2-ip:3002
     BETTER_AUTH_SECRET=your_secret_key
     BETTER_AUTH_URL=https://your-project.vercel.app
     DATABASE_URL=postgresql://...
     ```

---

## GitHub Secrets Setup

Add these secrets in GitHub: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Backend Deployment Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `EC2_SSH_KEY` | Private SSH key for EC2 | Contents of your `.pem` file |
| `EC2_HOST` | EC2 public IP or hostname | `12.34.56.78` |
| `EC2_USER` | EC2 username | `ubuntu` (for Ubuntu AMI) |

**To get your SSH key**:
```bash
cat your-key.pem
# Copy entire output including BEGIN/END lines
```

### Frontend Deployment Secrets

| Secret Name | Description | How to Get |
|------------|-------------|-----------|
| `VERCEL_TOKEN` | Vercel authentication token | [Account Settings → Tokens](https://vercel.com/account/tokens) |

---

## GitHub Actions Workflows

### Backend Workflow (`.github/workflows/deploy-backend.yml`)

**Triggers**:
- Push to `main` branch with changes in `apps/backend/**`
- Manual trigger via GitHub UI

**Steps**:
1. Checkout code
2. Setup Node.js 18
3. Install pnpm
4. Install dependencies
5. Build TypeScript
6. SSH deploy to EC2
7. Install production dependencies on EC2
8. Restart PM2 process

### Frontend Workflow (`.github/workflows/deploy-frontend.yml`)

**Triggers**:
- Push to `main` branch with changes in `apps/web/**`
- Manual trigger via GitHub UI

**Steps**:
1. Checkout code
2. Setup Node.js 18
3. Install Vercel CLI
4. Pull Vercel environment info
5. Build project
6. Deploy to Vercel

---

## Manual Deployment (First Time)

### Backend (EC2)

```bash
# On your local machine
cd apps/backend
pnpm build

# Transfer to EC2
scp -i your-key.pem -r dist/ package.json pnpm-lock.yaml ubuntu@your-ec2-ip:~/narrativee-backend/

# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install and start
cd ~/narrativee-backend
pnpm install --prod
pm2 start ecosystem.config.js
pm2 save
```

### Frontend (Vercel)

```bash
cd apps/web
vercel --prod
```

---

## Nginx Reverse Proxy (Optional but Recommended)

Setup nginx to proxy requests and enable SSL:

```bash
sudo nano /etc/nginx/sites-available/narrativee
```

Add:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/narrativee /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

---

## Testing the Pipeline

1. **Make a change**:
   ```bash
   # Edit something in apps/backend
   echo "// test" >> apps/backend/src/index.ts
   ```

2. **Commit and push**:
   ```bash
   git add .
   git commit -m "test: trigger deployment"
   git push origin main
   ```

3. **Watch GitHub Actions**:
   - Go to your repo → **Actions** tab
   - Watch the workflow run

4. **Verify deployment**:
   ```bash
   # Backend
   curl https://your-ec2-ip:3002/health

   # Frontend
   curl https://your-project.vercel.app
   ```

---

## Monitoring & Logs

### Backend Logs (PM2)

```bash
# Real-time logs
pm2 logs narrativee-backend

# Last 100 lines
pm2 logs narrativee-backend --lines 100

# Error logs only
pm2 logs narrativee-backend --err

# PM2 status
pm2 status

# Detailed info
pm2 info narrativee-backend
```

### Frontend Logs (Vercel)

- Go to Vercel Dashboard → Your Project → **Logs**
- Or use CLI: `vercel logs`

---

## Rollback

### Backend

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Restore from previous deployment
cd ~/narrativee-backend
git checkout HEAD~1  # Or specific commit
pnpm install --prod
pm2 restart narrativee-backend
```

### Frontend

```bash
# Via Vercel Dashboard
# Go to Deployments → Find previous deployment → Promote to Production

# Or via CLI
vercel rollback
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs narrativee-backend --err

# Check if port is in use
sudo lsof -i :3002

# Restart PM2
pm2 restart narrativee-backend

# Check environment variables
pm2 env narrativee-backend
```

### GitHub Actions Failing

**SSH Connection Issues**:
- Verify `EC2_SSH_KEY` has correct format (including BEGIN/END lines)
- Check EC2 security group allows SSH from GitHub IPs
- Test SSH manually: `ssh -i key.pem ubuntu@your-ec2-ip`

**Build Failures**:
- Check workflow logs in GitHub Actions tab
- Ensure dependencies are in `package.json`
- Test build locally: `pnpm build`

### CORS Errors

Update backend CORS configuration:

```typescript
// apps/backend/src/index.ts
app.use(cors({
  origin: [
    'https://your-project.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

### Database Connection Issues

- Verify `DATABASE_URL` in EC2 `.env`
- Check Supabase allows connections from EC2 IP
- Test connection: `psql $DATABASE_URL`

---

## Production Checklist

Before going live:

- [ ] Database migrations run successfully
- [ ] Environment variables set on EC2 and Vercel
- [ ] SSL certificate configured (nginx + certbot)
- [ ] PM2 startup script enabled
- [ ] CORS configured for production domain
- [ ] GitHub secrets added
- [ ] Test full user flow (signup, generate report, chat)
- [ ] Monitor logs for errors
- [ ] Setup monitoring (optional: DataDog, New Relic)
- [ ] Configure domain DNS (A record → EC2 IP)
- [ ] Test anonymous user limit (1 report)
- [ ] Test free user tokens (50 tokens)
- [ ] Verify chat requires authentication

---

## Cost Estimation

### AWS EC2

| Instance Type | vCPU | RAM | Cost/month |
|--------------|------|-----|-----------|
| t2.micro (free tier) | 1 | 1 GB | $0 (first year) |
| t3.small | 2 | 2 GB | ~$15/month |
| t3.medium | 2 | 4 GB | ~$30/month |

### Vercel

- **Hobby**: Free (good for MVP)
- **Pro**: $20/month (custom domains, analytics)

### Total Estimated Cost

- **MVP**: $0-15/month (free EC2 + free Vercel)
- **Production**: $30-50/month (t3.small + Vercel Pro)

---

## Scaling Considerations

When you need to scale:

1. **Backend**:
   - Upgrade to t3.medium or larger
   - Use AWS Application Load Balancer
   - Deploy multiple EC2 instances
   - Consider AWS ECS/Fargate for containers

2. **Frontend**:
   - Vercel handles auto-scaling
   - Upgrade to Pro/Enterprise for higher limits

3. **Database**:
   - Upgrade Supabase plan
   - Enable connection pooling
   - Add read replicas

---

## Support

For issues:
- Check GitHub Actions logs
- Review PM2 logs on EC2
- Check Vercel deployment logs
- Test API endpoints manually

**Common Commands**:
```bash
# Restart backend
ssh ubuntu@ec2-ip "pm2 restart narrativee-backend"

# Redeploy frontend
vercel --prod

# Check backend health
curl https://your-ec2-ip:3002/health
```

---

**Last Updated**: 2025-11-27
