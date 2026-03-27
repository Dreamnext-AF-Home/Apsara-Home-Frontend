import { ShopAiSupportGate } from '@/components/ai-support';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ShopAiSupportGate />
    </>
  );
}
