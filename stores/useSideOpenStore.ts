import { create } from 'zustand';

interface State {
  sideOpened: boolean;
  toggleSideOpened: () => void;
}

export const useSideOpenStore = create<State>((set) => {
  return {
    sideOpened: false,
    toggleSideOpened: () => {
      set((state) => ({ sideOpened: !state.sideOpened }));
    },
  };
});
