"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import defaultProfile from "@/../public/Svgs/profile.svg";
import useUser from "@/hooks/useUser";
import { motion } from "framer-motion";
import AuthModal from "../Auth/AuthForm";
import { Address } from "@/constants/types";

interface UserProfileModalProps {
  onClose: () => void;
  onEditProfile: () => void;
  onManageAddresses: () => void;
  onSignOut: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  onClose,
  onEditProfile,
  onManageAddresses,
  onSignOut,
}) => {
  const { profile, addresses, isLoading } = useUser();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const defaultAddress =
    addresses?.find((addr) => addr.isDefault) || addresses?.[0];

  const [PhoneVerification, SetPhoneVerification] = useState(false);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-80 sm:w-96 shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      {PhoneVerification && (
        <AuthModal
          isOpen={PhoneVerification}
          onClose={() => SetPhoneVerification(false)}
          initialMode="phoneVerification"
        />
      )}
      <motion.div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-80 sm:w-96 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center p-4">
          <h2 className="text-lg font-semibold">Your Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-primary transition-colors"
            aria-label="Close"
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

        <div className="w-[90%] h-0.5 rounded-full mx-auto bg-primary" />

        <div className="p-4">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 mb-3 border-2 border-primary cursor-pointer">
                <Image
                  src={profile?.photoURL || defaultProfile}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="object-cover h-full w-full"
                />
              </div>
              <div className="h-24 w-24 absolute inset-0 bg-black/50 bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
                <button
                  className="bg-white/60 rounded-full p-1"
                  aria-label="Change profile picture"
                  onClick={onEditProfile}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <h3 className="text-h5 font-bold text-gray-800">
              {profile?.displayName || "Your Name"}
            </h3>

            <div className="text-normal3 text-gray-500 mt-1 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {profile?.email}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Contact Information
            </h4>
            <div className="space-y-3">
              {profile?.phoneNumber ? (
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500 mr-3 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div className="justify-between flex flex-col">
                    <div>
                      <p className="text-gray-700">{profile.phoneNumber}</p>
                      <div className="flex flex-row items-center gap-[10px]">
                        <p className="text-xs text-gray-500">Phone</p>
                        {profile.phoneVerified ? (
                          <svg
                            height="20"
                            width="20"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill="#1DA1F2"
                              d="M10,0C4.477,0,0,4.477,0,10s4.477,10,10,10s10-4.477,10-10S15.523,0,10,0z M8.293,14.293l-3.586-3.586l1.414-1.414L8.293,11.465l5.879-5.879l1.414,1.414L8.293,14.293z"
                            />
                          </svg>
                        ) : (
                          <button
                            onClick={() => {
                              SetPhoneVerification(true);
                            }}
                            className="text-xs text-primary underline hover:text-primary-dark"
                          >
                            {" "}
                            verify now{" "}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 mr-3 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div>
                    <p className="text-gray-500 italic">
                      No phone number added
                    </p>
                    <button
                      className="text-xs text-primary hover:text-primary-dark"
                      onClick={onEditProfile}
                    >
                      Add phone number
                    </button>
                  </div>
                </div>
              )}

              {defaultAddress ? (
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500 mr-3 mt-0.5"
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
                  <div>
                    <p className="text-gray-700">{defaultAddress.address}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      {defaultAddress.isDefault && (
                        <span className="bg-primary-dark/15 text-primary text-xs px-2 py-0.5 rounded mr-2">
                          Default
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 mr-3 mt-0.5"
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
                  <div>
                    <p className="text-gray-500 italic">No address added</p>
                    <button
                      className="text-xs text-primary hover:text-primary-dark"
                      onClick={onManageAddresses}
                    >
                      Add address
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Account Actions
            </h4>

            <div className="space-y-2">
              <button
                onClick={onEditProfile}
                className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3 text-gray-500"
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
                Edit Profile
              </button>

              <button
                onClick={onManageAddresses}
                className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                Manage Addresses
              </button>

              <button
                onClick={onSignOut}
                className="flex items-center w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfileModal;
