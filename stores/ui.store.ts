import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  upgradeModalOpen: boolean
  selectedLanguage: string
  setSidebarOpen: (open: boolean) => void
  setUpgradeModalOpen: (open: boolean) => void
  setLanguage: (lang: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  upgradeModalOpen: false,
  selectedLanguage: 'en',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setUpgradeModalOpen: (open) => set({ upgradeModalOpen: open }),
  setLanguage: (lang) => set({ selectedLanguage: lang }),
}))
