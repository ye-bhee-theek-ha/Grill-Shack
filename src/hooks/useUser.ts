import { useEffect, useCallback, useRef } from 'react'; // Import useRef
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store/store'; // Adjust path if needed
import {
  fetchUserProfile,
  fetchUserAddresses,
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  clearUserError,
} from '@/lib/slices/userSlice';
import { Address, User } from '@/constants/types'; // Assuming User type is also needed or defined elsewhere

export const useUser = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, addresses, loading, error } = useSelector(
    (state: RootState) => state.user
  );

  const { isAuthenticated, user: authUser } = useSelector(
    (state: RootState) => state.auth
  );

  const initialAddressFetchAttempted = useRef(false);

  useEffect(() => {
    const currentAddresses = Array.isArray(addresses) ? addresses : [];
    const hasAddresses = currentAddresses.length > 0;
    const isLoading = loading === 'pending';
    const fetchSucceededOrAttempted = loading === 'succeeded' || (initialAddressFetchAttempted.current && (loading === 'idle' || loading === 'failed'));


    // --- Profile Fetch Logic ---
    if (isAuthenticated && !profile && loading !== 'pending' && loading !== 'succeeded') {
        console.log('useUser: Fetching user profile...');
        dispatch(fetchUserProfile());
    }

    if (isAuthenticated && !isLoading && !fetchSucceededOrAttempted) {
        console.log('useUser: Attempting initial fetch for user addresses...');
        initialAddressFetchAttempted.current = true;
        dispatch(fetchUserAddresses());
    }

    // Dependencies: run when auth status changes or loading state changes.
  }, [dispatch, isAuthenticated, profile, loading]);

  useEffect(() => {
      if (!isAuthenticated) {
          initialAddressFetchAttempted.current = false;
      }
  }, [isAuthenticated]);


  // --- Action Dispatchers ---

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    if (profileData) {
        await dispatch(updateUserProfile(profileData)).unwrap();
    } else {
        console.error("Profile data is null or undefined.");
    }
  }, [dispatch]);

  const addAddress = useCallback(async (addressData: Omit<Address, 'id'>) => {
    await dispatch(addUserAddress(addressData)).unwrap();
  }, [dispatch]);

  const updateAddress = useCallback(async (addressData: Address) => {
    await dispatch(updateUserAddress(addressData)).unwrap();
  }, [dispatch]);

  const deleteAddress = useCallback(async (addressId: string) => {
    await dispatch(deleteUserAddress(addressId)).unwrap();
  }, [dispatch]);

  const setDefaultAddress = useCallback(async (addressId: string) => {
    const currentAddresses = Array.isArray(addresses) ? addresses : [];
    const targetAddress = currentAddresses.find(addr => addr.id === addressId);
    if (!targetAddress) {
        console.error("Address not found in state:", addressId);
        throw new Error("Address not found");
    }
    await dispatch(updateUserAddress({ ...targetAddress, isDefault: true })).unwrap();
  }, [dispatch, addresses]);

  const refetchProfile = useCallback(() => {
      if (isAuthenticated) dispatch(fetchUserProfile());
  }, [dispatch, isAuthenticated]);

  const refetchAddresses = useCallback(() => {
      initialAddressFetchAttempted.current = false;
      if (isAuthenticated) dispatch(fetchUserAddresses());
  }, [dispatch, isAuthenticated]);

  const clearUserErrorMessage = useCallback(() => {
    dispatch(clearUserError());
  }, [dispatch]);

  const defaultAddress = Array.isArray(addresses)
    ? addresses.find(addr => addr.isDefault) || null
    : null;

  // Determine overall loading state
  // This logic might need refinement based on how you want to display loading
  const isOverallLoading = loading === 'pending' || (isAuthenticated && !profile && loading !== 'failed'); 

  return {
    profile,
    addresses: Array.isArray(addresses) ? addresses : [],
    defaultAddress,
    isLoading: isOverallLoading,
    error,
    isAuthenticated,
    userId: authUser?.uid,

    // Action functions
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    clearUserErrorMessage,
    refetchProfile,
    refetchAddresses,
  };
};

export default useUser;
