"use client";

import Header from "@/components/Header";
import MenuCards from "@/components/MenuPage_menu_cards";
import MenuPage_Menu_Section from "@/components/MenuPage_menu_section";
import OrderDetails from "@/components/OrderDetails";
import useUser from "@/hooks/useUser";
import {
  fetchActiveUserOrders,
  selectMostRecentActiveOrder,
  selectOrdersLoadingActive,
} from "@/lib/slices/orderSlice";
import { AppDispatch } from "@/lib/store/store";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

function Menu() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useUser();
  const recentActiveOrder = useSelector(selectMostRecentActiveOrder);
  console.log("Recent Active Order:", recentActiveOrder);
  const isLoadingActiveOrders = useSelector(selectOrdersLoadingActive);

  useEffect(() => {
    if (isAuthenticated && !isLoadingActiveOrders && !recentActiveOrder) {
      dispatch(fetchActiveUserOrders());
    }
  }, [isAuthenticated]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <Header handleOrderNowClick={() => {}} />
      <div className="h-[40px]" />

      {isAuthenticated && !isLoadingActiveOrders && recentActiveOrder && (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <OrderDetails />
        </div>
      )}

      <MenuPage_Menu_Section />
    </div>
  );
}

export default Menu;
