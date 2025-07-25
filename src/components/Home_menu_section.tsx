// src/components/Home_menu_section.tsx

"use client";

import { div, i, select } from "framer-motion/client";
import React, { useCallback, useRef, useState } from "react";

import Image from "next/image";

import arrow from "@/../public/Svgs/Arrow.svg";
import ScrollableMenuCards, { ScrollableMenuRef } from "./Home_menu_card";

import placeholderImg from "@/../public/Images/Product img 1.png";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/lib/store/store";
import { CartItemOptions, MenuItem } from "@/constants/types";
import { selectPopularItems } from "@/lib/slices/restaurantSlice";
import { addItem } from "@/lib/slices/cartSlice";
import { useRouter } from "next/navigation";
import useUser from "@/hooks/useUser";
import { LikeMenuItem, UnLikeMenuItem } from "@/lib/slices/userSlice";

export default function Home_menu_section() {
  const dispatch = useDispatch<AppDispatch>();
  const popularItems = useSelector(selectPopularItems);

  const { profile } = useUser();
  const Router = useRouter();

  const handleAddToCart = (
    item: MenuItem,
    quantity: number = 1,
    options: CartItemOptions = {}
  ) => {
    console.log(`Adding item ${item.id} to cart with options:`, options);
    dispatch(addItem({ item, quantity, options }));
  };

  const handleToggleFavorite = (itemId: string) => {
    if (profile?.likedItems?.includes(itemId)) {
      dispatch(UnLikeMenuItem(itemId));
    } else {
      dispatch(LikeMenuItem(itemId));
    }
  };

  const handleReadMore = (itemId: string) => {
    // TODO - Implement read more functionality
    Router.push(`/MenuPage`);
  };

  const scrollableMenuRef = useRef<ScrollableMenuRef>(null);
  const [isMenuAtEnd, setIsMenuAtEnd] = useState(false);

  const handleScrollEndChange = useCallback((isAtEnd: boolean) => {
    console.log("Parent received isAtEnd:", isAtEnd);
    setIsMenuAtEnd(isAtEnd);
  }, []);

  const handleNextClick = () => {
    if (scrollableMenuRef.current) {
      scrollableMenuRef.current.scrollNext();
    }
  };

  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden sm:h-fit rounded-l-[12px] bg-primary-dark flex flex-col sm:flex-row p-[20px] group">
      <div
        className={`hidden sm:block absolute -bottom-60 -left-60 group-hover:-bottom-18 group-hover:-left-12 w-80 h-80 bg-black/10 rounded-full pointer-events-none transition-all duration-500 ease-in-out -z-0`}
      />
      <div className="h-auto flex px-[8px] py-[26px] flex-col z-10 grow-1 items-stretch">
        <div className="text-h3 text-white text-start leading-[1.2] font-awakening">
          Smashing delicious
          <br />
          Fast Foods
        </div>
        <div className="text-white/50 text-normal1 mt-[5px]">
          Treat yourself to our must-try list that has everyone talking.
        </div>

        <div className="flex-1 flex" />

        <div className="text-normal3 text-white">
          Scroll through to explore our dishes.
        </div>
        <div
          className="hover:bg-white/20 group-hover:translate-x-5 transition-all duration-300 rounded-full w-fit aspect-square flex items-center justify-center"
          onClick={handleNextClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={{
            rotate: isMenuAtEnd ? "180deg" : "0deg",
          }}
        >
          <Image
            src={arrow}
            alt="Arrow"
            className="w-[24px] h-[24px] m-[10px] cursor-pointer"
          />
        </div>
      </div>

      <div className="overflow-x-hidden">
        <ScrollableMenuCards
          ref={scrollableMenuRef}
          menuItems={popularItems}
          onScrollEndChange={handleScrollEndChange}
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
          onReadMore={handleReadMore}
        />
      </div>
    </div>
  );
}
