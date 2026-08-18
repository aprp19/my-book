import { create } from "zustand";

interface ReaderState {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  reset: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  currentPage: 0,
  totalPages: 0,
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),
  nextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages - 1) {
      set({ currentPage: currentPage + 1 });
    }
  },
  previousPage: () => {
    const { currentPage } = get();
    if (currentPage > 0) {
      set({ currentPage: currentPage - 1 });
    }
  },
  reset: () => set({ currentPage: 0, totalPages: 0 }),
}));
