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

export interface CategoryCardData {
  name: string;
  count: number;
  url: string;
}

export interface StepImageData {
  url: string;
  caption?: string;
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

export interface CategoryCardsMessage {
  kind: 'category_cards';
  cards: CategoryCardData[];
}

export interface StepImagesMessage {
  kind: 'step_images';
  images: StepImageData[];
}

export interface ImageMessage {
  kind: 'image';
  role: 'bot' | 'user';
  url: string;
}

export type ChatMessage =
  | TextMessage
  | ImageMessage
  | ProductCardsMessage
  | BrandCardsMessage
  | CategoryCardsMessage
  | StepImagesMessage;

export interface ApiResponse {
  status: 'ok' | 'error';
  reply?: string;
  product_cards?: ProductCardData[];
  brand_cards?: BrandCardData[];
  category_cards?: CategoryCardData[];
  brand_view_all_url?: string;
  step_images?: StepImageData[];
  quick_replies?: string[];
}
