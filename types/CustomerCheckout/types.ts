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
  name: string;
  image: string;
  price: number;
}

export interface CustomerCheckoutLineItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  prodpv?: number | null;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedType?: string | null;
  selectedSku?: string | null;
}

export interface CustomerCheckoutData {
  product: CustomerCheckoutProduct;
  quantity: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedType?: string | null;
  selectedSku?: string | null;
  items?: CustomerCheckoutLineItem[];
  subtotal: number;
  handlingFee: number;
  total: number;
}

export type PaymentMethod = 'gcash' | 'maya' | 'online_banking' | 'card';
export type FormErrors = Partial<Record<keyof GuestForm, string>>;
