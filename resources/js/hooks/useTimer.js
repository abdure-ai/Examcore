import { useEffect, useRef } from 'react';
import { useExamStore } from '../store/examStore';

export const useTimer = (onExpire) => {
  const { remainingSeconds, decrementTimer, activeSession } = useExamStore();
  const onExpireRef   = useRef(onExpire);
  const hasExpiredRef = useRef(false); // prevent onExpire firing more than once per session

  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Reset the guard whenever a fresh session loads with time remaining
  useEffect(() => {
    if (remainingSeconds > 0) hasExpiredRef.current = false;
  }, [remainingSeconds]);

  // Countdown tick
  useEffect(() => {
    if (!activeSession || remainingSeconds <= 0) return;
    const timer = setInterval(() => decrementTimer(), 1000);
    return () => clearInterval(timer);
  }, [activeSession, remainingSeconds, decrementTimer]);

  // Expire — fires exactly once per session
  useEffect(() => {
    if (activeSession && remainingSeconds === 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpireRef.current?.();
    }
  }, [activeSession, remainingSeconds]);

  const formatTime = () => {
    const h = Math.floor(remainingSeconds / 3600);
    const m = Math.floor((remainingSeconds % 3600) / 60);
    const s = remainingSeconds % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ].filter(Boolean).join(':');
  };

  return {
    remainingSeconds,
    formatTime,
    isCritical: remainingSeconds > 0 && remainingSeconds < 300,
  };
};
