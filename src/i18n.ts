import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      landing: {
        title: 'The Void',
        subtitle: 'Where stars whisper your truth',
        enter: 'Enter Ritual',
      },
      onboarding: {
        step: 'Ritual Step',
        step1: { title: 'State Your Name', placeholder: 'Your name...' },
        step2: { title: 'Birth Date & Time', date: 'Date', time: 'Time' },
        step3: { title: 'Birth Place', placeholder: 'City, Country...' },
        proceed: 'Proceed',
        seal: 'Seal Pact',
      },
      nav: {
        dashboard: 'Dashboard',
        profile: 'Profile',
        synastry: 'Synastry',
        oracle: 'Oracle',
        settings: 'Settings',
      },
      dashboard: {
        greeting: 'Cosmic Weather',
        quadrants: { power: 'Power', pressure: 'Pressure', trouble: 'Trouble', enjoy: 'Enjoy' },
        dos: "Do's", donts: "Don'ts",
        viewDetails: 'View Details',
      },
      profile: {
        natal: 'Natal Chart',
        updates: 'Cosmic Updates',
        themes: 'Life Themes',
        emotional: 'Emotional Pattern',
        gifts: 'Gifts',
        lessons: 'Lessons',
      },
      oracle: {
        title: 'The Oracle',
        online: 'Oracle Online',
        rituals: 'Rituals',
        categories: { self: 'Self', love: 'Love', career: 'Career', karma: 'Karma', timing: 'Timing' },
        placeholder: 'Ask the cosmos...',
        seal: 'Seal this Wisdom',
      },
      settings: {
        title: 'Settings',
        identity: 'Identity',
        language: 'Language',
        save: 'Save',
      },
    },
  },
  zh: {
    translation: {
      landing: {
        title: '太 虚',
        subtitle: '星辰低语，揭示真我',
        enter: '进入仪式',
      },
      onboarding: {
        step: '仪式步骤',
        step1: { title: '宣告你的名字', placeholder: '你的名字...' },
        step2: { title: '出生日期与时间', date: '日期', time: '时间' },
        step3: { title: '出生地点', placeholder: '城市, 国家...' },
        proceed: '继续',
        seal: '缔结契约',
      },
      nav: {
        dashboard: '控制台',
        profile: '档案',
        synastry: '合盘',
        oracle: '神谕',
        settings: '设置',
      },
      dashboard: {
        greeting: '宇宙天气',
        quadrants: { power: '力量', pressure: '压力', trouble: '困扰', enjoy: '享受' },
        dos: '宜', donts: '忌',
        viewDetails: '查看详情',
      },
      profile: {
        natal: '本命星盘',
        updates: '行运追踪',
        themes: '人生课题',
        emotional: '情绪模式',
        gifts: '天赋',
        lessons: '功课',
      },
      oracle: {
        title: '神谕',
        online: '神谕在线',
        rituals: '仪式次数',
        categories: { self: '自我', love: '爱情', career: '事业', karma: '业力', timing: '时机' },
        placeholder: '向宇宙提问...',
        seal: '封印智慧',
      },
      settings: {
        title: '设置',
        identity: '身份信息',
        language: '语言',
        save: '保存',
      },
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
