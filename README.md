# LiquidityGuard Frontend

Early-stage marketing site and application shell for the LiquidityGuard DeFi coverage protocol.

## Stack

- [Next.js 14](https://nextjs.org/) with the App Router
- React 18 + TypeScript
- Global styles via CSS with Inter and Space Grotesk fonts

## Getting started

```bash
npm install
npm run dev
```

The development server will be available at http://localhost:3000. Store environment variables such as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in a `.env.local` file.

### WalletConnect configuration

1. Create a project in the [WalletConnect Cloud](https://cloud.walletconnect.com/) and copy the Project ID.
2. Create a `.env.local` file in the project root and add:

   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

3. Restart the dev server so the new environment variable is picked up.

After connecting a wallet, the top-right button on the app page will display the truncated address. Clicking it again opens WalletConnect&apos;s account view where you can disconnect.

## Deploying to Vercel

1. Push this repository to GitHub (or another Git provider supported by Vercel).
2. Create a free Vercel account at https://vercel.com/ and choose **New Project**.
3. Import the repository and keep the defaults:
   - Framework: **Next.js**
   - Build command: `npm run build`
   - Output directory: `.next`
4. Click **Deploy** — Vercel will handle the build and provide a live URL.
5. After deployment you can set up preview branches, custom domains, and environment variables from the project dashboard.

When the wallet integrations are ready, add any required secrets as environment variables in Vercel (`Project Settings → Environment Variables`) and redeploy.
