'use client'

import TopBar from '@/components/layout/TopBar'
import Navbar from '@/components/layout/Navbar'
import type { Category } from '@/store/api/categoriesApi'

interface ProductPageWrapperProps {
  children: React.ReactNode
  initialCategories?: Category[]
  hideTopBar?: boolean
  logoSrc?: string
  logoAlt?: string
  logoHref?: string
  hideSignIn?: boolean
  hideNavLinks?: boolean
  categoryOnlyNav?: boolean
  stickToTop?: boolean
  showGuestCartWishlist?: boolean
}

export default function ProductPageWrapper({
  children,
  initialCategories = [],
  hideTopBar = false,
  logoSrc = '/Images/af_home_logo.png',
  logoAlt = 'AF Home',
  logoHref = '/shop',
  hideSignIn = false,
  hideNavLinks = false,
  categoryOnlyNav = false,
  stickToTop = false,
  showGuestCartWishlist = false,
}: ProductPageWrapperProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="relative z-[55]">
        {!hideTopBar && <TopBar />}
        <Navbar
          initialCategories={initialCategories}
          logoSrc={logoSrc}
          logoAlt={logoAlt}
          logoHref={logoHref}
          hideSignIn={hideSignIn}
          hideNavLinks={hideNavLinks}
          categoryOnlyNav={categoryOnlyNav}
          stickToTop={stickToTop}
          showGuestCartWishlist={showGuestCartWishlist}
        />
      </div>

      {children}
    </div>
  )
}
