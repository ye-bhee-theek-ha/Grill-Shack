// lib/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "../apiClient";
import type { Address, User, UserState } from "@/constants/types";
// Import logoutUser action from authSlice to listen for it
import { logoutUser } from "./authSlice"; // Adjust path if needed

const initialState: UserState = {
  profile: null,
  addresses: [],
  loading: "idle",
  error: null,
};

// --- Async Thunks --- (fetchUserProfile, updateUserProfile, fetchUserAddresses, etc.)

export const fetchUserProfile = createAsyncThunk<User>(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/user/profile");
      return response.data as User;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch profile";
      return rejectWithValue({ message });
    }
  }
);

type ProfileUpdatePayload = Partial<
  Pick<User, "displayName" | "phoneNumber" | "photoURL">
>;
export const updateUserProfile = createAsyncThunk<User, ProfileUpdatePayload>(
  "user/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await apiClient.put("/user/profile", profileData);
      return response.data.data as User;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update profile";
      return rejectWithValue({ message, errors: error.response?.data?.errors });
    }
  }
);

export const fetchUserAddresses = createAsyncThunk<Address[]>(
  "user/fetchAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/user/addresses");
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data as Address[];
      } else {
        console.error(
          "API Error: /user/addresses did not return expected structure.",
          response.data
        );
        throw new Error("Invalid address data received");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch addresses";
      console.error("fetchUserAddresses Error:", message, error.response?.data);
      return rejectWithValue({ message });
    }
  }
);

type AddAddressPayload = Omit<Address, "id">;
export const addUserAddress = createAsyncThunk<Address, AddAddressPayload>(
  "user/addAddress",
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/user/addresses", addressData);
      console.log("add addresss ", response);
      const newAddress = response.data?.data ?? response.data; // Adjust based on actual API response structure
      if (
        typeof newAddress !== "object" ||
        newAddress === null ||
        !newAddress.id
      ) {
        console.error(
          "API Error: POST /user/addresses did not return a valid address object.",
          response.data
        );
        throw new Error("Invalid address data received after add");
      }
      return newAddress as Address;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to add address";
      console.error("addUserAddress Error:", message, error.response?.data);
      return rejectWithValue({ message, errors: error.response?.data?.errors });
    }
  }
);

type UpdateAddressPayload = Address;
export const updateUserAddress = createAsyncThunk<
  Address,
  UpdateAddressPayload
>("user/updateAddress", async (addressData, { rejectWithValue }) => {
  try {
    const response = await apiClient.put("/user/addresses", addressData);
    const updatedAddress = response.data?.data ?? response.data; // Adjust based on actual API response structure
    if (
      typeof updatedAddress !== "object" ||
      updatedAddress === null ||
      !updatedAddress.id
    ) {
      console.error(
        "API Error: PUT /user/addresses did not return a valid address object.",
        response.data
      );
      throw new Error("Invalid address data received after update");
    }
    return updatedAddress as Address;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to update address";
    console.error("updateUserAddress Error:", message, error.response?.data);
    return rejectWithValue({ message, errors: error.response?.data?.errors });
  }
});

export const deleteUserAddress = createAsyncThunk<string, string>(
  "user/deleteAddress",
  async (addressId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/user/addresses?id=${addressId}`);
      return addressId;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete address";
      return rejectWithValue({ message });
    }
  }
);

export const LikeMenuItem = createAsyncThunk<string, string>(
  "user/likeMenuItem",
  async (menuItemId, { rejectWithValue }) => {
    try {
      await apiClient.put("/user/likes", {
        restaurantId: process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID,
        menuItemId,
      });
      return menuItemId;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to like items";
      return rejectWithValue({ message });
    }
  }
);

export const UnLikeMenuItem = createAsyncThunk<string, string>(
  "user/unlikeMenuItem",
  async (menuItemId, { rejectWithValue }) => {
    try {
      await apiClient.delete("/user/likes", {
        data: {
          restaurantId: process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID,
          menuItemId,
        },
      });
      return menuItemId;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to unlike items";
      return rejectWithValue({ message });
    }
  }
);

// --- Slice Definition ---

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Reducer to clear user data (e.g., on logout)
    clearUserData: (state) => {
      state.profile = null;
      state.addresses = [];
      state.loading = "idle";
      state.error = null;
    },
    // NEW: Reducer to clear only the error message
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generic handler for pending state
    const handlePending = (state: UserState) => {
      state.loading = "pending";
      state.error = null; // Clear previous errors on new request
    };
    // Generic handler for rejected state
    const handleRejected = (state: UserState, action: any) => {
      state.loading = "failed";
      // Store only the message string
      state.error = action.payload?.message || "An error occurred";
    };

    builder
      // Profile Fetch
      .addCase(fetchUserProfile.pending, handlePending)
      .addCase(
        fetchUserProfile.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.loading = "succeeded";
          state.profile = action.payload;
        }
      )
      .addCase(fetchUserProfile.rejected, handleRejected)

      // Profile Update
      .addCase(updateUserProfile.pending, handlePending)
      .addCase(
        updateUserProfile.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.loading = "succeeded";
          state.profile = { ...state.profile, ...action.payload };
        }
      )
      .addCase(updateUserProfile.rejected, handleRejected)

      // Addresses Fetch
      .addCase(fetchUserAddresses.pending, handlePending)
      .addCase(
        fetchUserAddresses.fulfilled,
        (state, action: PayloadAction<Address[]>) => {
          state.loading = "succeeded";
          state.addresses = Array.isArray(action.payload) ? action.payload : [];
        }
      )
      .addCase(fetchUserAddresses.rejected, handleRejected)

      // Address Add
      .addCase(addUserAddress.pending, handlePending)
      .addCase(
        addUserAddress.fulfilled,
        (state, action: PayloadAction<Address>) => {
          state.loading = "succeeded";
          if (action.payload.isDefault) {
            state.addresses.forEach((addr) => (addr.isDefault = false));
          }
          state.addresses.push(action.payload);
        }
      )
      .addCase(addUserAddress.rejected, handleRejected)

      // Address Update
      .addCase(updateUserAddress.pending, handlePending)
      .addCase(
        updateUserAddress.fulfilled,
        (state, action: PayloadAction<Address>) => {
          state.loading = "succeeded";
          const updatedAddress = action.payload;
          const index = state.addresses.findIndex(
            (addr) => addr.id === updatedAddress.id
          );
          if (index !== -1) {
            if (updatedAddress.isDefault) {
              state.addresses.forEach(
                (addr, i) => (addr.isDefault = i === index)
              );
            }
            state.addresses[index] = updatedAddress;
          }
          if (
            state.addresses.length > 0 &&
            !state.addresses.some((a) => a.isDefault)
          ) {
            state.addresses[0].isDefault = true;
          }
        }
      )
      .addCase(updateUserAddress.rejected, handleRejected)

      // Address Delete
      .addCase(deleteUserAddress.pending, handlePending)
      .addCase(
        deleteUserAddress.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = "succeeded";
          const deletedId = action.payload;
          state.addresses = state.addresses.filter(
            (addr) => addr.id !== deletedId
          );
          if (
            state.addresses.length > 0 &&
            !state.addresses.some((a) => a.isDefault)
          ) {
            state.addresses[0].isDefault = true;
          }
        }
      )
      .addCase(deleteUserAddress.rejected, handleRejected)

      .addCase(
        LikeMenuItem.fulfilled,
        (state, action: PayloadAction<string>) => {
          if (state.profile) {
            const menuItemId = action.payload;
            const likedItems = state.profile.likedItems || [];
            const itemIndex = likedItems.indexOf(menuItemId);

            if (itemIndex >= 0) {
              // Item is already liked, so unlike it
              state.profile.likedItems = likedItems.filter(
                (id) => id !== menuItemId
              );
            } else {
              // Item is not liked, so like it
              state.profile.likedItems = [...likedItems, menuItemId];
            }
          }
        }
      )
      .addCase(LikeMenuItem.rejected, (state, action) => {
        console.error("Failed to like item:", action.payload);
        // Optionally handle the error in the UI
      })

      .addCase(
        UnLikeMenuItem.fulfilled,
        (state, action: PayloadAction<string>) => {
          if (state.profile) {
            const menuItemId = action.payload;
            const likedItems = state.profile.likedItems || [];
            const itemIndex = likedItems.indexOf(menuItemId);

            if (itemIndex >= 0) {
              // Item is already liked, so unlike it
              state.profile.likedItems = likedItems.filter(
                (id) => id !== menuItemId
              );
            } else {
              // Item is not liked, so like it
              state.profile.likedItems = [...likedItems, menuItemId];
            }
          }
        }
      )
      .addCase(UnLikeMenuItem.rejected, (state, action) => {
        console.error("Failed to unlike item:", action.payload);
        // Optionally handle the error in the UI
      });

    // Listen for logout action to clear user data
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.profile = null;
      state.addresses = [];
      state.loading = "idle";
      state.error = null;
    });
  },
});

// Export the new action along with the existing one
export const { clearUserData, clearUserError } = userSlice.actions;
export default userSlice.reducer;
