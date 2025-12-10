import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
  latitude: number
  longitude: number
  timezone: string
  language: 'en' | 'zh'
}

interface Store {
  user: User | null
  setUser: (user: User | null) => void
  updateUser: (data: Partial<User>) => void
  oracleRemaining: number
  decrementOracle: () => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (data) => set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
      oracleRemaining: 3,
      decrementOracle: () => set((s) => ({ oracleRemaining: Math.max(0, s.oracleRemaining - 1) })),
    }),
    { name: 'void-storage' }
  )
)
