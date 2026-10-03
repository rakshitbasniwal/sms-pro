# Deploying SMS Pro on Vercel

This project has been pre-configured to deploy **both the frontend and backend together** on Vercel as a single repository.

## How it works
1. **Frontend**: Vercel uses `@vercel/static-build` to run `npm run build` inside the `frontend/` directory and serves the static files from `frontend/dist`.
2. **Backend**: Vercel uses `@vercel/node` to convert `backend/server.js` into a serverless function.
3. **Routing**: The root `vercel.json` file automatically routes all requests starting with `/api/` to the backend, and everything else to the React frontend.

---

## Step-by-Step Deployment Instructions

### 1. Push to GitHub
Ensure all your latest changes, including the `vercel.json` in the root directory and the updated `backend/server.js`, are pushed to your GitHub repository.

### 2. Import into Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... > Project**.
2. Import your GitHub repository.
3. Leave the **Root Directory** as `/` (the root of the repo).
4. Do NOT change the framework preset (Vercel will automatically read `vercel.json`).

### 3. Set Environment Variables
Before clicking deploy, you MUST add the following environment variables in the Vercel dashboard:
- `MONGO_URI`: Your MongoDB Atlas connection string.
- `JWT_SECRET`: Your secret key for authentication.
- `NODE_ENV`: Set to `production`.

*(You do not need to set `VITE_API_URL` or `CLIENT_URL` because they are served from the same domain, and API calls to `/api` will be seamlessly proxied to the backend).*

### 4. Deploy
Click **Deploy**! Vercel will build the frontend and set up the serverless function for the backend simultaneously.

---

## Important Considerations for Express on Vercel

1. **Cold Starts:** Since Vercel uses serverless functions, if your backend hasn't been accessed for a while, the first request might take a few seconds longer as the function "wakes up" and reconnects to MongoDB.
2. **Statelessness:** Serverless functions cannot store data in memory or on the filesystem between requests.
3. **Vite API Calls:** Ensure your frontend makes API calls to relative paths (e.g., `/api/auth/login`) instead of absolute URLs (`http://localhost...`) so that the `vercel.json` rewrites work correctly in production.
