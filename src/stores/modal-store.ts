import { create } from 'zustand';

type ModalType = 'quickAdd' | 'accountSettings' | 'debtForm' | null;

interface ModalState {
  // State
  activeModal: ModalType;
  quickAddType: 'income' | 'expense' | 'transfer';
  modalData: any; // For passing data to edit forms, etc.
  
  // Actions
  openModal: (type: ModalType, data?: any) => void;
  openQuickAdd: (type: 'income' | 'expense' | 'transfer') => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  quickAddType: 'expense',
  modalData: null,
  
  openModal: (type, data = null) => set({ activeModal: type, modalData: data }),
  openQuickAdd: (type) => set({ activeModal: 'quickAdd', quickAddType: type }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));