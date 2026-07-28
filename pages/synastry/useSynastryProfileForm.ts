// INPUT: SynastryPage 传入的 { profile, language, t, setStoredProfiles, setSelectedA, setSelectedB }；shared useCityAutocomplete + city-search 工具 + DateSelectGroup 默认月名 + getLocationQueryMinLength。
// OUTPUT: useSynastryProfileForm —— 封装合盘 Add/Edit 档案弹窗的全部表单状态（formData/cityQuery/...）、双 city combobox 句柄、月名本地化与 open/edit/save 处理函数。
// POS: SynastryPage 编排层调用一次的表单子系统 hook。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React, { useState, useMemo, useCallback } from "react";
import * as T from "../../types";
import { type LanguageContextType } from "../../components/UIComponents";
import {
  searchCitiesWithFallback,
  formatCityDisplay,
  getCityCoordinates,
  type City,
} from "../../utils/city-search";
import { useCityAutocomplete } from "../../hooks/useCityAutocomplete";
import { DEFAULT_MONTH_NAMES_EN } from "../../components/forms/DateSelectGroup";
import { getLocationQueryMinLength } from "../../utils/astro-helpers";

interface UseSynastryProfileFormArgs {
  profile: T.UserProfile;
  language: T.Language;
  t: LanguageContextType["t"];
  setStoredProfiles: React.Dispatch<React.SetStateAction<T.SynastryProfile[]>>;
  setSelectedA: React.Dispatch<
    React.SetStateAction<T.SynastryProfile | null>
  >;
  setSelectedB: React.Dispatch<
    React.SetStateAction<T.SynastryProfile | null>
  >;
}

export function useSynastryProfileForm({
  profile,
  language,
  t,
  setStoredProfiles,
  setSelectedA,
  setSelectedB,
}: UseSynastryProfileFormArgs) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<T.SynastryProfile | null>(null);
  const [formData, setFormData] = useState<Partial<T.SynastryProfile>>({
    name: "",
    birthDate: "",
    birthTime: "",
    birthCity: "",
    timezone: profile.timezone,
    accuracyLevel: "exact",
    currentLocation: "",
  });
  const [cityQuery, setCityQuery] = useState("");
  const [currentLocationQuery, setCurrentLocationQuery] = useState("");

  // Localised month names for the shared <DateSelectGroup> in the Add/Edit
  // modal. Reuses the existing t.journal.month_jan…month_dec dictionary so we
  // don't fork a synastry-specific copy. Falls back to the component's English
  // defaults if a key is missing.
  const monthNames = useMemo<string[]>(() => {
    const keys = [
      "month_jan",
      "month_feb",
      "month_mar",
      "month_apr",
      "month_may",
      "month_jun",
      "month_jul",
      "month_aug",
      "month_sep",
      "month_oct",
      "month_nov",
      "month_dec",
    ] as const;
    const journal = (t.journal ?? {}) as unknown as Record<string, unknown>;
    return keys.map((k, idx) => {
      const v = journal[k];
      return typeof v === "string" && v.length > 0
        ? v
        : (DEFAULT_MONTH_NAMES_EN[idx] ?? "");
    });
  }, [t]);

  // Shared combobox hook — two independent instances for birth city + current
  // location. Searches are suspended when the modal is closed via `enabled`,
  // preserving the previous `if (!modalOpen) return;` guard from the legacy
  // hand-rolled debounce effects.
  const cityAcSearch = useCallback(
    (q: string) => searchCitiesWithFallback(q, 5, language),
    [language],
  );
  const handleCitySelect = useCallback(
    (city: City) => {
      const displayLabel = formatCityDisplay(city, language);
      const coords = getCityCoordinates(city);
      setCityQuery(displayLabel);
      setFormData((prev) => ({
        ...prev,
        birthCity: displayLabel,
        lat: coords.lat,
        lon: coords.lon,
        timezone: coords.timezone,
      }));
    },
    [language],
  );
  const cityAutocomplete = useCityAutocomplete<City>({
    query: cityQuery,
    search: cityAcSearch,
    onSelect: handleCitySelect,
    minLength: getLocationQueryMinLength,
    enabled: modalOpen,
    idPrefix: "syn-birth",
  });
  const {
    suggestions: citySuggestions,
    isSearching: isSearchingCity,
    isOpen: showCitySuggestions,
    open: openCitySuggestions,
    close: closeCitySuggestions,
    selectIndex: selectCityIndex,
    inputProps: cityInputProps,
    listboxProps: cityListboxProps,
    getOptionProps: getCityOptionProps,
  } = cityAutocomplete;

  const handleCurrentLocationSelect = useCallback(
    (city: City) => {
      const displayLabel = formatCityDisplay(city, language);
      setCurrentLocationQuery(displayLabel);
      setFormData((prev) => ({
        ...prev,
        currentLocation: displayLabel,
      }));
    },
    [language],
  );
  const currentLocationAutocomplete = useCityAutocomplete<City>({
    query: currentLocationQuery,
    search: cityAcSearch,
    onSelect: handleCurrentLocationSelect,
    minLength: getLocationQueryMinLength,
    enabled: modalOpen,
    idPrefix: "syn-current",
  });
  const {
    suggestions: currentLocationSuggestions,
    isSearching: isSearchingCurrentLocation,
    isOpen: showCurrentLocationSuggestions,
    open: openCurrentLocationSuggestions,
    close: closeCurrentLocationSuggestions,
    selectIndex: selectCurrentLocationIndex,
    inputProps: currentLocationInputProps,
    listboxProps: currentLocationListboxProps,
    getOptionProps: getCurrentLocationOptionProps,
  } = currentLocationAutocomplete;

  const createProfileId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `syn_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
  };

  const openAddModal = () => {
    setEditingProfile(null);
    setFormData({
      name: "",
      birthDate: "",
      birthTime: "",
      birthCity: "",
      lat: undefined,
      lon: undefined,
      timezone: profile.timezone,
      accuracyLevel: "exact",
      currentLocation: "",
    });
    setCityQuery("");
    closeCitySuggestions();
    setCurrentLocationQuery("");
    closeCurrentLocationSuggestions();
    setModalOpen(true);
  };

  const openEditModal = (p: T.SynastryProfile) => {
    setEditingProfile(p);
    setFormData({ ...p });
    setCityQuery(p.birthCity || "");
    closeCitySuggestions();
    setCurrentLocationQuery(p.currentLocation || "");
    closeCurrentLocationSuggestions();
    setModalOpen(true);
  };

  const handleSaveProfile = () => {
    const name = (formData.name || "").trim();
    const birthDate = formData.birthDate || "";
    const birthCity = (formData.birthCity || "").trim();
    if (!name || !birthDate || !birthCity) return;
    const resolved: T.SynastryProfile = {
      id: editingProfile?.id || createProfileId(),
      name,
      birthDate,
      birthTime: formData.birthTime || undefined,
      birthCity,
      lat: formData.lat,
      lon: formData.lon,
      timezone: formData.timezone || profile.timezone,
      accuracyLevel: formData.birthTime ? "exact" : "time_unknown",
      currentLocation: (formData.currentLocation || "").trim() || undefined,
    };
    setStoredProfiles((prev) => {
      if (editingProfile) {
        return prev.map((item) =>
          item.id === editingProfile.id ? resolved : item,
        );
      }
      return [...prev, resolved];
    });
    setSelectedA((prev) => (prev?.id === resolved.id ? resolved : prev));
    setSelectedB((prev) => (prev?.id === resolved.id ? resolved : prev));
    setModalOpen(false);
  };

  return {
    modalOpen,
    setModalOpen,
    editingProfile,
    formData,
    setFormData,
    cityQuery,
    setCityQuery,
    currentLocationQuery,
    setCurrentLocationQuery,
    monthNames,
    citySuggestions,
    isSearchingCity,
    showCitySuggestions,
    openCitySuggestions,
    closeCitySuggestions,
    selectCityIndex,
    cityInputProps,
    cityListboxProps,
    getCityOptionProps,
    currentLocationSuggestions,
    isSearchingCurrentLocation,
    showCurrentLocationSuggestions,
    openCurrentLocationSuggestions,
    closeCurrentLocationSuggestions,
    selectCurrentLocationIndex,
    currentLocationInputProps,
    currentLocationListboxProps,
    getCurrentLocationOptionProps,
    openAddModal,
    openEditModal,
    handleSaveProfile,
  };
}
