// INPUT: 来自 SynastryPage 编排层的 props（profiles/selectedA/B、relationshipType + setter、suggestions、配额、生成回调、Add/Edit 弹窗状态与 city autocomplete 句柄、renderBig3）；shared UI + RELATIONSHIP_TYPES/LOGIN_GATE_MODE + DateSelectGroup + getLocationQueryMinLength + City 类型。
// OUTPUT: ProfileSelectView —— 合盘档案选择视图（view === "select"）：档案列表 + 关系类型选择 + 配额提示 + 生成按钮 + Add/Edit 档案弹窗（含双 city combobox）。
// POS: SynastryPage 选择态的展示组件。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React, { useState } from "react";
import { SEO } from "../../components/SEO";
import {
  Container,
  Card,
  ActionButton,
  GlassInput,
  Modal,
  useTheme,
  useLanguage,
} from "../../components/UIComponents";
import * as T from "../../types";
import { RELATIONSHIP_TYPES, LOGIN_GATE_MODE } from "../../constants";
import { type City } from "../../utils/city-search";
import { type CityAutocompleteApi } from "../../hooks/useCityAutocomplete";
import { DateSelectGroup } from "../../components/forms/DateSelectGroup";
import { TimeSelectGroup } from "../../components/forms/TimeSelectGroup";
import { getLocationQueryMinLength } from "../../utils/astro-helpers";

type CityInputProps = CityAutocompleteApi<City>["inputProps"];
type CityListboxProps = CityAutocompleteApi<City>["listboxProps"];
type CityOptionProps = ReturnType<CityAutocompleteApi<City>["getOptionProps"]>;

interface ProfileSelectViewProps {
  profile: T.UserProfile;
  profiles: T.SynastryProfile[];
  selectedA: T.SynastryProfile | null;
  selectedB: T.SynastryProfile | null;
  suggestions: T.SynastrySuggestion[];
  suggestionsLoading: boolean;
  showAllTypes: boolean;
  setShowAllTypes: React.Dispatch<React.SetStateAction<boolean>>;
  relationshipType: string;
  setRelationshipType: React.Dispatch<React.SetStateAction<string>>;
  setTypeLocked: React.Dispatch<React.SetStateAction<boolean>>;
  synastryQuotaLeft: number;
  isGenerating: boolean;
  generateError: string | null;
  handleGenerate: () => void;
  handleSelectProfile: (p: T.SynastryProfile) => void;
  handleDeleteProfile: (id: string) => void;
  openAddModal: () => void;
  openEditModal: (p: T.SynastryProfile) => void;
  renderBig3: (id: string) => string;
  modalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingProfile: T.SynastryProfile | null;
  formData: Partial<T.SynastryProfile>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<T.SynastryProfile>>>;
  handleSaveProfile: () => void;
  monthNames: string[];
  cityQuery: string;
  setCityQuery: React.Dispatch<React.SetStateAction<string>>;
  citySuggestions: readonly City[];
  isSearchingCity: boolean;
  showCitySuggestions: boolean;
  openCitySuggestions: () => void;
  closeCitySuggestions: () => void;
  selectCityIndex: (i: number) => void;
  cityInputProps: CityInputProps;
  cityListboxProps: CityListboxProps;
  getCityOptionProps: (i: number) => CityOptionProps;
  currentLocationQuery: string;
  setCurrentLocationQuery: React.Dispatch<React.SetStateAction<string>>;
  currentLocationSuggestions: readonly City[];
  isSearchingCurrentLocation: boolean;
  showCurrentLocationSuggestions: boolean;
  openCurrentLocationSuggestions: () => void;
  closeCurrentLocationSuggestions: () => void;
  selectCurrentLocationIndex: (i: number) => void;
  currentLocationInputProps: CityInputProps;
  currentLocationListboxProps: CityListboxProps;
  getCurrentLocationOptionProps: (i: number) => CityOptionProps;
}

const ProfileSelectView: React.FC<ProfileSelectViewProps> = ({
  profile,
  profiles,
  selectedA,
  selectedB,
  suggestions,
  suggestionsLoading,
  showAllTypes,
  setShowAllTypes,
  relationshipType,
  setRelationshipType,
  setTypeLocked,
  synastryQuotaLeft,
  isGenerating,
  generateError,
  handleGenerate,
  handleSelectProfile,
  handleDeleteProfile,
  openAddModal,
  openEditModal,
  renderBig3,
  modalOpen,
  setModalOpen,
  editingProfile,
  formData,
  setFormData,
  handleSaveProfile,
  monthNames,
  cityQuery,
  setCityQuery,
  citySuggestions,
  isSearchingCity,
  showCitySuggestions,
  openCitySuggestions,
  closeCitySuggestions,
  selectCityIndex,
  cityInputProps,
  cityListboxProps,
  getCityOptionProps,
  currentLocationQuery,
  setCurrentLocationQuery,
  currentLocationSuggestions,
  isSearchingCurrentLocation,
  showCurrentLocationSuggestions,
  openCurrentLocationSuggestions,
  closeCurrentLocationSuggestions,
  selectCurrentLocationIndex,
  currentLocationInputProps,
  currentLocationListboxProps,
  getCurrentLocationOptionProps,
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  // 出生时间只选了一部分（如漏了 AM/PM）。不拦住会静默存成「时间未知」的档案，
  // 之后每次合盘都按正午 12:00 出盘（原生 <input type="time"> 的老 bug）。
  const [timePartial, setTimePartial] = useState(false);

    const topOptions =
      suggestions.length > 0
        ? (suggestions
            .map((s) => RELATIONSHIP_TYPES.find((rt) => rt.key === s.key))
            .filter(Boolean) as typeof RELATIONSHIP_TYPES)
        : RELATIONSHIP_TYPES;
    const options = showAllTypes
      ? RELATIONSHIP_TYPES
      : topOptions.length
        ? topOptions
        : RELATIONSHIP_TYPES;
    const showTypeToggle =
      suggestions.length > 0 && topOptions.length < RELATIONSHIP_TYPES.length;
    const selectedProfiles = [selectedA, selectedB].filter(
      Boolean,
    ) as T.SynastryProfile[];
    const selectedCount = selectedProfiles.length;
    const selectedNames = selectedProfiles
      .map((p) => p.name || (p.id === "me" ? t.us.slot_me : ""))
      .filter(Boolean)
      .join(" & ");
    const selectionSummary = selectedCount
      ? language === "zh"
        ? `选择了${selectedCount}人：${selectedNames}`
        : `Selected ${selectedCount}: ${selectedNames}`
      : language === "zh"
        ? "请在下方选择两位档案"
        : "Select two profiles below";

    return (
      <>
        <SEO
          title="Relationships"
          description="Explore relationship compatibility with synastry and composite charts."
          robots="noindex,nofollow"
        />
        <Container className="flex flex-col min-h-screen !py-0 pt-[60px] overflow-hidden">
          <div className="flex items-center justify-between shrink-0 pt-8 pb-4">
            <div>
              <h1 className="text-3xl font-serif font-medium">
                {t.us.selection_title}
              </h1>
              <p className="text-sm opacity-70">{t.us.selection_subtitle}</p>
            </div>
            <ActionButton size="sm" onClick={openAddModal}>
              {t.us.btn_add_profile}
            </ActionButton>
          </div>

          <Card
            noPadding
            className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 mb-4 border ${theme === "dark" ? "border-gold-500/15/70" : "border-paper-300"}`}
          >
            <div className="text-sm font-medium">{selectionSummary}</div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
              {selectedA && (
                <span className="px-2 py-0.5 rounded-full border border-gold-500/50 text-gold-500">
                  A
                </span>
              )}
              {selectedB && (
                <span className="px-2 py-0.5 rounded-full border border-gold-500/50 text-gold-500">
                  B
                </span>
              )}
            </div>
          </Card>

          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="text-xs font-bold uppercase tracking-widest opacity-70">
                {t.us.list_title}
              </div>
              {suggestionsLoading && (
                <div className="text-xs opacity-70">
                  {t.us.relationship_loading}
                </div>
              )}
            </div>
            <div
              className="max-h-[415px] overflow-y-auto space-y-3"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {profiles.length === 0 && (
                <div className="text-sm opacity-70">{t.us.empty_profiles}</div>
              )}
              {profiles.map((p) => {
                const selectedInA = selectedA?.id === p.id;
                const selectedInB = selectedB?.id === p.id;
                const selectedSlot = selectedInA
                  ? "A"
                  : selectedInB
                    ? "B"
                    : null;
                const selected = selectedInA || selectedInB;
                return (
                  <Card
                    key={p.id}
                    noPadding
                    className={`flex items-center gap-4 px-4 py-3 ${selected ? "border-gold-500/70 bg-gold-500/5" : ""}`}
                    onClick={() => handleSelectProfile(p)}
                  >
                    <button
                      type="button"
                      className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold uppercase transition-colors ${selected ? "bg-star-50 border-transparent text-space-950" : theme === "dark" ? "border-gold-500/15 text-space-600 hover:border-gold-500/60" : "border-paper-300 text-paper-400 hover:border-gold-500/60"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProfile(p);
                      }}
                    >
                      {selected ? "✓" : ""}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium truncate">{p.name}</div>
                        {p.id === "me" && (
                          <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-gold-500/40 text-gold-500">
                            {t.us.tag_me}
                          </span>
                        )}
                        {selectedSlot && (
                          <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-accent-200 text-paper-900">
                            {language === "zh"
                              ? `${selectedSlot}位`
                              : `Person ${selectedSlot}`}
                          </span>
                        )}
                        {selected && (
                          <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-gold-500/60 text-gold-500">
                            {t.us.btn_selected}
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {renderBig3(p.id)}
                      </div>
                    </div>
                    {p.id !== "me" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="text-xs uppercase tracking-widest px-2 py-1 rounded border border-space-500/70 text-star-200 hover:text-star-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(p);
                          }}
                        >
                          {t.us.btn_edit}
                        </button>
                        <button
                          className="text-xs uppercase tracking-widest px-2 py-1 rounded border border-danger/50 text-danger/80 hover:text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(p.id);
                          }}
                        >
                          {t.us.btn_delete}
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div
            className={`pt-[20px] pb-6 border-t shrink-0 ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
          >
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">
                  {t.us.relationship_label}
                </div>
                <div className="flex items-center gap-3">
                  <select
                    className={`w-full h-10 px-4 pr-8 rounded-lg outline-none transition-all font-sans text-sm appearance-none bg-no-repeat ${theme === "dark" ? "bg-space-900 border border-gold-500/15 text-star-50" : "bg-paper-100/85 border border-gold-600/40 text-paper-900"}`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundPosition: "right 12px center",
                      backgroundSize: "16px",
                    }}
                    value={relationshipType}
                    onChange={(e) => {
                      setRelationshipType(e.target.value);
                      setTypeLocked(true);
                    }}
                  >
                    {options.map((rt) => (
                      <option key={rt.key} value={rt.key}>
                        {language === "zh" ? rt.label_zh : rt.label_en}
                      </option>
                    ))}
                  </select>
                  {showTypeToggle && (
                    <button
                      className="text-xs uppercase tracking-widest opacity-70 hover:opacity-100 whitespace-nowrap"
                      onClick={() => setShowAllTypes((prev) => !prev)}
                    >
                      {showAllTypes
                        ? t.us.relationship_less
                        : t.us.relationship_more}
                    </button>
                  )}
                </div>
              </div>
              {/* 合盘配额显示 */}
              <div className="text-xs text-center mb-2 opacity-70">
                {LOGIN_GATE_MODE
                  ? language === "zh"
                    ? `今日剩余: ${synastryQuotaLeft}/3`
                    : `Today: ${synastryQuotaLeft}/3`
                  : language === "zh"
                    ? `剩余合盘次数: ${synastryQuotaLeft}`
                    : `Synastry readings left: ${synastryQuotaLeft}`}
              </div>
              <ActionButton
                onClick={handleGenerate}
                disabled={!selectedA || !selectedB || isGenerating}
                className="w-full h-10"
              >
                {t.us.btn_calculate}
              </ActionButton>
              {isGenerating && (
                <div className="text-xs uppercase tracking-widest text-center opacity-70">
                  {t.common.loading}
                </div>
              )}
              {generateError && (
                <div className="text-xs text-center text-danger/90">
                  {generateError}
                </div>
              )}
            </div>
          </div>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title={
              editingProfile ? t.us.modal_edit_title : t.us.modal_add_title
            }
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">
                  {t.us.label_name}
                </label>
                <GlassInput
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="syn-a-date-month"
                    className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block"
                  >
                    {t.onboarding.label_date}
                  </label>
                  <DateSelectGroup
                    value={formData.birthDate || ""}
                    onChange={(iso) =>
                      setFormData((prev) => ({
                        ...prev,
                        birthDate: iso,
                      }))
                    }
                    idPrefix="syn-a"
                    monthNames={monthNames}
                    className="grid grid-cols-[1.4fr_1fr_1fr] gap-2"
                    selectClassName={`w-full min-h-[44px] px-3 py-4 rounded-xl outline-none transition-all duration-300 ease-in-out font-sans text-sm ${
                      theme === "dark"
                        ? "bg-space-900/70 border border-gold-500/40 text-star-50 focus:border-accent focus:ring-1 focus:ring-accent/40"
                        : "bg-paper-100/85 border border-paper-400 text-paper-900 focus:border-accent focus:ring-1 focus:ring-accent/40"
                    }`}
                    labels={{
                      groupLabel: t.onboarding.label_date,
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">
                    {t.onboarding.label_time}
                  </label>
                  <TimeSelectGroup
                    value={formData.birthTime || ""}
                    onChange={(next, partial) => {
                      setTimePartial(partial);
                      setFormData((prev) => ({ ...prev, birthTime: next }));
                    }}
                    idPrefix="synastry-profile"
                    className="grid grid-cols-3 gap-2"
                    labels={
                      language === "zh"
                        ? {
                            hour: "时",
                            minute: "分",
                            meridiem: "上午或下午",
                            meridiemPlaceholder: "上午/下午",
                            am: "上午",
                            pm: "下午",
                            groupLabel: "出生时间",
                          }
                        : undefined
                    }
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">
                  {t.onboarding.label_city}
                </label>
                <GlassInput
                  value={cityQuery}
                  placeholder={t.onboarding.placeholder_city}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setCityQuery(nextValue);
                    openCitySuggestions();
                    setFormData((prev) => ({
                      ...prev,
                      birthCity: nextValue,
                      lat: undefined,
                      lon: undefined,
                      timezone: prev.timezone || profile.timezone,
                    }));
                  }}
                  onFocus={openCitySuggestions}
                  onBlur={() => setTimeout(closeCitySuggestions, 200)}
                  autoComplete="off"
                  {...cityInputProps}
                />
                {showCitySuggestions && cityQuery.trim() && (
                  <div
                    {...cityListboxProps}
                    className={`absolute z-10 w-full mt-1 rounded-lg border ${theme === "dark" ? "bg-space-800 border-gold-500/15" : "bg-paper-100/85 border-paper-300"} shadow-lg max-h-48 overflow-auto`}
                  >
                    {isSearchingCity ? (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === "zh" ? "搜索中..." : "Searching..."}
                      </div>
                    ) : citySuggestions.length > 0 ? (
                      citySuggestions.map((city, i) => {
                        const optionProps = getCityOptionProps(i);
                        const isActive = optionProps["aria-selected"];
                        return (
                          <div
                            key={i}
                            {...optionProps}
                            className={`px-4 py-2 cursor-pointer ${
                              theme === "dark"
                                ? isActive
                                  ? "bg-space-700"
                                  : "hover:bg-space-700"
                                : isActive
                                  ? "bg-paper-200/60"
                                  : "hover:bg-paper-200/60"
                            }`}
                            onMouseDown={(ev) => {
                              // onMouseDown fires before input.onBlur so the
                              // selection commits before the dropdown closes.
                              ev.preventDefault();
                              selectCityIndex(i);
                            }}
                          >
                            <div className="font-medium">
                              {language === "en"
                                ? city.enName || city.name
                                : city.name}
                            </div>
                            {city.province && city.province !== city.name && (
                              <div className="text-xs opacity-60">
                                {city.province}
                                {city.country ? `, ${city.country}` : ""}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : cityQuery.trim().length >=
                      getLocationQueryMinLength(cityQuery.trim()) ? (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === "zh"
                          ? "未找到匹配城市"
                          : "No matching cities found"}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === "zh"
                          ? "请输入至少1个中文字符或2个英文字符"
                          : "Please enter at least 2 characters"}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">
                  {t.us.label_current_location}
                </label>
                <GlassInput
                  value={currentLocationQuery}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setCurrentLocationQuery(nextValue);
                    openCurrentLocationSuggestions();
                    setFormData((prev) => ({
                      ...prev,
                      currentLocation: nextValue,
                    }));
                  }}
                  onFocus={openCurrentLocationSuggestions}
                  onBlur={() =>
                    setTimeout(closeCurrentLocationSuggestions, 200)
                  }
                  autoComplete="off"
                  {...currentLocationInputProps}
                />
                {showCurrentLocationSuggestions &&
                  currentLocationQuery.trim() && (
                    <div
                      {...currentLocationListboxProps}
                      className={`absolute z-10 w-full mt-1 rounded-lg border ${theme === "dark" ? "bg-space-800 border-gold-500/15" : "bg-paper-100/85 border-paper-300"} shadow-lg max-h-48 overflow-auto`}
                    >
                      {isSearchingCurrentLocation ? (
                        <div className="px-4 py-3 text-center text-sm opacity-70">
                          {language === "zh" ? "搜索中..." : "Searching..."}
                        </div>
                      ) : currentLocationSuggestions.length > 0 ? (
                        currentLocationSuggestions.map((city, i) => {
                          const optionProps = getCurrentLocationOptionProps(i);
                          const isActive = optionProps["aria-selected"];
                          return (
                            <div
                              key={i}
                              {...optionProps}
                              className={`px-4 py-2 cursor-pointer ${
                                theme === "dark"
                                  ? isActive
                                    ? "bg-space-700"
                                    : "hover:bg-space-700"
                                  : isActive
                                    ? "bg-paper-200/60"
                                    : "hover:bg-paper-200/60"
                              }`}
                              onMouseDown={(ev) => {
                                // onMouseDown fires before input.onBlur so the
                                // selection commits before the dropdown closes.
                                ev.preventDefault();
                                selectCurrentLocationIndex(i);
                              }}
                            >
                              <div className="font-medium">
                                {language === "en"
                                  ? city.enName || city.name
                                  : city.name}
                              </div>
                              {city.province && city.province !== city.name && (
                                <div className="text-xs opacity-60">
                                  {city.province}
                                  {city.country ? `, ${city.country}` : ""}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : currentLocationQuery.trim().length >=
                        getLocationQueryMinLength(
                          currentLocationQuery.trim(),
                        ) ? (
                        <div className="px-4 py-3 text-center text-sm opacity-70">
                          {language === "zh"
                            ? "未找到匹配城市"
                            : "No matching cities found"}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-center text-sm opacity-70">
                          {language === "zh"
                            ? "请输入至少1个中文字符或2个英文字符"
                            : "Please enter at least 2 characters"}
                        </div>
                      )}
                    </div>
                  )}
              </div>
              {timePartial && (
                <p className="mb-2 text-sm text-rose-400" role="alert">
                  {language === "zh"
                    ? "出生时间没填完（需要时、分、上午/下午）。补齐，或三项都留空表示未知。"
                    : "Birth time is incomplete — pick hour, minute and AM/PM, or leave all three blank."}
                </p>
              )}
              <ActionButton
                className="w-full"
                onClick={handleSaveProfile}
                disabled={
                  !formData.name ||
                  !formData.birthDate ||
                  !formData.birthCity ||
                  timePartial
                }
              >
                {editingProfile ? t.us.btn_edit : t.us.btn_add_profile}
              </ActionButton>
            </div>
          </Modal>
        </Container>
      </>
    );
};

export default ProfileSelectView;
