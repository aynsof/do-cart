# Durable Objects - Shopping Cart

Basic shopping cart implemented using Workers Durable Objects. For frontend code, see https://github.com/aynsof/do-cart-frontend.

## Deployment

Replace `account_id` and `zone_id` in `wrangler.toml`.
Update `Access-Control-Allow-Origin` in `src/index.mjs` with the domain of your frontend.
Run `wrangler publish`.