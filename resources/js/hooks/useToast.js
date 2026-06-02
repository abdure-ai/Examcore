import { useUiStore } from '../store/uiStore';

export const useToast = () => {
  const addToast = useUiStore((state) => state.addToast);
  
  return {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info')
  };
};
