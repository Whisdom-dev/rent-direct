# RentDirect - Connect Landlords & Tenants Directly

[![Deployed on Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-green?style=for-the-badge&logo=netlify)](https://www.netlify.com/)

## Overview

This is a rental platform that connects landlords and tenants directly, skipping agents for a more streamlined rental experience.

## Deployment

Your project is live at:

**[Netlify Deployment URL](https://rent-dyrrect.netlify.app/)**

## Environment Variables

Before deploying, you need to set up the following environment variables in your Netlify dashboard:

### Required Environment Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App Configuration
NEXT_PUBLIC_BASE_URL=https://your-domain.netlify.app
```

### How to Set Environment Variables in Netlify:

1. Go to your Netlify dashboard
2. Navigate to Site settings > Environment variables
3. Add each variable with its corresponding value
4. Redeploy your site

## How It Works

1. Clone or fork this repository.
2. Set up your environment variables in Netlify.
3. Push your changes to your repository.
4. Connect your repository to Netlify and deploy.
5. Netlify will automatically deploy the latest version from this repository.

---

Feel free to update the Netlify deployment URL above with your actual site link.
