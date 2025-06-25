// src/components/admin/SiteInfoForm.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image"; // Using Next.js Image component

import { RootState, AppDispatch } from "@/lib/store/store";
import {
  selectRestaurantInfo,
  fetchInitialRestaurantData,
} from "@/lib/slices/restaurantSlice";
import apiClient from "@/lib/apiClient";
import type { RestaurantInfo } from "@/constants/types";

// --- Firebase Storage Imports ---
import { storage } from "@/lib/firebase/ClientApp"; // Import storage
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { getAuth } from "firebase/auth";

interface IconProps {
  className?: string;
}

// --- Icons ---
const PlusIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="white"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

const DeleteIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="white"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.222.261m3.114 L11.25 4.132a2.25 2.25 0 012.244-2.077h.072c.944 0 1.79.626 2.116 1.501L17.032 5.79m-10.875 0c.622 0 1.223.046 1.791.139m8.523 0c.447-.026.906-.044 1.368-.044M4.772 5.79L4.772 5.79"
    />
  </svg>
);

const SpinnerIcon: React.FC<IconProps> = ({
  className = "animate-spin h-5 w-5",
}) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="white"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="white"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// --- Types for Form Data ---
type FeaturingItemForm = {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  file?: File | null;
  previewUrl?: string | null;
};

type SiteContentTypeForm = {
  heroText: string;
  heroSubtext: string;
  menuText: string;
  menuSubtext: string;
  featuring: FeaturingItemForm[];
};

type InfoFormData = {
  name: string;
  description: string;
  location: string;
  contact: { email: string; phone: string };
  openingHours: { day: string; timing: string; id: string }[];
  social: { facebook: string; instagram: string };
  logoUrl: string;
  coverImageUrl: string;
  siteContent: SiteContentTypeForm;
  logoFile?: File | null;
  coverFile?: File | null;
  logoPreview?: string | null;
  coverPreview?: string | null;
};

const defaultFormData: InfoFormData = {
  name: "",
  description: "",
  location: "",
  contact: { email: "", phone: "" },
  openingHours: [],
  social: { facebook: "", instagram: "" },
  logoUrl: "",
  coverImageUrl: "",
  siteContent: {
    heroText: "",
    heroSubtext: "",
    menuText: "",
    menuSubtext: "",
    featuring: [],
  },
  logoFile: null,
  coverFile: null,
  logoPreview: null,
  coverPreview: null,
};

const ImagePlaceholderIcon: React.FC = () => (
  <svg
    className="w-12 h-12 text-white mb-1"
    fill="none"
    strokeWidth="1.5"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    ></path>
  </svg>
);

const SiteInfoForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const restaurantInfo = useSelector(selectRestaurantInfo);
  const isLoadingInfo = useSelector(
    (state: RootState) => state.restaurant.loading.initial === "pending"
  );
  const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

  const [formData, setFormData] = useState<InfoFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    if (restaurantInfo) {
      const info = restaurantInfo.info;
      const siteContent = restaurantInfo.siteContent || { featuring: [] };
      const features = (siteContent.featuring || []).map((f) => ({
        ...f,
        id: uuidv4(),
        file: null,
        previewUrl: null,
        imageUrl: f.imageUrl || "",
      }));

      setFormData({
        name: info?.name || "",
        description: info?.description || "",
        location: info?.location || "",
        contact: {
          email: info?.contact?.email || "",
          phone: info?.contact?.phone || "",
        },
        openingHours: (info?.openingHours || []).map((h) => ({
          ...h,
          id: uuidv4(),
        })),
        social: {
          facebook: info?.social?.facebook || "",
          instagram: info?.social?.instagram || "",
        },
        logoUrl: restaurantInfo.logoUrl || "",
        coverImageUrl: restaurantInfo.coverImageUrl || "",
        siteContent: {
          heroText: siteContent.heroText || "",
          heroSubtext: siteContent.heroSubtext || "",
          menuText: siteContent.menuText || "",
          menuSubtext: siteContent.menuSubtext || "",
          featuring: features,
        },
        logoFile: null,
        coverFile: null,
        logoPreview: null,
        coverPreview: null,
      });
    } else if (!isLoadingInfo && !restaurantInfo) {
      dispatch(fetchInitialRestaurantData());
    }
  }, [restaurantInfo, isLoadingInfo, dispatch]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "logoFile" | "coverFile" | `featureFile_${string}`
  ) => {
    const file = e.target.files?.[0] || null;
    setError(null);
    setSuccessMessage(null);
    const preview = file ? URL.createObjectURL(file) : null;

    if (fileType === "logoFile") {
      setFormData((prev) => ({
        ...prev,
        logoFile: file,
        logoPreview: preview,
        logoUrl: file ? "" : prev.logoUrl,
      }));
    } else if (fileType === "coverFile") {
      setFormData((prev) => ({
        ...prev,
        coverFile: file,
        coverPreview: preview,
        coverImageUrl: file ? "" : prev.coverImageUrl,
      }));
    } else if (fileType.startsWith("featureFile_")) {
      const featureId = fileType.split("_")[1];
      setFormData((prev) => ({
        ...prev,
        siteContent: {
          ...prev.siteContent,
          featuring: prev.siteContent.featuring.map((f) =>
            f.id === featureId
              ? {
                  ...f,
                  file: file,
                  previewUrl: preview,
                  imageUrl: file ? "" : f.imageUrl,
                }
              : f
          ),
        },
      }));
    }
    if (e.target) e.target.value = "";
  };

  const uploadImage = async (
    file: File,
    pathType: "logos" | "covers" | "featuring",
    progressKey: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!restaurantId) {
        reject(new Error("Restaurant ID not configured for upload."));
        return;
      }
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageRef = ref(
        storage,
        `restaurant_assets/${restaurantId}/${pathType}/${uuidv4()}_${sanitizedFileName}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({
            ...prev,
            [progressKey]: Math.round(progress),
          }));
        },
        (error) => {
          console.error(`Upload failed for ${progressKey}:`, error);
          setUploadProgress((prev) => ({ ...prev, [progressKey]: -1 }));
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }));
          resolve(downloadURL);
        }
      );
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setError(null);
    setSuccessMessage(null);

    if (name.startsWith("siteContent.")) {
      const field = name.split(".")[1] as keyof SiteContentTypeForm;
      setFormData((prev) => ({
        ...prev,
        siteContent: { ...prev.siteContent, [field]: value },
      }));
    } else if (name.startsWith("contact.")) {
      const field = name.split(".")[1] as keyof InfoFormData["contact"];
      setFormData((prev) => ({
        ...prev,
        contact: { ...prev.contact, [field]: value },
      }));
    } else if (name.startsWith("social.")) {
      const field = name.split(".")[1] as keyof InfoFormData["social"];
      setFormData((prev) => ({
        ...prev,
        social: { ...prev.social, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOpeningHoursChange = (
    id: string,
    field: "day" | "timing",
    value: string
  ) => {
    setError(null);
    setSuccessMessage(null);
    setFormData((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((hour) =>
        hour.id === id ? { ...hour, [field]: value } : hour
      ),
    }));
  };

  const addOpeningHour = () => {
    setError(null);
    setSuccessMessage(null);
    setFormData((prev) => ({
      ...prev,
      openingHours: [
        ...prev.openingHours,
        { id: uuidv4(), day: "Monday", timing: "9:00 AM - 5:00 PM" },
      ],
    }));
  };

  const removeOpeningHour = (id: string) => {
    setError(null);
    setSuccessMessage(null);
    setFormData((prev) => ({
      ...prev,
      openingHours: prev.openingHours.filter((hour) => hour.id !== id),
    }));
  };

  const handleFeaturingChange = (
    id: string,
    field: keyof Omit<
      FeaturingItemForm,
      "id" | "file" | "previewUrl" | "imageUrl"
    >,
    value: string
  ) => {
    setError(null);
    setSuccessMessage(null);
    setFormData((prev) => ({
      ...prev,
      siteContent: {
        ...prev.siteContent,
        featuring: prev.siteContent.featuring.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      },
    }));
  };
  const addFeaturingItem = () => {
    setError(null);
    setSuccessMessage(null);
    setFormData((prev) => ({
      ...prev,
      siteContent: {
        ...prev.siteContent,
        featuring: [
          ...prev.siteContent.featuring,
          {
            id: uuidv4(),
            title: "",
            description: "",
            imageUrl: "",
            file: null,
            previewUrl: null,
          },
        ],
      },
    }));
  };
  const removeFeaturingItem = async (id: string) => {
    setError(null);
    setSuccessMessage(null);
    const itemToRemove = formData.siteContent.featuring.find(
      (f) => f.id === id
    );

    // Optional: Delete image from Firebase Storage if it was an existing one
    if (itemToRemove?.imageUrl && !itemToRemove.file) {
      // Only delete if it's an existing URL and not a new file pending upload
      try {
        const imageRef = ref(storage, itemToRemove.imageUrl);
        await deleteObject(imageRef);
        console.log(
          "Feature image deleted from Firebase Storage:",
          itemToRemove.imageUrl
        );
      } catch (error: any) {
        // Log error but don't block UI removal if deletion fails
        console.error("Error deleting feature image from Firebase:", error);
        // setError("Could not delete existing image from storage. Please try saving again or contact support.");
        // return; // Optionally block removal if deletion is critical
      }
    }

    setFormData((prev) => ({
      ...prev,
      siteContent: {
        ...prev.siteContent,
        featuring: prev.siteContent.featuring.filter((item) => item.id !== id),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      setError("Restaurant ID not configured.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress({});

    try {
      let finalLogoUrl = formData.logoUrl;
      let finalCoverUrl = formData.coverImageUrl;

      if (formData.logoFile) {
        console.log("Uploading logo...");
        finalLogoUrl = await uploadImage(
          formData.logoFile,
          "logos",
          "logoUpload"
        );
      }
      if (formData.coverFile) {
        console.log("Uploading cover image...");
        finalCoverUrl = await uploadImage(
          formData.coverFile,
          "covers",
          "coverUpload"
        );
      }

      const finalFeaturingItems = await Promise.all(
        formData.siteContent.featuring.map(async (feature, index) => {
          if (feature.file) {
            console.log(`Uploading featuring image ${index + 1}...`);
            const newImageUrl = await uploadImage(
              feature.file,
              "featuring",
              `featureUpload_${feature.id}`
            );
            return {
              title: feature.title,
              description: feature.description,
              imageUrl: newImageUrl,
            };
          }
          return {
            title: feature.title,
            description: feature.description,
            imageUrl: feature.imageUrl,
          };
        })
      );

      const dataToSave: Partial<RestaurantInfo> = {};
      if (finalLogoUrl) dataToSave.logoUrl = finalLogoUrl;
      if (finalCoverUrl) dataToSave.coverImageUrl = finalCoverUrl;

      const infoData: Partial<RestaurantInfo["info"]> = {};
      if (formData.name.trim()) infoData.name = formData.name.trim();
      if (formData.description) infoData.description = formData.description;
      if (formData.location) infoData.location = formData.location.trim();
      if (formData.contact?.email?.trim() || formData.contact?.phone?.trim()) {
        infoData.contact = {
          email: formData.contact.email.trim(),
          phone: formData.contact.phone.trim(),
        };
      }
      // const validHours = formData.openingHours
      //   .map(({ id, ...rest }) => rest)
      //   .filter((h) => h.day.trim() && h.timing.trim());
      // if (validHours.length > 0 || formData.openingHours.length === 0) {
      //   infoData.openingHours = validHours;
      // }

      const socialData: Partial<RestaurantInfo["info"]["social"]> = {};
      if (formData.social?.facebook)
        socialData.facebook = formData.social.facebook.trim();
      if (formData.social?.instagram)
        socialData.instagram = formData.social.instagram.trim();
      if (
        Object.keys(socialData).length > 0 ||
        (formData.social &&
          Object.values(formData.social).every((v) => v === ""))
      ) {
        infoData.social = socialData;
      }
      if (Object.keys(infoData).length > 0)
        dataToSave.info = infoData as RestaurantInfo["info"];

      const siteContentData: Partial<RestaurantInfo["siteContent"]> = {};
      if (formData.siteContent?.heroText)
        siteContentData.heroText = formData.siteContent.heroText;
      if (formData.siteContent?.heroSubtext)
        siteContentData.heroSubtext = formData.siteContent.heroSubtext;
      if (formData.siteContent?.menuText)
        siteContentData.menuText = formData.siteContent.menuText;
      if (formData.siteContent?.menuSubtext)
        siteContentData.menuSubtext = formData.siteContent.menuSubtext;

      siteContentData.featuring = finalFeaturingItems.filter(
        (f) => f.title?.trim() || f.description?.trim() || f.imageUrl?.trim()
      );
      if (
        Object.keys(siteContentData).length > 0 ||
        (formData.siteContent &&
          Object.values(formData.siteContent).every(
            (v) => v === "" || (Array.isArray(v) && v.length === 0)
          ))
      ) {
        dataToSave.siteContent = siteContentData;
      }

      if (Object.keys(dataToSave).length === 0) {
        setSuccessMessage("No changes detected to save.");
        setIsSaving(false);
        return;
      }

      console.log("Data being sent to backend for update:", dataToSave);
      await apiClient.put(
        `/admin/restaurants/${restaurantId}/info`,
        dataToSave
      );
      setSuccessMessage("Information updated successfully!");
      dispatch(fetchInitialRestaurantData());
      setFormData((prev) => ({
        ...prev,
        logoFile: null,
        coverFile: null,
        logoPreview: null,
        coverPreview: null,
        siteContent: {
          ...prev.siteContent,
          featuring: prev.siteContent.featuring.map((f) => ({
            ...f,
            file: null,
            previewUrl: null,
          })),
        },
      }));
    } catch (err: any) {
      console.error("Error updating site info:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update information."
      );
    } finally {
      setIsSaving(false);
      setUploadProgress({});
    }
  };

  if (isLoadingInfo && !restaurantInfo) {
    return (
      <div className="text-center p-10 text-xl text-white bg-black min-h-screen flex items-center justify-center">
        Loading restaurant information...{" "}
        <SpinnerIcon className="ml-3 h-6 w-6 text-[#B41219]" />
      </div>
    );
  }

  // --- Dark Mode Styles ---
  const labelStyle: string = "block text-sm font-medium text-white mb-1.5";
  const labelStyleXs: string = "block text-xs font-medium text-white mb-1";
  const inputFieldStyle: string =
    "block w-full px-3.5 py-2.5 bg-white/5 border border-primary-dark text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B41219]/70 focus:border-[#B41219] sm:text-sm placeholder-gray-400 transition-all duration-150 ease-in-out hover:border-[#B41219]/50 disabled:bg-black disabled:cursor-not-allowed disabled:text-gray-400";
  const inputFileStyle: string =
    "block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#B41219]/20 file:text-[#B41219] hover:file:bg-[#B41219]/30 file:cursor-pointer cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#B41219]/50";

  const renderUploadProgress = ({
    progressValue,
  }: {
    progressValue: number | undefined;
  }) => {
    // Added undefined for safety
    if (
      typeof progressValue === "number" &&
      progressValue > 0 &&
      progressValue < 100
    ) {
      return (
        <div className="w-full mt-2 h-2.5 rounded-full bg-gray-600 overflow-hidden">
          <div
            className="h-full bg-[#B41219] rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressValue}%` }}
          ></div>
        </div>
      );
    }
    if (progressValue === -1) {
      return (
        <p className="text-xs text-red-400 mt-1">
          Upload failed. Please try again.
        </p>
      );
    }
    return null;
  };

  // --- JSX with Dark Mode ClassNames ---
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-10 max-w-4xl mx-auto my-10 "
    >
      {/* --- Branding Section (Logo & Cover Image) --- */}
      <fieldset className="border border-[#B41219]/50 p-6 rounded-lg shadow-lg bg-white/5">
        <legend className="text-xl font-semibold text-white px-2 mb-6 -ml-2">
          Branding
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Logo Upload */}
          <div>
            <label htmlFor="logoFile" className={labelStyle}>
              Restaurant Logo
            </label>
            <div className="mt-1 flex flex-col items-center">
              {formData.logoPreview || formData.logoUrl ? (
                <Image
                  src={formData.logoPreview ?? formData.logoUrl ?? ""}
                  alt="Logo Preview"
                  width={120}
                  height={120}
                  className="object-contain rounded-lg border border-primary bg-white/5 my-2 h-32 w-32 p-1"
                />
              ) : (
                <div className="my-2 h-32 w-32 flex flex-col items-center justify-center bg-white/5 rounded-lg border-2 border-dashed border-primary-dark text-xs text-gray-400 p-2 text-center">
                  <ImagePlaceholderIcon />
                  No Logo Uploaded
                </div>
              )}
              <input
                type="file"
                id="logoFile"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "logoFile")}
                className={`${inputFileStyle} max-w-xs`}
              />
              {renderUploadProgress({
                progressValue: uploadProgress["logoUpload"],
              })}
            </div>
          </div>

          {/* Cover Image Upload */}
          <div>
            <label htmlFor="coverFile" className={labelStyle}>
              Cover Image
            </label>
            <div className="mt-1 flex flex-col items-center">
              {formData.coverPreview || formData.coverImageUrl ? (
                <Image
                  src={formData.coverPreview ?? formData.coverImageUrl ?? ""}
                  alt="Cover Preview"
                  width={300}
                  height={150}
                  className="object-cover rounded-lg border border-primary bg-white/5 my-2 h-40 w-full max-w-sm p-1"
                />
              ) : (
                <div className="my-2 h-40 w-full max-w-sm flex flex-col items-center justify-center bg-white/5 rounded-lg border-2 border-dashed border-primary-dark text-xs text-gray-400 p-2 text-center">
                  <ImagePlaceholderIcon />
                  No Cover Image Uploaded
                </div>
              )}
              <input
                type="file"
                id="coverFile"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "coverFile")}
                className={`${inputFileStyle} max-w-xs`}
              />
              {renderUploadProgress({
                progressValue: uploadProgress["coverUpload"],
              })}
            </div>
          </div>
        </div>
      </fieldset>

      {/* --- Site Content Section (Hero, Menu Preview) --- */}
      <fieldset className="border border-primary p-6 rounded-lg shadow-lg bg-white/5">
        <legend className="text-xl font-semibold text-gray-100 px-2 mb-6 -ml-2">
          Homepage Content
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="heroText" className={labelStyle}>
              Hero Title
            </label>
            <input
              type="text"
              id="heroText"
              name="siteContent.heroText"
              value={formData.siteContent.heroText}
              onChange={handleChange}
              className={inputFieldStyle}
              placeholder="E.g., Welcome to Our Restaurant"
            />
          </div>
          <div>
            <label htmlFor="heroSubtext" className={labelStyle}>
              Hero Subtitle
            </label>
            <textarea
              id="heroSubtext"
              name="siteContent.heroSubtext"
              value={formData.siteContent.heroSubtext}
              onChange={handleChange}
              rows={3}
              className={inputFieldStyle}
              placeholder="Briefly describe your restaurant's specialty or welcome message."
            />
          </div>
          <div>
            <label htmlFor="menuText" className={labelStyle}>
              Menu Section Title
            </label>
            <input
              type="text"
              id="menuText"
              name="siteContent.menuText"
              value={formData.siteContent.menuText}
              onChange={handleChange}
              className={inputFieldStyle}
              placeholder="E.g., Explore Our Menu"
            />
          </div>
          <div>
            <label htmlFor="menuSubtext" className={labelStyle}>
              Menu Section Subtitle
            </label>
            <textarea
              id="menuSubtext"
              name="siteContent.menuSubtext"
              value={formData.siteContent.menuSubtext}
              onChange={handleChange}
              rows={3}
              className={inputFieldStyle}
              placeholder="A taste of what we offer..."
            />
          </div>
        </div>
      </fieldset>

      {/* --- Featuring Section --- */}
      <fieldset className="border border-primary p-6 rounded-lg shadow-lg bg-white/5">
        <legend className="text-xl font-semibold text-gray-100 px-2 mb-4 -ml-2">
          Featuring Sections
        </legend>
        <div className="space-y-6">
          {formData.siteContent?.featuring?.map((feature, index) => (
            <div
              key={feature.id}
              className="border border-primary-dark rounded-lg p-5 bg-white/5 shadow-md space-y-4 relative transition-all hover:shadow-xl hover:border-primary"
            >
              <button
                type="button"
                onClick={() => removeFeaturingItem(feature.id)}
                className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-colors duration-150"
                aria-label="Remove Feature"
              >
                <DeleteIcon className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor={`feature-title-${index}`}
                      className={labelStyleXs}
                    >
                      Feature Title
                    </label>
                    <input
                      type="text"
                      id={`feature-title-${index}`}
                      value={feature.title || ""}
                      onChange={(e) =>
                        handleFeaturingChange(
                          feature.id,
                          "title",
                          e.target.value
                        )
                      }
                      className={inputFieldStyle}
                      placeholder="E.g., Our Signature Dish"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`feature-desc-${index}`}
                      className={labelStyleXs}
                    >
                      Feature Description
                    </label>
                    <textarea
                      id={`feature-desc-${index}`}
                      rows={4}
                      value={feature.description || ""}
                      onChange={(e) =>
                        handleFeaturingChange(
                          feature.id,
                          "description",
                          e.target.value
                        )
                      }
                      className={inputFieldStyle}
                      placeholder="Describe this feature..."
                    />
                  </div>
                </div>

                <div className="mt-2 md:mt-0">
                  <label
                    htmlFor={`feature-image-${index}`}
                    className={labelStyleXs}
                  >
                    Feature Image
                  </label>
                  <div className="mt-1 flex flex-col items-center">
                    {feature.previewUrl || feature.imageUrl ? (
                      <Image
                        src={feature.previewUrl ?? feature.imageUrl ?? ""}
                        alt={feature.title || "Feature Preview"}
                        width={200}
                        height={120}
                        className="object-cover rounded-md border border-primary-dark bg-white/5 my-1 h-32 w-full max-w-xs p-0.5"
                      />
                    ) : (
                      <div className="my-1 h-32 w-full max-w-xs flex flex-col items-center justify-center bg-white/5 rounded-md border-2 border-dashed border-gray-500 text-xs text-gray-400 p-2 text-center">
                        <ImagePlaceholderIcon />
                        No Image
                      </div>
                    )}
                    <input
                      type="file"
                      id={`feature-image-${index}`}
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(e, `featureFile_${feature.id}`)
                      }
                      className={`${inputFileStyle} mt-2 max-w-xs`}
                    />
                    {renderUploadProgress({
                      progressValue:
                        uploadProgress[`featureUpload_${feature.id}`],
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFeaturingItem}
            className="mt-6 flex items-center gap-2 text-sm text-[#B41219] hover:text-[#9A080F] font-semibold py-2.5 px-4 rounded-md hover:bg-[#B41219]/20 transition-colors duration-150 border border-[#B41219]/50 hover:border-[#B41219]/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#B41219]/50"
          >
            <PlusIcon className="h-5 w-5" /> Add Feature Section
          </button>
        </div>
      </fieldset>

      {/* Save Button & Messages */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 border-t border-primary mt-10">
        {error && (
          <p className="text-sm text-red-400 flex-grow sm:flex-grow-0 text-center sm:text-left">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-green-400 flex-grow sm:flex-grow-0 text-center sm:text-left">
            {successMessage}
          </p>
        )}
        <motion.button
          type="submit"
          disabled={
            isSaving ||
            isLoadingInfo ||
            Object.values(uploadProgress).some(
              (p) => typeof p === "number" && p > 0 && p < 100
            )
          }
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#B41219] text-white font-semibold text-sm leading-tight uppercase rounded-lg shadow-md hover:bg-[#9A080F] hover:shadow-lg focus:bg-[#9A080F] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[#B41219]/50 active:bg-[#9A080F] active:shadow-lg transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
          whileTap={{ scale: 0.98 }}
        >
          {isSaving ? (
            <SpinnerIcon className="animate-spin h-5 w-5 mr-2 text-white" />
          ) : null}
          {isSaving ? "Saving..." : "Save All Information"}
        </motion.button>
      </div>
    </form>
  );
};

export default SiteInfoForm;
