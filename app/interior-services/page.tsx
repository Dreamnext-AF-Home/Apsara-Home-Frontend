import InteriorServicesPageMain from "@/components/interior-services/InteriorServicesPageMain";
import Link from 'next/link'


const InteriorservicesPage = () => {
  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-6 pt-6 md:px-10">
        <Link
          href="/shop"
          className="inline-flex items-center text-sm font-semibold text-slate-700 transition hover:text-slate-900"
        >
          ← Shop
        </Link>
      </div>
      <InteriorServicesPageMain />
    </div>
  )
}

export default InteriorservicesPage;
