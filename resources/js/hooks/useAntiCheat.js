import { useEffect } from 'react';
import { useExamStore } from '../store/examStore';
import { useUiStore } from '../store/uiStore';

export const useAntiCheat = (isEnabled = false) => {
  const reportCheat = useExamStore((state) => state.reportCheat);
  const addToast = useUiStore((state) => state.addToast);

  useEffect(() => {
    if (!isEnabled) return;

    // 1. Tab Change Detection (Visibility Change)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addToast('Warning: Tab switch detected! This event has been recorded.', 'error');
        reportCheat('tab_switch');
      }
    };

    // 2. Prevent Copy, Paste, Cut & Context Menu
    const preventKeys = (e) => {
      // Disable print screen, Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+Shift+I, F12
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'u')) ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        addToast('Shortcut disabled during the examination.', 'warning');
        reportCheat('copy_paste_attempt');
      }
    };

    const preventClipboard = (e) => {
      e.preventDefault();
      addToast('Copy/Paste operations are disabled.', 'warning');
      reportCheat('copy_paste_attempt');
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
    };

    // 3. Fullscreen check (Optionally enforce)
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addToast('Warning: You exited Fullscreen mode! Please enter fullscreen to proceed.', 'error');
        reportCheat('fullscreen_exit');
      }
    };

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', preventKeys);
    document.addEventListener('copy', preventClipboard);
    document.addEventListener('paste', preventClipboard);
    document.addEventListener('cut', preventClipboard);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', preventKeys);
      document.removeEventListener('copy', preventClipboard);
      document.removeEventListener('paste', preventClipboard);
      document.removeEventListener('cut', preventClipboard);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isEnabled, reportCheat, addToast]);

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  };

  return { requestFullscreen };
};
