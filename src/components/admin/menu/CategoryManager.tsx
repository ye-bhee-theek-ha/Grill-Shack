// src/components/admin/menu/CategoryManager.tsx (Example Path)

"use client";

import React, { useState } from 'react';
import type { category } from '@/constants/types'; // Adjust path
import apiClient from '@/lib/apiClient'; // Adjust path

// Icons
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>;


interface CategoryManagerProps {
    categories: category[];
    restaurantId: string;
    onCategoriesUpdate: () => void; // Callback to refetch restaurant info after update
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
    categories,
    restaurantId,
    onCategoriesUpdate
}) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newCategoryName.trim();
        if (!trimmedName || !restaurantId) return;

        if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
            setError(`Category "${trimmedName}" already exists.`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await apiClient.post(`admin/restaurants/${restaurantId}/categories`, { name: trimmedName });
            setNewCategoryName('');
            onCategoriesUpdate();
        } catch (err: any) {
            console.error("Error adding category:", err);
            setError(err.response?.data?.message || err.message || "Failed to add category.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryName: string) => {
        const categoryToDelete = categories.find(cat => cat.name === categoryName);
        if (!categoryToDelete) return;

        if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? ` +
                            `Menu items currently in this category might become uncategorized or hidden. ` +
                            `Consider reassigning items before deleting.`)) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await apiClient.delete(`admin/restaurants/${restaurantId}/categories/${encodeURIComponent(categoryName)}`);
            onCategoriesUpdate();
        } catch (err: any) {
             console.error(`Error deleting category "${categoryName}":`, err);
             setError(err.response?.data?.message || err.message || "Failed to delete category.");
        } finally {
            setIsLoading(false);
        }
    };

    // Dark mode specific styles
    const inputFieldSmDarkStyle = "block w-full px-2 py-1.5 bg-white/10 border border-gray-600 text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] text-sm placeholder-gray-400 transition-colors duration-150";

    const buttonPrimaryDarkStyle = "inline-flex items-center justify-center gap-1.5 px-4 !py-2 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-[#B41219] hover:bg-[#9A080F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#B41219] disabled:opacity-50 transition-colors duration-150";


    return (
        // This container for CategoryManager content uses bg-white/5 as per previous instructions for sub-components
        <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
            {/* List Existing Categories */}
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <div key={cat.name} className="flex items-center bg-white/10 rounded-full px-3 py-1.5 text-sm shadow">
                        <span className="text-gray-200">{cat.name}</span>
                        {cat.name.toLowerCase() !== 'popular' && (
                            <button
                                onClick={() => handleDeleteCategory(cat.name)}
                                disabled={isLoading}
                                className="ml-2 p-1 text-red-400 hover:text-red-300 rounded-full hover:bg-red-500/20 disabled:opacity-50 transition-colors duration-150"
                                title={`Delete category "${cat.name}"`}
                            >
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                ))}
                {categories.length === 0 && <p className="text-sm text-gray-400">No categories created yet.</p>}
            </div>

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-end gap-3 pt-4 border-t border-white/10">
                <div className="flex-grow w-full sm:w-auto">
                    <label htmlFor="newCategoryName" className="block text-xs font-medium text-gray-400 mb-1">
                        New Category Name
                    </label>
                    <input
                        type="text"
                        id="newCategoryName"
                        value={newCategoryName}
                        onChange={(e) => { setNewCategoryName(e.target.value); setError(null); }}
                        placeholder="e.g., Appetizers"
                        required
                        className={inputFieldSmDarkStyle}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !newCategoryName.trim()}
                    className={`${buttonPrimaryDarkStyle} w-full sm:w-auto`} // Ensure button is responsive
                >
                    {isLoading ? <Spinner /> : <PlusIcon />}
                    <span className="ml-1">Add</span>
                </button>
            </form>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
    );
};

export default CategoryManager;
