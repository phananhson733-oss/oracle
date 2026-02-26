// INPUT: City search utilities, UI components, i18n translations.
// OUTPUT: Three-step onboarding flow (birth date, location, name) that produces a UserProfile.
// POS: Onboarding page component; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { Container, ActionButton, GlassInput, useTheme, useLanguage } from '../components/UIComponents';
import * as T from '../types';
import { searchCities as searchCitiesLocal, formatCityDisplay, getCityCoordinates, type City } from '../utils/city-search';
import { getLocationQueryMinLength } from '../utils/astro-helpers';

const OnboardingPage: React.FC<{ onComplete: (p: T.UserProfile) => void }> = ({ onComplete }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<T.UserProfile>>({ accuracyLevel: 'exact', focusTags: [], timezone: '' });
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmedQuery = cityQuery.trim();
    const minLength = getLocationQueryMinLength(trimmedQuery);
    if (trimmedQuery.length < minLength) {
      setCitySuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      const results = searchCitiesLocal(trimmedQuery, 5, language);
      setCitySuggestions(results);
      setIsSearching(false);
    }, 300);
    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [cityQuery, language]);

  const headingClass = theme === 'dark' ? "text-star-50" : "text-paper-900";
  const labelClass = "text-xs font-bold uppercase tracking-widest opacity-80 mb-2 block";

  return (
    <Container className="flex items-center justify-center !pt-0">
      <div className="w-full max-w-md">
        <div className="mb-8 flex gap-2 justify-center">
            {[1,2,3].map(i => <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-gold-500' : (theme === 'dark' ? 'bg-space-900/60' : 'bg-paper-300')}`} />)}
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className={`text-3xl font-serif font-medium mb-8 text-center ${headingClass}`}>{t.onboarding.step_birth}</h2>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>{t.onboarding.label_date}</label>
                <GlassInput type="date" onChange={e => setData({...data, birthDate: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>{t.onboarding.label_time}</label>
                <GlassInput type="time" onChange={e => setData({...data, birthTime: e.target.value})} />
              </div>
              <div className="flex items-center gap-3 pt-2 opacity-90 hover:opacity-100 transition-opacity">
                <input type="checkbox" className="accent-gold-500 w-4 h-4 rounded cursor-pointer" onChange={e => setData({...data, accuracyLevel: e.target.checked ? 'time_unknown' : 'exact'})}/>
                <label className="text-sm cursor-pointer">{t.onboarding.label_unknown}</label>
              </div>
            </div>
            <ActionButton className="mt-10 w-full max-w-xs mx-auto" onClick={() => setStep(2)} disabled={!data.birthDate}>{t.onboarding.btn_next}</ActionButton>
          </div>
        )}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className={`text-3xl font-serif font-medium mb-8 text-center ${headingClass}`}>{t.onboarding.step_loc}</h2>
            <div className="mb-8 relative">
                <label className={labelClass}>{t.onboarding.label_city}</label>
                <GlassInput
                  placeholder={t.onboarding.placeholder_city}
                  value={cityQuery}
                  onChange={e => {
                    const nextValue = e.target.value;
                    setCityQuery(nextValue);
                    setShowSuggestions(true);
                    setData(prev => ({
                      ...prev,
                      birthCity: nextValue,
                      lat: undefined,
                      lon: undefined,
                      timezone: '',
                    }));
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && cityQuery.trim() && (
                  <div className={`absolute z-10 w-full mt-1 rounded-lg border ${theme === 'dark' ? 'bg-space-800 border-gold-500/15' : 'bg-paper-100/85 border-gold-600/30'} shadow-lg max-h-48 overflow-auto`}>
                    {isSearching ? (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === 'zh' ? '搜索中...' : 'Searching...'}
                      </div>
                    ) : citySuggestions.length > 0 ? (
                      citySuggestions.map((city, i) => {
                        const displayLabel = formatCityDisplay(city, language);
                        const coords = getCityCoordinates(city);
                        return (
                          <div
                            key={i}
                            className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? 'hover:bg-space-700' : 'hover:bg-paper-200/60'}`}
                            onMouseDown={() => {
                              setCityQuery(displayLabel);
                              setData((prev) => ({ ...prev, birthCity: displayLabel, lat: coords.lat, lon: coords.lon, timezone: coords.timezone }));
                              setShowSuggestions(false);
                            }}
                          >
                            <div className="font-medium">{language === 'en' ? (city.enName || city.name) : city.name}</div>
                            {city.province && city.province !== city.name && (
                              <div className="text-xs opacity-70">{city.province}{city.country ? `, ${city.country}` : ''}</div>
                            )}
                          </div>
                        );
                      })
                    ) : cityQuery.trim().length >= getLocationQueryMinLength(cityQuery.trim()) ? (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === 'zh' ? '未找到匹配城市' : 'No matching cities found'}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === 'zh'
                          ? '请输入至少1个中文字符或2个英文字符'
                          : 'Please enter at least 2 characters'}
                      </div>
                    )}
                  </div>
                )}
            </div>
            <ActionButton className="w-full max-w-xs mx-auto" onClick={() => setStep(3)} disabled={!cityQuery.trim()}>{t.onboarding.btn_next}</ActionButton>
          </div>
        )}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className={`text-3xl font-serif font-medium mb-2 text-center ${headingClass}`}>
                {language === 'zh' ? '该如何称呼你?' : 'What should we call you?'}
            </h2>
            <p className="text-center opacity-80 mb-8 text-sm">
                {language === 'zh' ? '我们将为你生成专属的星盘报告。' : 'We will generate a personalized chart report for you.'}
            </p>
            <div className="mb-8">
                <label className={labelClass}>{language === 'zh' ? '你的名字' : 'Your Name'}</label>
                <GlassInput
                    placeholder={language === 'zh' ? '例如：Alex' : 'e.g. Alex'}
                    onChange={e => setData({...data, name: e.target.value})}
                />
            </div>
            <ActionButton className="w-full max-w-xs mx-auto" onClick={() => onComplete(data as T.UserProfile)} disabled={!data.name}>{t.onboarding.btn_analyze}</ActionButton>
          </div>
        )}
      </div>
    </Container>
  );
};

export default OnboardingPage;
