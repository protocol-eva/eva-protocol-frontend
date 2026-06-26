import { create } from 'zustand'

interface AccountUiState {
  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

export const useAccountUiStore = create<AccountUiState>((set) => ({
  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}))
