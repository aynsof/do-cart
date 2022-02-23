// Worker

const frontendUrl = 'https://do-cart-frontend.pages.dev'

export default {
  async fetch(request, env) {
    return await handleRequest(request, env);
  },
};

async function handleRequest(request, env) {
  let url = new URL(request.url);

  // refer to object ID passed through query string
  const objId = url.searchParams.get("objectId");

  let id = env.CART.idFromName(objId);
  let obj = env.CART.get(id);
  let resp = await obj.fetch(request.url);
  let response = await resp.text();

  return new Response(response, {
    headers: {
      'Access-Control-Allow-Origin': frontendUrl
    }
  });

}

// Durable Object

export class Cart {
  constructor(state, env) {
    this.state = state;
    // `blockConcurrencyWhile()` ensures no requests are delivered until
    // initialization completes.
    this.state.blockConcurrencyWhile(async () => {
      let stored = await this.state.storage.get("cart");
      this.cart = stored || {};
    });
  }

  // Handle HTTP requests from clients.
  async fetch(request) {
    // Apply requested action.
    let url = new URL(request.url);
    const item = url.searchParams.get("item");
    const number = parseInt(url.searchParams.get("number"));

    let currentCart = this.cart;

    switch (url.pathname) {
      case "/add":
        // Check if item exists in cart
        if (item in this.cart) {
          // If exists, add number to current count
          this.cart[item] += number;
        } else {
          // If not, set current count to number
          this.cart[item] = number;
        }
        currentCart = this.cart;
        await this.state.storage.put("cart", this.cart);
        break;
      case "/remove":
        // If number would make item count less than zero
        // Or if item doesn't exist in the cart yet
        // Then set item count to zero
        if (this.cart[item] - number <= 0 || !(item in this.cart)) {
          delete this.cart[item];
        } else {
          this.cart[item] -= number;
        }
        currentCart = this.cart;
        await this.state.storage.put("cart", this.cart);
        break;
      case "/":
        // Just serve the current cart. No storage calls needed!
        break;
      default:
        return new Response("Not found", { status: 404 });
    }

    const resp = JSON.stringify(currentCart);

    // Return `currentCart`. Note that `this.cart` may have been
    // incremented or decremented by a concurrent request when we
    // yielded the event loop to `await` the `storage.put` above!
    // That's why we stored the counter cart created by this
    // request in `currentCart` before we used `await`.
    return new Response(resp);
  }
}
