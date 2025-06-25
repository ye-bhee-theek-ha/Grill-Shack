// src/components/admin/menu/AdminMenuCard.tsx

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import type { MenuItem } from "@/constants/types"; // Adjust path
import MenuItemMissingIcon from "@/components/ui/MenuItemMissingIcon";

// Icons
const EditIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || "w-4 h-4"}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
const DeleteIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || "w-4 h-4"}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const Spinner = ({ className }: { className?: string }) => (
  <div
    className={`animate-spin rounded-full h-4 w-4 border-b-2 border-current ${
      className || ""
    }`}
  ></div>
);

interface AdminMenuCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: (itemId: string) => Promise<boolean>;
}

const AdminMenuCard: React.FC<AdminMenuCardProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDeleteClick = async () => {
    if (!item.id) {
      console.error("Item ID is missing, cannot delete.");
      return;
    }
    setIsDeleting(true);
    await onDelete(item.id);
    // setIsDeleting(false); // Often not needed if component unmounts or list re-fetches
  };

  const formatCurrency = (priceString: string | number | undefined): string => {
    const price =
      typeof priceString === "string" ? parseFloat(priceString) : priceString;
    if (price === undefined || isNaN(price)) return "$ --.--";
    return `$ ${price.toFixed(2)}`;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-neutral-800 rounded-lg shadow-lg border border-neutral-700/80 overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl">
      {/* Image */}
      <div className="relative h-40 w-full bg-neutral-700">
        {item.imageUrl && !imageError ? (
          <Image
            src={item.imageUrl}
            alt={item.name || "Menu item"}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        ) : (
          <MenuItemMissingIcon />
        )}
        {/* Availability Badge */}
        <span
          className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow ${
            item.isAvailable === false
              ? "bg-red-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {item.isAvailable === false ? "Unavailable" : "Available"}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-neutral-100 truncate mb-1.5">
          {item.name || "Unnamed Item"}
        </h3>
        <p className="text-sm text-neutral-400 line-clamp-2 mb-3 flex-grow min-h-[2.5em]">
          {item.description || "No description available."}
        </p>

        {/* Price & Category */}
        <div className="flex justify-between items-center text-sm mb-3">
          <span className="font-bold text-lg text-[#9A080F]">
            {formatCurrency(item.price)}
          </span>
          <span className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded-md">
            {item.categoryId || "Uncategorized"}
          </span>
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 bg-[#B41219]/20 text-[#B41219] border border-[#B41219]/50 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 bg-neutral-700 text-neutral-400 rounded-full font-medium">
                +{item.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end items-center gap-2 mt-auto border-t border-neutral-700 pt-3">
          <button
            onClick={onEdit}
            title="Edit Item"
            className="p-2 text-neutral-400 hover:text-[#B41219] hover:bg-[#B41219]/10 rounded-md transition-colors duration-150"
            aria-label="Edit menu item"
          >
            <EditIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            title="Delete Item"
            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete menu item"
          >
            {isDeleting ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <DeleteIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminMenuCard;
