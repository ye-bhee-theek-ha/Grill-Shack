"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import useUser from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { Address } from "@/constants/types";

import ProfileButton from "./ProfileButton";
import UserProfileModal from "./UserProfileModal";
import EditProfileModal from "./EditProfileModal";
import AddressManagementModal from "./AddressManagementModal";

const UserProfile: React.FC = () => {
  const {
    profile,
    updateAddress,
    addAddress,
    updateProfile,
    deleteAddress,
    setDefaultAddress,
  } = useUser();
  const { logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const handleSaveProfile = async (data: any) => {
    try {
      await updateProfile(data);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const handleSaveAddress = async (address: Partial<Address>) => {
    try {
      if (address.address) {
        if (address.id) {
          await updateAddress(address as Address);
        } else {
          await addAddress(address as Omit<Address, "id">);
        }
      } else {
        throw new Error("Address is required.");
      }
    } catch (error) {
      console.error("Error adding/updating address:", error);
      throw error;
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddress(addressId);
    } catch (error) {
      console.error("Error deleting address:", error);
      throw error;
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
    } catch (error) {
      console.error("Error setting default address:", error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <ProfileButton
        profile={profile}
        onClick={() => setIsProfileModalOpen(true)}
      />

      <AnimatePresence>
        {isProfileModalOpen && (
          <UserProfileModal
            onClose={() => setIsProfileModalOpen(false)}
            onEditProfile={() => {
              setIsProfileModalOpen(false);
              setIsEditProfileModalOpen(true);
            }}
            onManageAddresses={() => {
              setIsProfileModalOpen(false);
              setIsAddressModalOpen(true);
            }}
            onSignOut={handleSignOut}
          />
        )}

        {isEditProfileModalOpen && (
          <EditProfileModal
            onClose={() => setIsEditProfileModalOpen(false)}
            onSave={handleSaveProfile}
          />
        )}

        {isAddressModalOpen && (
          <AddressManagementModal
            onClose={() => setIsAddressModalOpen(false)}
            onSave={handleSaveAddress}
            onDelete={handleDeleteAddress}
            onSetDefault={handleSetDefaultAddress}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default UserProfile;
