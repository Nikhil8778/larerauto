export type CartItem = {
  offerId: string;
  title: string;
  partType: string;
  imageUrl: string;
  itemPrice: number;
  itemPriceCents: number;
  currency: string;
  quantity: number;
  year?: string;
  make?: string;
  model?: string;
  engine?: string;
  vin?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sourceChannel?: string;
};

const CART_KEY = "lareauto_cart";

function emitCartUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  emitCartUpdated();
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existingIndex = cart.findIndex((x) => x.offerId === item.offerId);

  if (existingIndex >= 0) {
    cart[existingIndex] = {
      ...cart[existingIndex],
      quantity: cart[existingIndex].quantity + item.quantity,
    };
  } else {
    cart.push(item);
  }

  saveCart(cart);
}

export function removeFromCart(offerId: string) {
  const cart = getCart().filter((item) => item.offerId !== offerId);
  saveCart(cart);
}

export function updateCartQty(offerId: string, quantity: number) {
  const cart = getCart().map((item) =>
    item.offerId === offerId
      ? { ...item, quantity: Math.max(1, quantity) }
      : item
  );
  saveCart(cart);
}

export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
  emitCartUpdated();
}