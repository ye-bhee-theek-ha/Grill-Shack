import { RootState } from '@/lib/store/store';
import React from 'react'
import { useSelector } from 'react-redux';

import logo from '@/../public/Images/Logo.png'
import Image from 'next/image';

function Footer() {

  const restaurantData = useSelector((state: RootState) => state.restaurant.info);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn(`Scroll target not found: #${sectionId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
      <footer className="text-white w-full px-[10px] md:px-[50px] lg:px-[70px]">
        <div className="text-h3 sm:text-h2 font-awakening w-full">
          {restaurantData?.info.name || "Grill Shack"}
        </div>
        <div className="mb-[32px] mx-2 text-grey text-normal2">
          {restaurantData?.info.description || ""}
        </div>

        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 min-h-[100px] lg:grid-cols-3 gap-[10px] lg:gap-8">
            {/* Logo and Social Icons */}
            <div className="col-span-2 lg:col-span-1 mx-auto flex flex-row items-center lg:items-start gap-4">
              <Image
                src={logo}
                alt={"Logo"}
                width={100}
                height={100}
                className="object-contain w-auto h-[200px] md:h-[230px] aspect-square "
              />
              <div className="flex h-[120px] justify-evenly gap-[10px] flex-col my-auto max-w-100">
                <a
                  href="https://www.instagram.com/seasons_taiwanese_eatery/"
                  aria-label="Instagram"
                  className="bg-white/[0.07] min-w-[100px] p-2 py-4 h-full w-full items-center justify-center flex rounded-lg hover:opacity-80 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                  >
                    <path
                      d="M15.9287 0H6.07107C2.72349 0 0 2.72362 0 6.07121V15.9288C0 19.2765 2.72349 22 6.07107 22H15.9287C19.2765 22 22 19.2764 22 15.9288V6.07121C22.0001 2.72362 19.2765 0 15.9287 0ZM20.0482 15.9288C20.0482 18.2002 18.2002 20.0481 15.9288 20.0481H6.07107C3.79979 20.0482 1.95195 18.2002 1.95195 15.9288V6.07121C1.95195 3.79992 3.79979 1.95195 6.07107 1.95195H15.9287C18.2001 1.95195 20.0481 3.79992 20.0481 6.07121V15.9288H20.0482Z"
                      fill="#fff"
                      fillOpacity="0.6"
                    />
                    <path
                      d="M10.9999 5.33008C7.87405 5.33008 5.33105 7.87307 5.33105 10.9989C5.33105 14.1246 7.87405 16.6675 10.9999 16.6675C14.1257 16.6675 16.6687 14.1246 16.6687 10.9989C16.6687 7.87307 14.1257 5.33008 10.9999 5.33008ZM10.9999 14.7154C8.95048 14.7154 7.283 13.0482 7.283 10.9988C7.283 8.94925 8.95035 7.28189 10.9999 7.28189C13.0494 7.28189 14.7168 8.94925 14.7168 10.9988C14.7168 13.0482 13.0493 14.7154 10.9999 14.7154Z"
                      fill="#fff"
                      fillOpacity="0.6"
                    />
                    <path
                      d="M16.9065 3.67773C16.5305 3.67773 16.161 3.82999 15.8954 4.09675C15.6285 4.36222 15.4751 4.73179 15.4751 5.10916C15.4751 5.48537 15.6287 5.85481 15.8954 6.12157C16.1609 6.38704 16.5305 6.54059 16.9065 6.54059C17.2839 6.54059 17.6522 6.38704 17.9189 6.12157C18.1857 5.85481 18.338 5.48524 18.338 5.10916C18.338 4.73179 18.1857 4.36222 17.9189 4.09675C17.6535 3.82999 17.2839 3.67773 16.9065 3.67773Z"
                      fill="#fff"
                      fillOpacity="0.6"
                    />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/seasonsiceandeatery/"
                  aria-label="Facebook"
                  className="bg-white/[0.07] p-2 py-4 h-full w-full items-center justify-center flex rounded-lg hover:opacity-80 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="22" viewBox="0 0 12 22" fill="none">
                    <path 
                        d="M7.16785 5.23843C7.16785 5.46402 7.16785 6.19932 7.16785 7.24396H10.7595L10.3701 10.4457H7.16785C7.16785 15.3833 7.16785 22 7.16785 22H2.91741C2.91741 22 2.91741 15.4709 2.91741 10.4457H0.702637V7.24396H2.91741C2.91741 5.97424 2.91741 5.07138 2.91741 4.81999C2.91741 3.62226 2.82717 3.05396 3.3361 2.12583C3.84528 1.19774 5.28153 -0.029011 7.76564 0.0005233C10.2503 0.0311339 11.2977 0.270164 11.2977 0.270164L10.7595 3.68241C10.7595 3.68241 9.17287 3.26346 8.39408 3.41277C7.61633 3.56212 7.16785 4.04121 7.16785 5.23843Z" 
                        fill="#fff" 
                        fillOpacity="0.6"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 flex flex-row justify-evenly w-full mb-8 lg:mb-0">
              {/* Contact Us */}
              <div className="col-span-1 text-center h-full lg:mr-10 mr-0">
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="text-h5 font-semibold mb-[22px]">Contact Us</div>
                  <div className="text-normal4 text-white/80">
                    <div className="mb-[10px]">+1 808-744-0272</div>
                    <div>Contact@GrillSHack</div>
                  </div>
                </div>
              </div>

              {/* A Site By TableTurnerr */}
              <div className="col-span-1 text-center h-full ">
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="text-h5 font-semibold mb-[22px]">
                    Quick Links
                  </div>
                  <div className="text-normal4 text-white/80">
                      <div className="text-center grid grid-cols-2 gap-[10px]">
                      <button onClick={() => scrollToSection('Home')} className="hover:text-primary transition-colors cursor-pointer">
                        Home
                       </button>
                       <button onClick={() => scrollToSection('Menu')} className="hover:text-primary transition-colors cursor-pointer">
                         Menu
                       </button>
                       <button onClick={() => scrollToSection('Reviews')} className="hover:text-primary transition-colors cursor-pointer">
                         Reviews
                       </button>
                       <button onClick={() => scrollToSection('Featuring')} className="hover:text-primary transition-colors cursor-pointer">
                       Featuring
                       </button>
                       <button onClick={() => scrollToSection("FAQ's")} className="hover:text-primary transition-colors cursor-pointer">
                         FAQ's
                       </button>
                       <button onClick={() => scrollToSection('Location')} className="hover:text-primary transition-colors cursor-pointer">
                         Location
                       </button>
                      </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-primary rounded-full text-white w-[90%] mx-auto min-h-[37px] py-[10px] sm:px-[50px] md:px-[100px] mt-3">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-center text-normal4 gap-[20px]">
            <p className="hidden sm:block">
            Grill SHack Inc. 2025 All Rights Reserved
            </p>
            <p className="text-nowrap">
              Made with&nbsp;<a target="_blank" href="http://tableturnerr.com"><span className="hover:underline">TableTurnerr.com </span></a>
            </p>
          </div>
        </div>
        <div className="justify-between items-center text-center text-[10px] mt-1 flex sm:hidden">
        Grill Shack Inc. 2025 All Rights Reserved
        </div>
      </footer>
  )
}

export default Footer