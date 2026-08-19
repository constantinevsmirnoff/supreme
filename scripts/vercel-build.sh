#!/usr/bin/env sh
set -e
# With CONVEX_DEPLOY_KEY (set in Vercel → Environment Variables), deploy functions and
# inject VITE_CONVEX_URL into the Vite build. Without it, only Vite runs — set
# VITE_CONVEX_URL in Vercel and deploy Convex separately.
if [ -n "${CONVEX_DEPLOY_KEY}" ]; then
  exec npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL
else
  echo "CONVEX_DEPLOY_KEY not set; running npm run build only (set VITE_CONVEX_URL in Vercel if using Convex)."
  exec npm run build
fi
