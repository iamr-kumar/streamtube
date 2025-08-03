import { useState } from "react";

interface ModalState {
  isOpen: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

export const useModal = (initialState: Partial<ModalState> = {}) => {
  const [state, setState] = useState<ModalState>({
    isOpen: false,
    isLoading: false,
    isSuccess: false,
    error: null,
    ...initialState,
  });

  const openModal = () => {
    setState({
      isOpen: true,
      isLoading: false,
      isSuccess: false,
      error: null,
    });
  };

  const closeModal = () => {
    setState({
      isOpen: false,
      isLoading: false,
      isSuccess: false,
      error: null,
    });
  };

  const setLoading = (isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  };

  const setSuccess = (isSuccess: boolean) => {
    setState((prev) => ({ ...prev, isSuccess, isLoading: false }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  };

  const resetModal = () => {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      isSuccess: false,
      error: null,
    }));
  };

  return {
    // State
    ...state,

    // Actions
    openModal,
    closeModal,
    setLoading,
    setSuccess,
    setError,
    resetModal,
  };
};
