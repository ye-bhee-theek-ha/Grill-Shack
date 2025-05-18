"use client";

import Header from "@/components/Header";
import Image from "next/image";

import hero1 from "@/../public/Images/hero1.png";

import ThemeButton from "@/components/ThemeBtn";
import Home_menu_section from "@/components/Home_menu_section";
import PromotionalBanner from "@/components/Home_promotional_banner";
import Reviews from "@/components/Reviews";
import FAQSection from "@/components/FAQ_section";
import LocationComponent from "@/components/OurLocation";
import { useRef } from "react";
import Featuring from "@/components/featuring";
import Footer from "@/components/Footer";

export default function Home() {

  const menuSectionRef = useRef<HTMLDivElement>(null);

  const handleOrderNowClick = () => {
    menuSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start', 
    });
  };

  return (
    <div className="p-[10px]">
      <Header handleOrderNowClick={handleOrderNowClick}/>

      <div className="h-[40px]" />

      {/* hero img section */}
      <div id="Home" className="h-[550px] sm:h-[500px] w-full rounded-[36px] relative">
        <div className="px-[20px] pb-8 sm:px-[40px] h-full flex flex-col items-start justify-end gap-2.5">
          <div className="text-white text-normal2 sm:text-normal2 border-l-3 border-white pl-[20px] font-awakening">
            Best Fast Food in West Drayton
          </div>

          <div className="text-white text-h2 mb-16 md:mb-0  sm:text-h1 md:text-[80px] sm:font-medium leading-[1.2] font-awakening">
            West Drayton's  
            <br />
            Ultimate Shack
            <br />
            Style Boxes!!
            <br />
            - You Chill, We Grill.
          </div>

          <ThemeButton 
            onClick={handleOrderNowClick}
          />

          <Image
            src={hero1}
            alt="Placeholder Image"
            className="absolute top-0 -right-[10px] w-fit h-full object-contain rounded-[36px] -z-10"
          />
        </div>
      </div>

      <div className="h-[100px]" />

      {/* section 2 */}
      <div className="w-full flex items-center justify-center text-center flex-col">
        <div className="text-h2 text-color-text-primary font-awakening w-full">
          Try our most popular items
        </div>
        <div className="text-normal1 text-grey mt-[20px]">
          Treat yourself to our must-try list that has everyone talking
        </div>
        <div className="mt-[20px]">
          <ThemeButton
            // TODO link to menu page
            href="/"
            text="View Full Menu"
            textClassname="pr-[8px] pl-[14px]"
          />
        </div>
      </div>

      <div className="h-[100px]" />

      {/* Menu Section */}

      <div ref={menuSectionRef} className="w-full flex items-center justify-center">
        <Home_menu_section />
      </div>

      <div className="h-[100px]" />

      {/* promotion banner */}
      <div>
        <PromotionalBanner
          image="Product img 2.png"
          title="Order From Our Website"
          description="Order directly from our website to save money in fees, get faster service, earn free food via our rewards program, and support local business."
          buttonText="Order Now"
          buttonUrl="/MenuPage"
        />
      </div>

      <div className="h-[100px]" />

      <Reviews />

      <Featuring/>

      <div className="h-[100px]" />
      {/* FAQ */}
      <FAQSection />


      <div className="h-[100px]" />
      {/* OUR LOCATION */}
      <LocationComponent />
      

      <div className="h-[100px]" />
      {/* FOOTER */}
      <Footer/>
      
    </div>
  );
}
