// src/components/Home_menu_card.tsx

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Image from 'next/image';

import menu1 from "@/../public/Images/menu1.png";
import menu2 from "@/../public/Images/menu2.png";
import menu3 from "@/../public/Images/menu3.png";
import menu4 from "@/../public/Images/menu1.png";


import { CartItemOptions, MenuItem } from '@/constants/types';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';

export interface ScrollableMenuRef {
  scrollNext: () => void;
}

interface ScrollableMenuCardsProps {
  menuItems: MenuItem[];
  onAddToCart : (item: MenuItem, quantity: number, options: CartItemOptions) => void
  onToggleFavorite: (itemId: string) => void;
  onReadMore: (itemId: string) => void;
  onScrollEndChange?: (isAtEnd: boolean) => void;
}

const ScrollableMenuCards = forwardRef<ScrollableMenuRef, ScrollableMenuCardsProps>(
  ({ menuItems, onAddToCart, onReadMore, onToggleFavorite, onScrollEndChange }, ref) => {

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isAtEnd, setIsAtEnd] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    const scrollNext = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container || menuItems.length === 0) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;

      const firstCard = container.children[0] as HTMLElement | undefined;
      const cardWidth = firstCard?.offsetWidth ?? clientWidth; 
      const gap = 16; 
      const scrollAmount = cardWidth + gap; 
      const threshold = 10;
      const isNearEnd = scrollLeft + clientWidth >= scrollWidth - threshold;

      if (isNearEnd) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }, [menuItems.length]); 

    useImperativeHandle(ref, () => ({
      scrollNext,
    }));

    const checkScrollPosition = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        const threshold = 10;
        const currentIsAtEnd = scrollLeft + clientWidth >= scrollWidth - threshold;

        setIsAtEnd(prevIsAtEnd => {
            if (prevIsAtEnd !== currentIsAtEnd) {
                if (onScrollEndChange) {
                    onScrollEndChange(currentIsAtEnd);
                }
                return currentIsAtEnd;
            }
            return prevIsAtEnd;
        });

    }, [onScrollEndChange]); 


     const handleScroll = useCallback(() => {
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            checkScrollPosition();
        }, 150);
     }, [checkScrollPosition]);


    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      checkScrollPosition();

      container.addEventListener('scroll', handleScroll);

      return () => {
        container.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, [menuItems, handleScroll, checkScrollPosition]);


    const images = [menu1, menu2, menu3, menu4];


  return (
    <div className="w-full bg-primary-dark text-white px-2 sm:px-6 pt-3 pb-0">

      {/* Scrollable Cards Section */}
      <div ref={scrollContainerRef} className="flex overflow-x-auto gap-4 scrollbar-hide">
        {menuItems.map((item, index) => (
          <div 
            key={item.id} 
            className="w-[300px] sm:w-[386px] text-color-text-primary rounded-[12px] overflow-hidden flex-shrink-0"
          >
            {/* Card Image */}
            <div className="relative h-[240px] w-full">
              <Image 
                src={images[index]}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Card Content */}
            <div className="mt-[-12px] z-10 relative bg-black rounded-[12px] px-[16px] pt-4">
              <div className='flex justify-between items-center'>
                <div className="text-h5 font-bold">{item.name}</div>
              
                <button 
                  onClick={() => onToggleFavorite(item.id)}
                  className="rounded-full p-1 h-full aspect-square text-primary text-h5"
                >
                  {item.isFavorite? "★" : "☆"}
                </button>
              </div>
              
              {/* Price and Points */}
              <div className="flex mt-1 items-center">
                <span className="text-normal4 text-primary font-bold">£ {item.price}</span>
                <div className='h-1 w-1 bg-white/40 rounded-full m-[6.5px]'></div>
                
                <span className="text-normal4 text-primary items-center">+ {item.loyaltyPoints} points</span>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {item.tags.map((tag, idx) => {
                 
                  return (
                    <span 
                      key={idx} 
                      className={`text-normal4 px-[12px] py-[3px] rounded-full bg-white/[0.03] text-white/50`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
              <div className='h-4'></div>

              {/* Buttons */}
              {/* <div className="pb-4 mt-[10px] flex flex-col gap-2">
                <button 
                  onClick={() => onReadMore(item.id)}
                  className="text-normal3 text-white/50 text-center bg-white/5 h-[31px] rounded-full hover:bg-white/10"
                >
                  Read More
                </button>
                {isAuthenticated && (
                  <button 
                    onClick={() => onAddToCart(item, 1, {})}
                    className="text-normal3 font-bold text-white text-center bg-primary h-[31px] rounded-full hover:bg-primary-dark"
                  >
                    Add To Cart
                  </button>
                )}


              </div> */}

            </div>
          </div>
        ))}
      </div>

      <style jsx>
        {`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;     /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;             /* Chrome, Safari and Opera */
        }
      `}
      </style>

    </div>
  );
}
);

export default ScrollableMenuCards;