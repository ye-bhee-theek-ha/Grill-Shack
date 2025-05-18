// src/app/admin/menu/page.tsx (Example Path)

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import AdminMenuList from "@/components/admin/menu/AdminMenuList";
import CategoryManager from "@/components/admin/menu/CategoryManager";
import MenuItemFormModal from "@/components/admin/menu/MenuItemFormModal";
import apiClient from "@/lib/apiClient";
import type { MenuItem, RestaurantInfo } from "@/constants/types";
import { RootState, AppDispatch } from "@/lib/store/store";
import {
  selectAllMenuItems,
  selectCategories,
  selectRestaurantInfo,
  fetchInitialRestaurantData,
  fetchAllMenuItemsFromApi,
} from "@/lib/slices/restaurantSlice";

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

// Icons (Placeholders - use your icon library)
const PlusIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
);

const AdminMenuPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useUser(); // For authorization checks
  const restaurantInfo = useSelector(selectRestaurantInfo);
  const menuItems = useSelector(selectAllMenuItems);
  const categories = useSelector(selectCategories); // Get categories from slice
  const menuLoading = useSelector(
    (state: RootState) => state.restaurant.loading.allItems
  );
  const infoLoading = useSelector(
    (state: RootState) => state.restaurant.loading.initial
  );
  const menuError = useSelector(
    (state: RootState) => state.restaurant.error.allItems
  );
  const infoError = useSelector(
    (state: RootState) => state.restaurant.error.initial
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null); // null for Add, item object for Edit
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all"); // 'all' or category name

  const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

  const router = useRouter();

  console.log(profile);

  // --- Authorization ---
  // const isAuthorized = profile?.role === 'admin' || profile?.role === 'staff';
  // TODO correct it and change profile data object in firebase auth
  const isAuthorized = true;
  useEffect(() => {
    if (profile && !isAuthorized) {
      console.warn("Unauthorized access attempt to admin menu page.");
      router.replace("/");
    }
  }, [profile, isAuthorized]);
  // --- End Authorization ---

  // --- Data Fetching ---
  const fetchData = useCallback(() => {
    if (isAuthorized && restaurantId) {
      // Fetch info (which includes categories) if not loaded
      if (!restaurantInfo && infoLoading === "idle") {
        dispatch(fetchInitialRestaurantData());
      }
      // Fetch all menu items if not loaded
      if (menuItems.length === 0 && menuLoading === "idle") {
        dispatch(fetchAllMenuItemsFromApi());
      }
    }
  }, [
    dispatch,
    isAuthorized,
    restaurantId,
    restaurantInfo,
    menuItems.length,
    infoLoading,
    menuLoading,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Fetch on mount and if dependencies change
  // --- End Data Fetching ---

  // --- Event Handlers ---
  const handleOpenModalForAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveMenuItem = async (
    itemData: Omit<MenuItem, "id"> | MenuItem
  ) => {
    if (!restaurantId || !isAuthorized) return false; // Auth check

    const isEditing = "id" in itemData && itemData.id;
    const url = isEditing
      ? `admin/restaurants/${restaurantId}/menu/${itemData.id}`
      : `admin/restaurants/${restaurantId}/menu`;
    const method = isEditing ? "PUT" : "POST";

    console.log(`${method} request to ${url} with data:`, itemData);

    try {
      // Replace with actual API call
      const response = await apiClient({ method, url, data: itemData });
      console.log("Save response:", response.data);

      // TODO: Refetch or update Redux state locally for immediate UI update
      dispatch(fetchAllMenuItemsFromApi()); // Simple refetch for now

      handleCloseModal();
      return true;
    } catch (error: any) {
      console.error(
        `Error ${isEditing ? "updating" : "adding"} menu item:`,
        error
      );
      // Display error to user within the modal ideally
      alert(
        `Error saving item: ${error.response?.data?.message || error.message}`
      );
      return false;
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!restaurantId || !isAuthorized) return false;
    if (
      !window.confirm(
        `Are you sure you want to delete this menu item? This cannot be undone.`
      )
    )
      return false;

    console.log(`Attempting to delete menu item ${itemId}`);
    try {
      await apiClient.delete(
        `/admin/restaurants/${restaurantId}/menu/${itemId}`
      );
      // TODO: Refetch or update Redux state locally
      dispatch(fetchAllMenuItemsFromApi()); // Simple refetch
      console.log(`Menu item ${itemId} deleted.`);
      return true;
    } catch (error: any) {
      console.error(`Error deleting menu item ${itemId}:`, error);
      alert(
        `Error deleting item: ${error.response?.data?.message || error.message}`
      );
      return false;
    }
  };

  // --- Filtering Logic ---
  const filteredMenuItems = React.useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        selectedCategoryFilter === "all" ||
        item.categoryId ===
          categories.find((c) => c.name === selectedCategoryFilter)?.name; // Match category ID

      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategoryFilter, categories]);
  // --- End Filtering Logic ---

  if (!isAuthorized && profile) {
    return (
      <div className="p-6 text-center text-red-600">Unauthorized Access.</div>
    );
  }

  return (
    <>
      <h1 className="text-4xl sm:text-3xl text-white font-awakening mb-6">
        Menu Management
      </h1>


{/* --- Category Management Section --- */}
<section className="mb-8 p-6 bg-black rounded-xl shadow-lg border border-gray-700">
    <h2 className="text-xl font-semibold text-gray-100 mb-6">Categories</h2>
    {/* Pass categories and functions to manage them */}
    <CategoryManager
        categories={categories || []}
        restaurantId={restaurantId || ''}
        onCategoriesUpdate={() => dispatch(fetchInitialRestaurantData())} // Refetch info on update
        // Ensure CategoryManager is also styled for dark mode internally, potentially with a bg-white/5 or similar if it's a distinct "sub-component" block
    />
</section>

{/* --- Menu Item Section --- */}
<section className="mb-8 p-6 bg-black rounded-xl shadow-lg border border-gray-700">
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-100">Menu Items</h2>
        <button
            onClick={handleOpenModalForAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-[#B41219] hover:bg-[#9A080F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#B41219] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 w-full sm:w-auto"
        >
            <PlusIcon /> Add New Item
        </button>
    </div>

    {/* Search and Filter Controls - This div is the "sub-component" */}
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
        <input
            type="text"
            placeholder="Search items by name, tag, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full flex-grow px-3.5 py-2.5 bg-white/10 border border-gray-600 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] sm:text-sm placeholder-gray-400 transition-all duration-150 ease-in-out hover:border-[#B41219]/50 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:text-gray-400"
        />
        <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="block md:w-auto w-full px-3.5 py-2.5 bg-white/10 border border-gray-600 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] sm:text-sm placeholder-gray-400 transition-all duration-150 ease-in-out hover:border-[#B41219]/50 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:text-gray-400 appearance-none"
        >
            <option className='bg-white/15 text-black' value="all">All Categories</option>
            {categories.map(cat => (
                <option className='bg-white/15 text-black' key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
        </select>
    </div>

    {/* Menu Item List */}
    {menuLoading === "pending" && (
        <div className="text-center p-4 text-white/20 flex items-center justify-center">
            <Spinner /> <span className="ml-2">Loading menu items...</span>
        </div>
    )}
    {menuError && <div className="text-center p-4 text-red-400">Error loading menu: {menuError}</div>}
    {menuLoading === "succeeded" && !menuError && (
        <AdminMenuList
            items={filteredMenuItems}
            onEdit={handleOpenModalForEdit}
            onDelete={handleDeleteMenuItem}
            // Ensure AdminMenuList is also styled for dark mode internally
        />
    )}
</section>

{/* Add/Edit Modal */}
<AnimatePresence>
    {isModalOpen && (
        <MenuItemFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveMenuItem}
            itemToEdit={editingItem}
            categories={categories || []}
            restaurantId={restaurantId || ''}
            // Ensure MenuItemFormModal is also styled for dark mode internally, likely with a bg-gray-800 or bg-black base
        />
    )}
</AnimatePresence>
    </>
  );
};

export default AdminMenuPage;
