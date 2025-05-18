import React from 'react';
import Link from 'next/link';

interface ThemeButtonProps {
  text?: string;
  onClick?: () => void;
  href?: string;
  className?: string;
  showArrow?: boolean;
  arrowRotation?: number;
  bgColor?: string;
  textColor?: string;
  textClassname?: string;
  iconBgColor?: string;
  iconColor?: string;
}

const ThemeButton: React.FC<ThemeButtonProps> = ({
  text = "Order Now",
  onClick,
  href,
  className = "",
  showArrow = true,
  arrowRotation = -45,
  bgColor = "bg-primary-dark",
  textColor = "text-white",
  textClassname = "",
  iconBgColor = "bg-black/25",
  iconColor = "text-white"
}) => {
  const buttonContent = (
    <div className={`rounded-[9px] min-w-[157px] min-h-[41px] w-fit overflow-hidden flex ${bgColor} items-center ${className}`}>
      <div className={`text-nowrap text-normal2 font-bold ${textColor} ${textClassname} mx-auto h-full flex items-center justify-center`}>
        {text}
      </div>
      {showArrow && (
        <div className='flex justify-end m-[5px]'>
          <div className={`w-[31px] h-[31px] ${iconBgColor} rounded-[7px] flex items-center justify-center`}>
            <svg 
              className={`w-6 h-6 ${iconColor}`} 
              style={{ transform: `rotate(${arrowRotation}deg)` }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );

  // Render as link if href is provided
  if (href) {
    return <Link href={href}>{buttonContent}</Link>;
  }

  // Render as button otherwise
  return (
    <button onClick={onClick} className="border-none p-0 m-0 bg-transparent cursor-pointer">
      {buttonContent}
    </button>
  );
};

export default ThemeButton;