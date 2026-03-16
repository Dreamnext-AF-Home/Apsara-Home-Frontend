'use client'

import BookingSection from "./sections/BookingSection"
import ServiceSection from "./sections/ServiceSection"

const InteriorServicesPageMain = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth"})
  }
  return (
    <main
        className="min-h-screen overflow-x-hidden"
        style={{ background: "#F5F7FF"}}
    >
        {/* HERO SECTION */}
        {/* <HeroSection 
                onBookClick={() => scrollTo("booking")}
                onExploreClick={() => scrollTO("services")}
        /> */}

        <ServiceSection id="services"/>

        <BookingSection id="booking" />

        {/* <FooterSection /> */}
    </main>
  )
}

export default InteriorServicesPageMain
