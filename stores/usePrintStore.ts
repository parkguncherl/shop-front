import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface PrintState {
  printInfo: string | undefined;
  setPrintInfo: (printInfo: string) => void;
}

interface PrintApiState {}

const initialStateCreator: StateCreator<PrintState & PrintApiState, any> = (set, get, api) => {
  return {
    printInfo: undefined,
    setPrintInfo: (printInfo: string) => {
      set((state) => ({
        printInfo: printInfo,
      }));
    },
  };
};
export const usePrintStore = create<PrintState & PrintApiState>()(devtools(immer(initialStateCreator)));
