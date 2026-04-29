import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: string;
  cartItemId?: number;
  productId?: number;
  variantId?: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  quantity: number;
  prodpv?: number | null;
  brand?: string | null;
  manualCheckoutEnabled?: boolean;
  selectedColor?: string | null;
  selectedStyle?: string | null;
  selectedSize?: string | null;
  selectedType?: string | null;
  selectedSku?: string | null;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  selectedIds: string[];
}

const initialState: CartState = {
  items: [],
  isOpen: false,
  selectedIds: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, "quantity">>) => {
      const item = action.payload;
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
      if (!state.selectedIds.includes(item.id)) {
        state.selectedIds.push(item.id);
      }
      state.isOpen = true;
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      state.selectedIds = state.selectedIds.filter((id) => id !== action.payload);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>,
    ) => {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.id !== id);
        state.selectedIds = state.selectedIds.filter((value) => value !== id);
        return;
      }
      const item = state.items.find((i) => i.id === id);
      if (item) item.quantity = quantity;
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    toggleCartItemSelected: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((value) => value !== id);
      } else {
        state.selectedIds.push(id);
      }
    },
    setCartSelection: (state, action: PayloadAction<{ ids: string[] }>) => {
      state.selectedIds = action.payload.ids;
    },
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setCartOpen,
  toggleCartItemSelected,
  setCartSelection,
  setCartItems,
} = cartSlice.actions;
export default cartSlice.reducer;
