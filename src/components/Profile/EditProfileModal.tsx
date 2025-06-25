"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";

import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

import useUser from "@/hooks/useUser";
import defaultProfile from "@/../public/Svgs/profile.svg";

import { storage } from "@/lib/firebase/ClientApp";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

interface EditProfileModalProps {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  onClose,
  onSave,
}) => {
  const { profile } = useUser();
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || "",
    phoneNumber: profile?.phoneNumber || "",
    photoURL: profile?.photoURL || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, photoURL: previewUrl }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);

    let dataToSave = { ...formData };

    try {
      if (photoFile) {
        console.log("Uploading new profile picture...");
        const oldPhotoURL = profile.photoURL;
        const filePath = `user_uploads/${profile.uid}/${uuidv4()}_${
          photoFile.name
        }`;
        const storageRef = ref(storage, filePath);

        await uploadBytes(storageRef, photoFile);
        const newPhotoURL = await getDownloadURL(storageRef);
        console.log("New photo URL:", newPhotoURL);
        dataToSave.photoURL = newPhotoURL;

        if (
          oldPhotoURL &&
          oldPhotoURL.includes("firebasestorage.googleapis.com")
        ) {
          console.log("Deleting old profile picture:", oldPhotoURL);
          try {
            const oldPhotoRef = ref(storage, oldPhotoURL);
            await deleteObject(oldPhotoRef);
          } catch (deleteError: any) {
            if (deleteError.code === "storage/object-not-found") {
              console.warn(
                "Old photo not found, it might have been already deleted."
              );
            } else {
              console.error("Failed to delete old photo:", deleteError);
            }
          }
        }
      }

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <motion.div
        className="bg-white rounded-lg shadow-xl w-80 sm:w-96 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
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

        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex flex-col items-center mb-6">
            <div
              className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 mb-3 border-2 border-primary cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image
                src={formData.photoURL || defaultProfile}
                alt="Profile"
                width={96}
                height={96}
                className="object-cover h-full w-full"
              />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="text-sm text-primary  hover:text-primary-dark transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              Change profile picture
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+1 (123) 456-7890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: +[country code][number] (e.g., +12345678900)
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-primary-dark/30"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;
