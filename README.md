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

### Integration configuration

Create or update `.env.local` with the deployed LiquidityGuard stack configuration:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.liq-guard.io
NEXT_PUBLIC_RESERVE_POOL_ADDRESS=0xReservePool
NEXT_PUBLIC_POLICY_DISTRIBUTOR_ADDRESS=0xPolicyDistributor
NEXT_PUBLIC_USDC_ADDRESS=0xUsdc
NEXT_PUBLIC_LGUSD_ADDRESS=0xLgUsd              # optional; fetched from reserve when omitted
NEXT_PUBLIC_CHAIN_ID=11155111                  # expected chain for transactions (e.g. Sepolia)
NEXT_PUBLIC_CURVE_LP_ADDRESS=0xCurveLpToken
NEXT_PUBLIC_AAVE_LENDING_POOL_ADDRESS=0xAavePool
NEXT_PUBLIC_AAVE_COLLATERAL_ADDRESS=0xCollateralAsset
NEXT_PUBLIC_AAVE_CHAIN_ID=11155111             # optional override if DLP runs on a different chain
```

The front-end reads metadata from `NEXT_PUBLIC_API_BASE_URL`, requests signed quotes from the backend, and uses the configured contract addresses to approve USDC transfers, deposit into the reserve, and mint policies.

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
