"use client";

import React from 'react'; 
import Image, { StaticImageData } from 'next/image'; 
import { motion } from 'framer-motion'; 

import featuring1 from "@/../public/Images/featuring1.png";
import featuring2 from "@/../public/Images/featuring2.png";
import featuring3 from "@/../public/Images/featuring3.png";
import featuring4 from "@/../public/Images/featuring4.png";

import { useSelector } from 'react-redux';
import { selectRestaurantInfo } from '@/lib/slices/restaurantSlice';



const sectionVariants = {
  hidden: { opacity: 0, y: 50 }, 
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6, 
      ease: "easeOut" 
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

function Featuring() {

    const restaurantInfo = useSelector(selectRestaurantInfo);
    const featuringItems = restaurantInfo?.siteContent.featuring || [];
    

  if (featuringItems.length === 0) {
    return null;
  }

  const images = [
    featuring1,
    featuring2,
    featuring3,
    featuring4
  ]


  return (
    <div id="Featuring" className="w-full mt-12">
      <motion.div
        className="w-full max-w-[1000px] mx-auto px-4 md:px-0"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={sectionVariants}
      >
        <div className="text-center text-h2 text-color-text-primary mb-12 md:mb-[80px]">
          <div className="font-awakening">Featuring</div>
          {/* <div className='text-normal2 sm:text-h5 mt-1 mx-2x'>Food that’s Healthy AND Satisfies Your Cravings</div> */}
        </div>

        <div className="text-white grid grid-cols-2 gap-x-4 gap-y-8 md:flex md:justify-between md:items-center md:gap-0 self-stretch group">
          <div className="flex flex-col items-center gap-[10px] w-full">
            <div className="h-[22px] w-[22px] aspect-square ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
              >
                <path
                  d="M5.13392 3.47505C5.07355 3.407 5.00026 3.3516 4.91832 3.31207C4.83638 3.27255 4.74741 3.24968 4.65656 3.24479C4.56572 3.2399 4.4748 3.25309 4.38909 3.2836C4.30338 3.31411 4.22458 3.36132 4.15725 3.42251C4.08992 3.4837 4.03541 3.55764 3.99687 3.64005C3.95833 3.72246 3.93653 3.8117 3.93273 3.9026C3.92893 3.99349 3.94321 4.08424 3.97474 4.16958C4.00628 4.25492 4.05443 4.33315 4.11642 4.39974L4.95259 5.32013C4.84374 5.31497 4.7346 5.3124 4.62517 5.3124C4.44284 5.3124 4.26797 5.38483 4.13904 5.51376C4.01011 5.64269 3.93767 5.81756 3.93767 5.9999V12.8749C3.93995 14.8799 4.73744 16.8021 6.15519 18.2199C7.57294 19.6376 9.49517 20.4351 11.5002 20.4374C13.4639 20.4389 15.3508 19.675 16.7604 18.3079L17.8664 19.5247C17.9268 19.5928 18.0001 19.6482 18.082 19.6877C18.164 19.7272 18.2529 19.7501 18.3438 19.755C18.4346 19.7599 18.5255 19.7467 18.6112 19.7162C18.697 19.6857 18.7758 19.6385 18.8431 19.5773C18.9104 19.5161 18.9649 19.4422 19.0035 19.3597C19.042 19.2773 19.0638 19.1881 19.0676 19.0972C19.0714 19.0063 19.0571 18.9155 19.0256 18.8302C18.9941 18.7449 18.9459 18.6666 18.8839 18.6L5.13392 3.47505ZM12.2126 13.3046C11.9368 13.6929 11.6983 14.1064 11.5002 14.5395C10.9447 13.3298 10.0804 12.2878 8.99417 11.5183C7.90793 10.7489 6.63815 10.2793 5.31267 10.1567V6.72521C5.69683 6.76809 6.07607 6.84721 6.44533 6.96154L12.2126 13.3046ZM10.8127 19.0246C9.30077 18.8536 7.90461 18.1324 6.8903 16.9983C5.87599 15.8641 5.31444 14.3964 5.31267 12.8749V11.5377C6.82458 11.7086 8.22073 12.4299 9.23504 13.564C10.2494 14.6982 10.8109 16.1659 10.8127 17.6874V19.0246ZM12.1877 19.0246V17.6874C12.1882 16.5053 12.527 15.348 13.1639 14.3522L15.8349 17.2904C14.8479 18.2609 13.5634 18.8717 12.1877 19.0246ZM19.0627 12.8749C19.063 13.5543 18.972 14.2307 18.792 14.8858C18.7521 15.031 18.6656 15.159 18.546 15.2503C18.4263 15.3416 18.2799 15.3911 18.1294 15.3911C18.0673 15.3917 18.0054 15.3836 17.9455 15.3671C17.7698 15.3187 17.6205 15.2025 17.5304 15.0441C17.4404 14.8857 17.4169 14.698 17.4651 14.5223C17.6125 13.9856 17.6873 13.4315 17.6877 12.8749V11.5368C16.9518 11.6172 16.2366 11.8306 15.577 12.1668C15.4963 12.2109 15.4075 12.2384 15.3159 12.2475C15.2243 12.2567 15.1318 12.2474 15.0439 12.2202C14.956 12.1929 14.8745 12.1483 14.8041 12.089C14.7338 12.0296 14.676 11.9568 14.6344 11.8747C14.5927 11.7926 14.5679 11.703 14.5615 11.6112C14.5552 11.5194 14.5673 11.4272 14.5971 11.3402C14.627 11.2532 14.6741 11.173 14.7355 11.1045C14.797 11.0359 14.8716 10.9805 14.9549 10.9413C15.8069 10.5064 16.7347 10.2397 17.6877 10.1558V6.72607C16.8309 6.82349 16.0037 7.09812 15.2588 7.5325C14.5139 7.96688 13.8675 8.5515 13.3607 9.24919C13.3077 9.32255 13.2408 9.38475 13.1638 9.43224C13.0868 9.47974 13.0011 9.5116 12.9118 9.526C12.8225 9.54041 12.7312 9.53707 12.6431 9.51619C12.5551 9.49531 12.472 9.45729 12.3986 9.40431C12.3253 9.35132 12.2631 9.28441 12.2156 9.20739C12.1681 9.13036 12.1362 9.04474 12.1218 8.9554C12.1074 8.86606 12.1108 8.77477 12.1316 8.68672C12.1525 8.59867 12.1905 8.51559 12.2435 8.44224C12.8262 7.63969 13.5609 6.95937 14.4057 6.4399C13.616 4.77958 12.1404 3.74318 11.5002 3.35302C10.7457 3.81737 10.0674 4.39537 9.48923 5.06661C9.43188 5.13846 9.3607 5.19807 9.2799 5.24192C9.1991 5.28577 9.11033 5.31297 9.01884 5.32191C8.92735 5.33085 8.83499 5.32136 8.74723 5.29398C8.65947 5.26661 8.57809 5.22191 8.50791 5.16253C8.43773 5.10316 8.38017 5.03031 8.33863 4.9483C8.2971 4.86629 8.27243 4.77678 8.26609 4.68507C8.25976 4.59336 8.27188 4.50131 8.30174 4.41436C8.3316 4.32742 8.37859 4.24735 8.43994 4.17888C9.21088 3.27078 10.1433 2.51323 11.1899 1.94451C11.2855 1.89671 11.3908 1.87183 11.4976 1.87183C11.6044 1.87183 11.7097 1.89671 11.8052 1.94451C11.9187 2.00122 14.4066 3.27052 15.6372 5.82458C16.5102 5.48563 17.4387 5.31195 18.3752 5.3124C18.5575 5.3124 18.7324 5.38483 18.8613 5.51376C18.9902 5.64269 19.0627 5.81756 19.0627 5.9999V12.8749Z"
                  fill="#4D4D4D"
                />
              </svg>
            </div>
            <div className="text-normal3 text-center">Gluten-Free Options</div>
          </div>
          <div className="h-[80px] w-[1px] bg-white hidden md:block group-hover:rotate-8 transition-all duration-300"></div>
          <div className="flex flex-col items-center gap-[10px] w-full">
            <div className="h-[22px] w-[22px] aspect-square ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
              >
                <path
                  d="M15.7969 3.25C14.0223 3.25 12.4685 4.01313 11.5 5.30305C10.5315 4.01313 8.97773 3.25 7.20312 3.25C5.79051 3.25159 4.4362 3.81346 3.43733 4.81233C2.43846 5.8112 1.87659 7.16551 1.875 8.57813C1.875 14.5938 10.7945 19.463 11.1743 19.6641C11.2744 19.7179 11.3863 19.7461 11.5 19.7461C11.6137 19.7461 11.7256 19.7179 11.8257 19.6641C12.2055 19.463 21.125 14.5938 21.125 8.57813C21.1234 7.16551 20.5615 5.8112 19.5627 4.81233C18.5638 3.81346 17.2095 3.25159 15.7969 3.25ZM11.5 18.2719C9.93078 17.3575 3.25 13.1921 3.25 8.57813C3.25136 7.53011 3.66829 6.52541 4.40935 5.78435C5.15041 5.04329 6.15511 4.62636 7.20312 4.625C8.87461 4.625 10.278 5.51531 10.8641 6.94531C10.9159 7.07141 11.004 7.17926 11.1172 7.25516C11.2304 7.33106 11.3637 7.37159 11.5 7.37159C11.6363 7.37159 11.7696 7.33106 11.8828 7.25516C11.996 7.17926 12.0841 7.07141 12.1359 6.94531C12.722 5.51273 14.1254 4.625 15.7969 4.625C16.8449 4.62636 17.8496 5.04329 18.5907 5.78435C19.3317 6.52541 19.7486 7.53011 19.75 8.57813C19.75 13.1852 13.0675 17.3566 11.5 18.2719Z"
                  fill="#4D4D4D"
                />
              </svg>
            </div>
            <div className="text-normal3 text-center">Healthy Options</div>
          </div>
          <div className="col-span-2 md:hidden"></div>
          <div className="h-[80px] w-[1px] bg-white hidden md:block group-hover:rotate-8 transition-all duration-300"></div>
          <div className="flex flex-col items-center gap-[10px] w-full">
            <div className="h-[22px] w-[22px] aspect-square ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
              >
                <path
                  d="M21.125 10.125H20.1969L17.8095 4.75391C17.7015 4.5109 17.5253 4.30444 17.3023 4.15953C17.0793 4.01463 16.8191 3.9375 16.5531 3.9375H6.44687C6.18093 3.9375 5.9207 4.01463 5.6977 4.15953C5.4747 4.30444 5.29851 4.5109 5.19047 4.75391L2.80312 10.125H1.875C1.69266 10.125 1.5178 10.1974 1.38886 10.3264C1.25993 10.4553 1.1875 10.6302 1.1875 10.8125C1.1875 10.9948 1.25993 11.1697 1.38886 11.2986C1.5178 11.4276 1.69266 11.5 1.875 11.5H2.5625V18.375C2.5625 18.7397 2.70737 19.0894 2.96523 19.3473C3.22309 19.6051 3.57283 19.75 3.9375 19.75H6C6.36467 19.75 6.71441 19.6051 6.97227 19.3473C7.23013 19.0894 7.375 18.7397 7.375 18.375V17H15.625V18.375C15.625 18.7397 15.7699 19.0894 16.0277 19.3473C16.2856 19.6051 16.6353 19.75 17 19.75H19.0625C19.4272 19.75 19.7769 19.6051 20.0348 19.3473C20.2926 19.0894 20.4375 18.7397 20.4375 18.375V11.5H21.125C21.3073 11.5 21.4822 11.4276 21.6111 11.2986C21.7401 11.1697 21.8125 10.9948 21.8125 10.8125C21.8125 10.6302 21.7401 10.4553 21.6111 10.3264C21.4822 10.1974 21.3073 10.125 21.125 10.125ZM6.44687 5.3125H16.5531L18.6921 10.125H4.30789L6.44687 5.3125ZM6 18.375H3.9375V17H6V18.375ZM17 18.375V17H19.0625V18.375H17ZM19.0625 15.625H3.9375V11.5H19.0625V15.625ZM5.3125 13.5625C5.3125 13.3802 5.38493 13.2053 5.51386 13.0764C5.6428 12.9474 5.81766 12.875 6 12.875H7.375C7.55734 12.875 7.7322 12.9474 7.86114 13.0764C7.99007 13.2053 8.0625 13.3802 8.0625 13.5625C8.0625 13.7448 7.99007 13.9197 7.86114 14.0486C7.7322 14.1776 7.55734 14.25 7.375 14.25H6C5.81766 14.25 5.6428 14.1776 5.51386 14.0486C5.38493 13.9197 5.3125 13.7448 5.3125 13.5625ZM14.9375 13.5625C14.9375 13.3802 15.0099 13.2053 15.1389 13.0764C15.2678 12.9474 15.4427 12.875 15.625 12.875H17C17.1823 12.875 17.3572 12.9474 17.4861 13.0764C17.6151 13.2053 17.6875 13.3802 17.6875 13.5625C17.6875 13.7448 17.6151 13.9197 17.4861 14.0486C17.3572 14.1776 17.1823 14.25 17 14.25H15.625C15.4427 14.25 15.2678 14.1776 15.1389 14.0486C15.0099 13.9197 14.9375 13.7448 14.9375 13.5625Z"
                  fill="#4D4D4D"
                />
              </svg>
            </div>
            <div className="text-normal3 text-center">Easy Parking</div>
          </div>
          <div className="h-[80px] w-[1px] bg-white hidden md:block group-hover:rotate-8 transition-all duration-300"></div>
          <div className="flex flex-col items-center gap-[10px] w-full">
            <div className="h-[22px] w-[22px] aspect-square ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
              >
                <path
                  d="M19.7026 3.94362C19.6928 3.77542 19.6216 3.61669 19.5024 3.49756C19.3833 3.37843 19.2246 3.30719 19.0564 3.29737C12.514 2.91322 7.27349 4.88291 5.03911 8.57822C4.26461 9.84229 3.88296 11.3079 3.94255 12.7892C3.99153 14.1573 4.39028 15.5392 5.12763 16.9013L3.45099 18.5771C3.32198 18.7061 3.24951 18.881 3.24951 19.0635C3.24951 19.2459 3.32198 19.4209 3.45099 19.5499C3.57999 19.6789 3.75496 19.7513 3.93739 19.7513C4.11983 19.7513 4.2948 19.6789 4.4238 19.5499L6.09958 17.8732C7.46083 18.6097 8.84357 19.0085 10.2108 19.0574C10.3065 19.0609 10.4019 19.0626 10.497 19.0626C11.8821 19.0663 13.2409 18.6849 14.4218 17.9609C18.1171 15.7265 20.0876 10.4869 19.7026 3.94362ZM13.7128 16.7853C11.7577 17.9695 9.44341 17.9884 7.12052 16.8514L14.7372 9.23565C14.801 9.17177 14.8517 9.09594 14.8863 9.01248C14.9208 8.92902 14.9386 8.83957 14.9386 8.74924C14.9386 8.65891 14.9208 8.56946 14.8863 8.486C14.8517 8.40254 14.801 8.32671 14.7372 8.26283C14.6733 8.19896 14.5975 8.14829 14.514 8.11372C14.4305 8.07915 14.3411 8.06136 14.2508 8.06136C14.1604 8.06136 14.071 8.07915 13.9875 8.11372C13.9041 8.14829 13.8282 8.19896 13.7643 8.26283L6.14857 15.8829C5.01505 13.5626 5.03138 11.2423 6.21474 9.29065C8.1131 6.15651 12.6257 4.44033 18.3586 4.64487C18.564 10.3735 16.8469 14.8869 13.7128 16.7853Z"
                  fill="#4D4D4D"
                />
              </svg>
            </div>
            <div className="text-normal3 text-center">Vegan Options</div>
          </div>
        </div>
      </motion.div>

      {featuringItems.map((item, index) => {
        const isEven = index % 2 === 0;
        const imageOrderClass = isEven ? "lg:order-1" : "lg:order-2"; // Image first on even, second on odd (lg screens)
        const textOrderClass = isEven ? "lg:order-2" : "lg:order-1"; // Text second on even, first on odd (lg screens)
        const textMarginClass = isEven ? "lg:ml-5" : "lg:mr-5"; // Margin for text block

        return (
          <motion.div
            key={index}
            className="mt-16 md:mt-[100px] px-4 lg:px-[80px]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }} // Adjust amount if needed
            variants={itemVariants}
          >
            <div className="mx-auto w-full max-w-[1240px] flex flex-col lg:flex-row lg:justify-between items-center gap-8 lg:gap-12">
              {/* Image Section */}
              <div
                className={`flex justify-center w-full lg:w-1/2 ${imageOrderClass}`}
              >
                <Image
                  src={item.imageUrl || images[index]} // Use item image or fallback
                  alt={item.title || "Featured item"}
                  width={540}
                  height={540}
                  priority={index < 2} // Add priority to first few images
                  className="aspect-square max-w-full h-auto sm:max-w-[400px] lg:max-w-[540px] rounded-[24px] object-cover shadow-lg" // Adjusted sizing and added shadow
                  onError={(e) => {
                    e.currentTarget.src = images[index].src;
                  }}
                />
              </div>

              {/* Text Section */}
              <div
                className={`flex w-full lg:w-1/2 flex-col items-center lg:items-start gap-[10px] md:gap-[15px] ${textOrderClass} ${textMarginClass}`}
              >
                <h3 className="self-stretch text-h3 xl:text-h2 text-white font-awakening text-center lg:text-left">
                  {item.title || "Featured Title"} {/* Use item title */}
                </h3>
                <div className="text-normal4 md:text-normal3 text-grey text-center lg:text-left">
                  {/* Render description - handle potential line breaks if stored with \n */}
                  {item.description?.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  )) || "Featured description goes here."}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default Featuring;