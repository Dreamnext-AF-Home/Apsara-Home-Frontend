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
  referral_code: string;
}

export interface CustomerCheckoutProduct {
  name: string;
  image: string;
  price: number;
}

export interface CustomerCheckoutData {
  product: CustomerCheckoutProduct;
  quantity: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedType?: string | null;
  subtotal: number;
  handlingFee: number;
  total: number;
}

export type PaymentMethod = 'gcash' | 'maya' | 'online_banking' | 'card';
export type FormErrors = Partial<Record<keyof GuestForm, string>>;
