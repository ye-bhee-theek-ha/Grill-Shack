"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import useUser from "@/hooks/useUser";
import { Address } from "@/constants/types";

interface AddressManagementModalProps {
  onClose: () => void;
  onSave: (address: Partial<Address>) => Promise<void>;
  onDelete: (addressId: string) => Promise<void>;
  onSetDefault: (addressId: string) => Promise<void>;
}

const AddressManagementModal: React.FC<AddressManagementModalProps> = ({
  onClose,
  onSave,
  onDelete,
  onSetDefault,
}) => {
  const { addresses } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(
    null
  );
  const [formData, setFormData] = useState<Partial<Address>>({
    address: "",
    isDefault: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const resetForm = () => {
    setFormData({
      address: "",
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const handleEdit = (address: Address) => {
    setFormData({ ...address });
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingAddress?.id) {
        await onSave({
          ...formData,
          id: editingAddress.id,
        });
      } else {
        await onSave(formData);
      }
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await onDelete(addressId);
      } catch (error) {
        console.error("Error deleting address:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Manage Addresses</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          {showAddForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-medium text-gray-900">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Street Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                />
                <label
                  htmlFor="isDefault"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Set as default address
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-primary-dark/50"
                >
                  {isSaving ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {addresses && addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="border rounded-md p-3 relative hover:border-primary transition-colors"
                    >
                      <div className="flex flex-col justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {address.address}
                          </p>
                        </div>

                        <div className="flex flex-row space-x-2 items-center justify-between">
                          <div>
                            {address.isDefault && (
                              <span className="inline-block  bg-primary/5 text-primary text-xs px-2 py-0.5 rounded">
                                Default Address
                              </span>
                            )}
                          </div>

                          <div className="flex items-center">
                            <button
                              onClick={() => handleEdit(address)}
                              className="text-gray-500 hover:text-primary"
                              aria-label="Edit address"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleDelete(address.id)}
                              className="text-gray-500 hover:text-red-500"
                              aria-label="Delete address"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>

                            {!address.isDefault && (
                              <button
                                onClick={() => onSetDefault(address.id)}
                                className="text-gray-500 hover:text-primary"
                                aria-label="Set as default address"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-500">
                    You have no saved addresses
                  </p>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add New Address
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AddressManagementModal;
