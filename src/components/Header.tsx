"use client";

import React, { useState } from 'react'
import { AnimatedCTAButton_LoggedIn, AnimatedCTAButton_LoggedOut } from './CTA_header_btn'


interface HeaderProps {
  handleOrderNowClick: () => void;
}

function Header(
  { handleOrderNowClick }: HeaderProps
) {

  return (
    <div className="p-[20px] w-full">
      
      <div className="w-full grid grid-cols-2 md:grid-cols-3 items-center">
      
        {/* Left Section */}
        <div className="flex justify-start">

        </div>

        {/* Center Section (Always Centered) */}
        <div className="justify-center hidden md:flex">
          <div className="h-[50px] w-[50px] ">
              {/* TODO logo here */}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex justify-end flex-row">
              <AnimatedCTAButton_LoggedIn handelOrderNowClick={handleOrderNowClick}/>
        </div>
      </div>
    </div>
  )
}

export default Header



