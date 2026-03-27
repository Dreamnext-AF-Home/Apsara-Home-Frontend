export interface TextMessage {
  kind: 'text';
  role: 'bot' | 'user';
  text: string;
}

export interface ProductCardData {
  name: string;
  image: string;
  price: string;
  description: string;
  url: string;
}

export interface BrandCardData {
  name: string;
  count: number;
  url: string;
}

export interface ProductCardsMessage {
  kind: 'cards';
  cards: ProductCardData[];
}

export interface BrandCardsMessage {
  kind: 'brand_cards';
  cards: BrandCardData[];
  viewAllUrl: string;
}

export type ChatMessage = TextMessage | ProductCardsMessage | BrandCardsMessage;

export interface ApiResponse {
  status: 'ok' | 'error';
  reply?: string;
  product_cards?: ProductCardData[];
  brand_cards?: BrandCardData[];
  brand_view_all_url?: string;
  quick_replies?: string[];
}
