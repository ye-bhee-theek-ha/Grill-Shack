import React from 'react';
import Image from 'next/image';

interface PromotionalBannerProps {
  image: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

import hero2 from "@/../public/Images/hero2.png";
import ThemeButton from './ThemeBtn';


const PromotionalBanner: React.FC<PromotionalBannerProps> = ({
  image,
  title,
  description,
  buttonText,
  buttonUrl
}) => {
  return (
    <div className="relative w-full h-[664px] p-[42px] rounded-lg"
        style={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '10px',
            alignSelf: 'stretch',
        }}
    >
      {/* Background Image */}
      <div className="absolute inset-0 right-0 left-0 top-0 -z-10">
        <Image 
          src={hero2}
          alt="Promotional background"
          className="absolute h-full w-auto object-contain rounded-lg -right-[10px]"
          priority
        />
      </div>
      
      {/* Content Overlay */}
      <div className="w-fit z-10 max-w-[584px] h-full flex flex-col items-start justify-center sm:px-[30px] md:py-[114px] md:px-[50px] gap-2.5 flex-1 ">
				<div
					style={{
						display: "flex",
						flexDirection: 'column',
						alignItems: 'flex-start',
						gap: '28px',
					}}
				>

					<h2 className="text-h2 font-medium text-white font-awakening w-[70%]">{title}</h2>
					
					<p className="text-white/65 text-normal1">
						{description}
					</p>
					
					<ThemeButton
            // href='/MenuPage'
          />

          <div className='h-3 block sm:hidden'/>


				</div>
      </div>
    </div>
  );
};

export default PromotionalBanner;