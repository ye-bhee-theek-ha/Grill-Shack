// src/components/admin/menu/MenuItemFormModal.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion"; // AnimatePresence removed as it wasn't used in the provided return
import { v4 as uuidv4 } from "uuid";
import type {
  MenuItem,
  // FAQItem, // Not used in this component
  // CartItemOptions, // Not used in this component
  category,
} from "@/constants/types";
import Image from "next/image";

const placeholderImgSrc = "/Images/menu1.png";

type MenuItemChoice = MenuItem["options"][0]["choices"][0];

interface OptionChoice extends MenuItemChoice {
  id: string;
}
interface OptionGroup extends Omit<MenuItem["options"][0], "choices"> {
  id: string;
  choices: OptionChoice[];
}

// --- Icons ---
const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className || "w-6 h-6"} // Default size
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className={className || "w-4 h-4"} // Default size
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);
const DeleteIcon = ({ className }: { className?: string }) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className={className || "w-4 h-4"} // Default size
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const Spinner = () => (
  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
);

interface MenuItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<MenuItem, "id"> | MenuItem) => Promise<boolean>;
  itemToEdit: MenuItem | null;
  categories: category[];
  restaurantId: string; // Kept, as it's used in handleImageChange simulation
}

const MenuItemFormModal: React.FC<MenuItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  categories,
  restaurantId,
}) => {
  const isEditing = !!itemToEdit;
  const initialFormData = {
    name: "",
    description: "",
    price: "0.00",
    categoryId: categories[0]?.name || "",
    tags: [] as string[],
    options: [] as OptionGroup[],
    isAvailable: true,
    imageUrl: "",
    loyaltyPoints: 0,
  };

  const [formData, setFormData] = useState(() => {
    if (itemToEdit) {
      return {
        name: itemToEdit.name || "",
        description: itemToEdit.description || "",
        price: itemToEdit.price?.toString() || "0.00", // Ensure price is string
        categoryId: itemToEdit.categoryId || categories[0]?.name || "",
        tags: itemToEdit.tags || [],
        options: (itemToEdit.options
          ? Array.isArray(itemToEdit.options)
            ? itemToEdit.options
            : [itemToEdit.options]
          : []
        ).map((opt) => ({
          ...opt,
          id: uuidv4(),
          choices: opt.choices.map((ch) => ({ ...ch, id: uuidv4() })),
        })) as OptionGroup[],
        isAvailable: itemToEdit.isAvailable !== false,
        imageUrl: itemToEdit.imageUrl || "",
        loyaltyPoints: itemToEdit.loyaltyPoints || 0,
      };
    }
    return { ...initialFormData, categoryId: categories[0]?.name || "" };
  });

  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setFormData({
          name: itemToEdit.name || "",
          description: itemToEdit.description || "",
          price: itemToEdit.price?.toString() || "0.00",
          categoryId: itemToEdit.categoryId || categories[0]?.name || "",
          tags: itemToEdit.tags || [],
          options: (itemToEdit.options
            ? Array.isArray(itemToEdit.options)
              ? itemToEdit.options
              : [itemToEdit.options]
            : []
          ).map((opt) => ({
            ...opt,
            id: uuidv4(), // ensure new UUIDs for keys on edit
            choices: opt.choices.map((ch) => ({ ...ch, id: uuidv4() })),
          })) as OptionGroup[],
          isAvailable: itemToEdit.isAvailable !== false, // handles undefined correctly
          imageUrl: itemToEdit.imageUrl || "",
          loyaltyPoints: itemToEdit.loyaltyPoints || 0,
        });
      } else {
        setFormData({
          ...initialFormData,
          categoryId: categories[0]?.name || "",
          tags: [], // Explicitly reset
          options: [], // Explicitly reset
        });
      }
      setError(null);
      setIsSaving(false);
      setTagInput("");
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    }
  }, [isOpen, itemToEdit, categories]); // initialFormData removed as it's stable

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setError(null);

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "loyaltyPoints" // Ensure loyaltyPoints is number
          ? parseInt(value, 10) || 0
          : value, // Price is handled as string until submission
    }));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };
  const handleAddTag = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => {
    if (("key" in e && e.key === "Enter") || e.type === "click") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput("");
    }
  };
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addOptionGroup = () => {
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          id: uuidv4(),
          Question: "",
          IsRequired: false,
          IsExtra: false,
          choices: [{ id: uuidv4(), name: "", price: 0 }],
        },
      ],
    }));
  };
  const removeOptionGroup = (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.id !== groupId),
    }));
  };
  const handleOptionGroupChange = (
    groupId: string,
    field: keyof Omit<OptionGroup, "id" | "choices">,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === groupId ? { ...opt, [field]: value } : opt
      ),
    }));
  };
  const addOptionChoice = (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === groupId
          ? {
              ...opt,
              choices: [...opt.choices, { id: uuidv4(), name: "", price: 0 }],
            }
          : opt
      ),
    }));
  };
  const removeOptionChoice = (groupId: string, choiceId: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === groupId
          ? { ...opt, choices: opt.choices.filter((ch) => ch.id !== choiceId) }
          : opt
      ),
    }));
  };
  const handleOptionChoiceChange = (
    groupId: string,
    choiceId: string,
    field: keyof Omit<OptionChoice, "id">, // Exclude 'id' from direct change
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === groupId
          ? {
              ...opt,
              choices: opt.choices.map((ch) =>
                ch.id === choiceId
                  ? {
                      ...ch,
                      [field]:
                        field === "price"
                          ? parseFloat(value as string) || 0
                          : value,
                    }
                  : ch
              ),
            }
          : opt
      ),
    }));
  };

  

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Basic check for restaurantId, actual upload logic would be more complex
    if (!restaurantId) {
        setError("Restaurant ID is missing. Cannot process image.");
        return;
    }
    setError(null);
    console.log("Simulating image upload for:", file.name, "for restaurant:", restaurantId);
    // Display preview
    setFormData((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
    // Here you would typically call an upload service
    // For example:
    // const uploadedImageUrl = await uploadImageService(file, restaurantId);
    // if (uploadedImageUrl) {
    //   setFormData((prev) => ({ ...prev, imageUrl: uploadedImageUrl }));
    // } else {
    //   setError("Image upload failed.");
    //   setFormData((prev) => ({ ...prev, imageUrl: "" })); // Clear preview or revert
    //   if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    // }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.categoryId) {
      setError("Item Name and Category are required.");
      return;
    }
    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }
    for (const opt of formData.options) {
      if (!opt.Question.trim()) {
        setError(`Option group question cannot be empty.`);
        return;
      }
      if (opt.choices.length === 0) {
        setError(
          `Option group "${opt.Question}" must have at least one choice.`
        );
        return;
      }
      for (const choice of opt.choices) {
        if (!choice.name.trim()) {
          setError(`Choice name in "${opt.Question}" cannot be empty.`);
          return;
        }
        if (isNaN(choice.price) ) { // choice.price is already a number
            setError(`Price for choice "${choice.name}" in "${opt.Question}" must be a valid number.`);
            return;
        }
      }
    }

    setIsSaving(true);

    const finalOptions = formData.options.map(
      ({ id, choices, ...restOpt }) => ({
        ...restOpt,
        choices: choices.map(({ id: choiceId, ...restChoice }) => restChoice),
      })
    );

    const saveData: Omit<MenuItem, "id"> | MenuItem = {
      ...(isEditing && itemToEdit ? { id: itemToEdit.id } : {}),
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: String(priceValue), // Use the parsed float
      categoryId: formData.categoryId,
      tags: formData.tags.map((t) => t.trim()).filter((t) => t),
      options: finalOptions,
      isAvailable: formData.isAvailable,
      imageUrl: formData.imageUrl, // This would be the URL from your storage after upload
      loyaltyPoints: formData.loyaltyPoints || 0,
    };

    // Ensure 'id' is not present when creating a new item
    if (!isEditing && "id" in saveData) {
      delete (saveData as any).id;
    }

    console.log("Saving menu item data:", saveData);
    const success = await onSave(saveData as MenuItem); // Cast to MenuItem for onSave
    setIsSaving(false);

    if (!success) {
      // Error might be set by onSave, or use a generic one
      setError(
        error || "Failed to save menu item. Please check details and try again."
      );
    }
    // If successful, onSave should handle closing the modal or providing feedback
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <motion.div
        className="bg-[#111111] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-neutral-100">
            {isEditing ? "Edit Menu Item" : "Add New Menu Item"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 transition-colors p-1 rounded-full hover:bg-neutral-700/50"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          id="menuItemForm"
          className="text-neutral-100 p-4 sm:p-6 space-y-6 overflow-y-auto flex-grow bg-[#1c1c1c]"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-neutral-300 mb-1.5"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-400 rounded-lg focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] px-3.5 py-2.5 text-sm transition-colors duration-150 shadow-sm"
              />
            </div>
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-neutral-300 mb-1.5"
              >
                Price ($)
              </label>
              <input
                type="text" // Keep as text for flexible input, parse on submit
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="0.00"
                className="block w-full bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-400 rounded-lg focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] px-3.5 py-2.5 text-sm transition-colors duration-150 shadow-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-center">
            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-neutral-300 mb-1.5"
              >
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="appearance-none block w-full bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-400 rounded-lg focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] px-3.5 py-2.5 text-sm transition-colors duration-150 shadow-sm pr-8 bg-no-repeat bg-right-2.5"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                }}
              >
                <option
                  value=""
                  disabled
                  className="text-neutral-500 bg-neutral-700"
                >
                  Select Category
                </option>
                {categories.map((cat) => (
                  <option
                    key={cat.name} // Assuming category name is unique for key
                    value={cat.name} // Or cat.id if available and preferred
                    className="bg-neutral-700 text-neutral-100"
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-2 md:pt-0 self-center md:mt-5">
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                className="h-4 w-4 text-[#B41219] bg-neutral-700 border-neutral-600 rounded focus:ring-2 focus:ring-[#B41219] focus:ring-offset-2 focus:ring-offset-[#1c1c1c] transition-colors duration-150"
              />
              <label
                htmlFor="isAvailable"
                className="ml-2.5 block text-sm font-medium text-neutral-200"
              >
                Item is Available
              </label>
            </div>
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-neutral-300 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="block w-full bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-400 rounded-lg focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] px-3.5 py-2.5 text-sm transition-colors duration-150 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Image
            </label>
            <div className="flex items-center gap-4 mt-1">
              <Image
                src={formData.imageUrl || placeholderImgSrc}
                alt="Menu item preview"
                width={64}
                height={64}
                className="object-cover rounded-lg border border-neutral-700 bg-neutral-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderImgSrc;
                }}
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#B41219]/80 file:text-white hover:file:bg-[#B41219] cursor-pointer transition-colors duration-150"
              />
            </div>
            {isEditing &&
              formData.imageUrl &&
              !formData.imageUrl.startsWith("blob:") && (
                <p className="text-xs text-neutral-500 mt-2 truncate">
                  Current URL: {formData.imageUrl}
                </p>
              )}
          </div>
          <div>
            <label
              htmlFor="tagInput"
              className="block text-sm font-medium text-neutral-300 mb-1.5"
            >
              Tags
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                id="tagInput"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleAddTag}
                placeholder="Add a tag and press Enter"
                className="block w-full bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-400 rounded-lg focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] px-3.5 py-2.5 text-sm transition-colors duration-150 shadow-sm flex-grow"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-[#B41219] hover:bg-[#9A080F] text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors duration-150"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center bg-[#B41219]/20 text-[#B41219] text-xs font-medium px-3 py-1 rounded-full border border-[#B41219]/50"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-[#B41219]/70 hover:text-[#B41219] p-0.5 rounded-full focus:bg-[#B41219]/20 transition-colors"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="loyaltyPoints"
              className="block text-sm font-medium text-neutral-300 mb-1.5"
            >
              Loyalty Points Earned
            </label>
            <input
              type="number"
              id="loyaltyPoints"
              name="loyaltyPoints"
              value={formData.loyaltyPoints}
              onChange={handleChange}
              min="0"
              step="1"
              className="block w-32 bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-400 rounded-lg focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] px-3.5 py-2.5 text-sm transition-colors duration-150 shadow-sm"
            />
          </div>
          <fieldset className="border border-neutral-700/80 p-5 rounded-xl space-y-5 bg-neutral-800/30">
            <legend className="text-sm font-semibold text-neutral-300 px-2">
              Customization Options
            </legend>
            {formData.options.map((opt) => (
              <div
                key={opt.id}
                className="border border-neutral-700 rounded-lg p-4 bg-neutral-800/50 relative space-y-4 shadow"
              >
                <button
                  type="button"
                  onClick={() => removeOptionGroup(opt.id)}
                  className="absolute top-3 right-3 p-1 text-neutral-400 hover:text-[#B41219] rounded-full hover:bg-[#B41219]/10 transition-colors"
                  aria-label="Remove Option Group"
                >
                  <DeleteIcon className="w-5 h-5"/>
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Option Group Question
                    </label>
                    <input
                      type="text"
                      value={opt.Question}
                      onChange={(e) =>
                        handleOptionGroupChange(
                          opt.id,
                          "Question",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Size, Toppings"
                      required
                      className="block w-full bg-neutral-700/70 border-neutral-600 text-neutral-200 placeholder-neutral-500 rounded-md focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] px-3 py-2 text-xs transition-colors duration-150 shadow-sm"
                    />
                  </div>
                  <div className="flex items-end gap-x-4 gap-y-2 flex-wrap sm:pb-0.5">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`isrequired-${opt.id}`}
                        checked={opt.IsRequired}
                        onChange={(e) =>
                          handleOptionGroupChange(
                            opt.id,
                            "IsRequired",
                            e.target.checked
                          )
                        }
                        className="h-3.5 w-3.5 text-[#B41219] bg-neutral-700 border-neutral-600 rounded focus:ring-1 focus:ring-[#B41219] focus:ring-offset-1 focus:ring-offset-neutral-800"
                      />
                      <label
                        htmlFor={`isrequired-${opt.id}`}
                        className="ml-1.5 text-xs font-medium text-neutral-300"
                      >
                        Required?
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`isextra-${opt.id}`}
                        checked={opt.IsExtra}
                        onChange={(e) =>
                          handleOptionGroupChange(
                            opt.id,
                            "IsExtra",
                            e.target.checked
                          )
                        }
                        className="h-3.5 w-3.5 text-[#B41219] bg-neutral-700 border-neutral-600 rounded focus:ring-1 focus:ring-[#B41219] focus:ring-offset-1 focus:ring-offset-neutral-800"
                      />
                      <label
                        htmlFor={`isextra-${opt.id}`}
                        className="ml-1.5 text-xs font-medium text-neutral-300"
                      >
                        Multi-select?
                      </label>
                    </div>
                  </div>
                </div>
                <label className="block text-xs font-medium text-neutral-400 mt-3">
                  Choices
                </label>
                <div className="space-y-2.5">
                  {opt.choices.map((choice) => (
                    <div key={choice.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={choice.name}
                        onChange={(e) =>
                          handleOptionChoiceChange(
                            opt.id,
                            choice.id,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Choice Name"
                        required
                        className="block w-full bg-neutral-700/70 border-neutral-600 text-neutral-200 placeholder-neutral-500 rounded-md focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] px-3 py-2 text-xs transition-colors duration-150 shadow-sm flex-1"
                      />
                      <input
                        type="number" // Kept as number, as value is parsed to float in handler
                        value={choice.price}
                        onChange={(e) =>
                          handleOptionChoiceChange(
                            opt.id,
                            choice.id,
                            "price",
                            e.target.value // value is string here, parsed in handler
                          )
                        }
                        placeholder="Price (+/-)"
                        step="0.01" // Min can be omitted if negative prices are allowed for deductions
                        className="block w-24 bg-neutral-700/70 border-neutral-600 text-neutral-200 placeholder-neutral-500 rounded-md focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] px-3 py-2 text-xs transition-colors duration-150 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeOptionChoice(opt.id, choice.id)}
                        className="p-1 text-neutral-400 hover:text-[#B41219] rounded-full hover:bg-[#B41219]/10 flex-shrink-0 transition-colors"
                        aria-label="Remove Choice"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addOptionChoice(opt.id)}
                  className="mt-3 text-xs text-[#B41219] hover:text-[#9A080F] font-medium hover:bg-[#B41219]/10 px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Add Choice
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOptionGroup}
              className="mt-2 text-sm text-[#B41219] hover:text-[#9A080F] font-semibold hover:bg-[#B41219]/10 px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <PlusIcon className="w-4 h-4" /> Add Option Group
            </button>
          </fieldset>
          {error && (
            <p className="text-sm text-red-400 bg-red-900/30 border border-red-700/50 p-3 rounded-lg text-center">
              {error}
            </p>
          )}
        </form>

        <div className="flex justify-end items-center gap-4 p-4 border-t border-neutral-800 bg-[#111111]/90 backdrop-blur-sm flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg text-neutral-300 hover:text-neutral-100 bg-neutral-700 hover:bg-neutral-600 transition-colors duration-150 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="menuItemForm"
            disabled={isSaving}
            className="py-2 px-4 rounded-lg text-white bg-[#B41219] hover:bg-[#9A080F] transition-colors duration-150 font-medium text-sm inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving && <Spinner />}
            {isEditing ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MenuItemFormModal;