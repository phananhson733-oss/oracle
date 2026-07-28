// INPUT: AuthContext user data + localStorage cache.
// OUTPUT: { user, saveUser } — current user profile with persistence.
// POS: Custom hook for user profile state; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import * as T from "../types";

export const useUserProfile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<T.UserProfile | null>(() => {
    const saved = localStorage.getItem("astro_user");
    return saved ? JSON.parse(saved) : null;
  });
  useEffect(() => {
    if (user || !authUser?.birthProfile) return;
    // Hydrate from the account on ANY device. The account birthProfile is the
    // source of truth once signed in; the old `astro_profile_migrated` gate was
    // device-local localStorage, so a second device (e.g. mobile after web)
    // never had it set and refused to show the cloud profile that exists.
    const birth = authUser.birthProfile;
    if (!birth.birthDate || !birth.birthCity || !birth.timezone) return;
    const profile: T.UserProfile = {
      userId: authUser.id,
      name: authUser.name,
      birthDate: birth.birthDate,
      birthTime: birth.birthTime,
      birthCity: birth.birthCity,
      lat: birth.lat,
      lon: birth.lon,
      timezone: birth.timezone,
      accuracyLevel: birth.accuracyLevel || "exact",
      focusTags: authUser.preferences?.focusTags || [],
    };
    setUser(profile);
  }, [user, authUser]);
  const saveUser = (u: T.UserProfile | null) => {
    setUser(u);
    if (u) localStorage.setItem("astro_user", JSON.stringify(u));
    else localStorage.removeItem("astro_user");
  };
  return { user, saveUser };
};
