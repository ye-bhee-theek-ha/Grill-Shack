import { RootState } from "@/lib/store/store";
import React from "react";
import { useSelector } from "react-redux";

import logo from "@/../public/Images/Logo.png";
import Image from "next/image";

function Footer() {
  const restaurantData = useSelector(
    (state: RootState) => state.restaurant.info
  );

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      console.warn(`Scroll target not found: #${sectionId}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="text-white w-full pb-[20px] mt-[60px] px-[10px] md:px-[50px] lg:px-[70px]">
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
              alt={"Grill Shack Logo"}
              width={100}
              height={100}
              className="object-contain sm:w-auto flex flex-1 max-h-[200px] md:max-h-[230px] aspect-square "
            />
            <div className="flex sm:max-h-[180px] justify-evenly gap-[10px] flex-row sm:flex-col my-auto max-w-[100px]">
              <a
                href="https://www.instagram.com/seasons_taiwanese_eatery/"
                aria-label="Instagram"
                className="bg-white/[0.3] sm:min-w-[100px] p-2 sm:py-4 h-full w-full items-center justify-center flex rounded-lg hover:opacity-80 transition-opacity"
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
                    fill="#0D0D0D"
                    fillOpacity="0.6"
                  />
                  <path
                    d="M10.9999 5.33008C7.87405 5.33008 5.33105 7.87307 5.33105 10.9989C5.33105 14.1246 7.87405 16.6675 10.9999 16.6675C14.1257 16.6675 16.6687 14.1246 16.6687 10.9989C16.6687 7.87307 14.1257 5.33008 10.9999 5.33008ZM10.9999 14.7154C8.95048 14.7154 7.283 13.0482 7.283 10.9988C7.283 8.94925 8.95035 7.28189 10.9999 7.28189C13.0494 7.28189 14.7168 8.94925 14.7168 10.9988C14.7168 13.0482 13.0493 14.7154 10.9999 14.7154Z"
                    fill="#0D0D0D"
                    fillOpacity="0.6"
                  />
                  <path
                    d="M16.9065 3.67773C16.5305 3.67773 16.161 3.82999 15.8954 4.09675C15.6285 4.36222 15.4751 4.73179 15.4751 5.10916C15.4751 5.48537 15.6287 5.85481 15.8954 6.12157C16.1609 6.38704 16.5305 6.54059 16.9065 6.54059C17.2839 6.54059 17.6522 6.38704 17.9189 6.12157C18.1857 5.85481 18.338 5.48524 18.338 5.10916C18.338 4.73179 18.1857 4.36222 17.9189 4.09675C17.6535 3.82999 17.2839 3.67773 16.9065 3.67773Z"
                    fill="#0D0D0D"
                    fillOpacity="0.6"
                  />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/seasonsiceandeatery/"
                aria-label="Facebook"
                className="bg-white/[0.3] p-2 px-3 sm:py-4 h-full w-full items-center justify-center flex rounded-lg hover:opacity-80 transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="22"
                  viewBox="0 0 12 22"
                  fill="none"
                >
                  <path
                    d="M7.16785 5.23843C7.16785 5.46402 7.16785 6.19932 7.16785 7.24396H10.7595L10.3701 10.4457H7.16785C7.16785 15.3833 7.16785 22 7.16785 22H2.91741C2.91741 22 2.91741 15.4709 2.91741 10.4457H0.702637V7.24396H2.91741C2.91741 5.97424 2.91741 5.07138 2.91741 4.81999C2.91741 3.62226 2.82717 3.05396 3.3361 2.12583C3.84528 1.19774 5.28153 -0.029011 7.76564 0.0005233C10.2503 0.0311339 11.2977 0.270164 11.2977 0.270164L10.7595 3.68241C10.7595 3.68241 9.17287 3.26346 8.39408 3.41277C7.61633 3.56212 7.16785 4.04121 7.16785 5.23843Z"
                    fill="#0D0D0D"
                    fillOpacity="0.6"
                  />
                </svg>
              </a>
              <a
                href="https://www.yelp.com/biz/seasons-taiwanese-eatery-honolulu"
                aria-label="Facebook"
                className="bg-white/[0.3] p-2 sm:py-4 h-full w-full items-center justify-center flex rounded-lg hover:opacity-80 transition-opacity"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 228.097 228.097"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#0D0D0D"
                  fillOpacity={0.6}
                >
                  <path
                    d="M173.22,68.06c8.204,6.784,30.709,25.392,27.042,38.455c-1.696,5.867-8.434,7.746-13.43,9.579 
      c-11.505,4.171-23.33,7.471-35.339,9.9c-9.717,1.971-30.48,6.279-26.63-10.909c1.512-6.646,6.875-12.284,11.184-17.28 
      c8.846-10.404,17.876-21.405,28.555-29.93c0.871-0.688,1.925-0.871,2.842-0.733C169.232,66.41,171.386,66.502,173.22,68.06z"
                  />
                  <path
                    d="M161.119,205.197c-7.196-5.821-12.284-14.942-16.684-22.917c-4.309-7.7-11.092-17.876-12.238-26.813 
      c-2.337-18.38,24.292-7.333,31.947-4.675c10.175,3.575,37.447,7.517,34.422,23.421c-2.521,12.971-18.151,28.784-31.213,30.801 
      c-0.137,0.046-0.321,0-0.504,0c-0.046,0.046-0.092,0.092-0.137,0.137c-0.367,0.183-0.779,0.413-1.192,0.596 
      C163.961,206.573,162.449,206.252,161.119,205.197z"
                  />
                  <path
                    d="M101.58,157.896c14.484-6.004,15.813,10.175,15.721,19.984c-0.137,11.688-0.504,23.421-1.375,35.063 
      c-0.321,4.721-0.137,10.405-4.629,13.384c-5.546,3.667-16.225,0.779-21.955-1.008c-0.183-0.092-0.367-0.183-0.55-0.229 
      c-12.054-2.108-26.767-7.654-28.188-18.792c-0.138-1.283,0.367-2.429,1.146-3.3c0.367-0.688,0.733-1.329,1.146-1.925 
      c1.788-2.475,3.85-4.675,5.913-6.921c3.483-5.179,7.242-10.175,11.229-14.988C85.813,172.197,92.917,161.471,101.58,157.896z"
                  />
                  <path
                    d="M103.689,107.661c-21.13-17.371-41.71-44.276-52.344-69.164c-8.113-18.93,12.513-30.48,28.417-35.705 
      c21.451-7.059,29.976-0.917,32.13,20.534c1.788,18.471,2.613,37.08,2.475,55.643c-0.046,7.838,2.154,20.488-2.429,27.547 
      c0.733,2.888-3.621,4.95-6.096,2.979c-0.367-0.275-0.733-0.642-1.146-0.963C104.33,108.303,104.009,108.028,103.689,107.661z"
                  />
                  <path
                    d="M101.397,134.566c1.696,7.517-3.621,10.542-9.854,13.384c-11.092,4.996-22.734,8.984-34.422,12.284 
      c-6.784,1.879-17.188,6.371-23.742,1.375c-4.95-3.758-5.271-11.596-5.729-17.28c-1.008-12.696,0.917-42.993,18.517-44.276 
      c8.617-0.596,19.388,7.104,26.447,11.138c9.396,5.409,19.48,11.596,26.492,20.076C100.159,131.862,101.03,132.916,101.397,134.566z"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="col-span-1 sm:col-span-2 flex flex-row justify-evenly w-full mb-8 lg:mb-0">
            {/* Contact Us */}
            <div className="col-span-1 text-center h-full lg:mr-10 mr-0">
              <div className="flex h-full flex-col items-center justify-center">
                <div className="text-h5 font-semibold mb-[22px]">
                  Contact Us
                </div>
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
                    <button
                      onClick={() => scrollToSection("Home")}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => scrollToSection("Menu")}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Menu
                    </button>
                    <button
                      onClick={() => scrollToSection("Reviews")}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Reviews
                    </button>
                    <button
                      onClick={() => scrollToSection("Featuring")}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Featuring
                    </button>
                    <button
                      onClick={() => scrollToSection("FAQ's")}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      FAQ's
                    </button>
                    <button
                      onClick={() => scrollToSection("Location")}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
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
            Made with&nbsp;
            <a target="_blank" href="http://tableturnerr.com">
              <span className="hover:underline">TableTurnerr.com </span>
            </a>
          </p>
        </div>
      </div>
      <div className="justify-between items-center text-center text-[10px] mt-1 flex sm:hidden">
        Grill Shack Inc. 2025 All Rights Reserved
      </div>
    </footer>
  );
}

export default Footer;
