export interface GuestForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  region: string;
  barangay: string;
  city: string;
  province: string;
  zip: string;
  referred_by: string;
  voucher_coupon: string;
}

export interface CheckoutAddressDraft {
  full_name: string;
  phone: string;
  address: string;
  region: string;
  province: string;
  city: string;
  barangay: string;
  zip_code: string;
  address_type: string;
  notes: string;
  set_default: boolean;
}

export interface CustomerCheckoutProduct {
  id?: number;
  sku?: string;
  prodpv?: number;
  manualCheckoutEnabled?: boolean;
  sourceType?: 'local' | 'zq';
  zqProductId?: number;
  zqExternalId?: string;
  zqOfferId?: string | null;
  name: string;
  image: string;
  price: number;
}

export interface CustomerCheckoutLineItem {
  id: string;
  cartItemId?: number;
  productId?: number;
  variantId?: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  prodpv?: number | null;
  selectedColor?: string | null;
  selectedStyle?: string | null;
  selectedSize?: string | null;
  selectedType?: string | null;
  selectedSku?: string | null;
  manualCheckoutEnabled?: boolean;
}

export interface CustomerCheckoutData {
  product: CustomerCheckoutProduct;
  quantity: number;
  variantId?: number | null;
  selectedColor?: string | null;
  selectedStyle?: string | null;
  selectedSize?: string | null;
  selectedType?: string | null;
  selectedSku?: string | null;
  items?: CustomerCheckoutLineItem[];
  subtotal: number;
  handlingFee: number;
  total: number;
  sourceLabel?: string | null;
  sourceSlug?: string | null;
  sourceHost?: string | null;
  sourceUrl?: string | null;
  sourceType?: 'local' | 'zq';
  zqProductId?: number;
  zqExternalId?: string;
  zqOfferId?: string | null;
}

export type PaymentMethod = 'gcash' | 'maya' | 'online_banking' | 'card';
export type PaymentMode = 'test' | 'live';
export type FormErrors = Partial<Record<keyof GuestForm, string>>;
