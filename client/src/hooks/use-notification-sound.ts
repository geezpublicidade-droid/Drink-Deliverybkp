import { useCallback, useRef } from 'react';
import notificationSoundUrl from '@assets/new-notification-026-380249_1765220299583.mp3';

interface UseNotificationSoundOptions {
  volume?: number;
}

export function useNotificationSound(options: UseNotificationSoundOptions = {}) {
  const { volume = 0.7 } = options;
  const isPlayingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const createAudio = useCallback(() => {
    const audio = new Audio(notificationSoundUrl);
    audio.volume = volume;
    return audio;
  }, [volume]);

  const playOnce = useCallback(() => {
    const audio = createAudio();
    audio.play().catch(() => {});
  }, [createAudio]);

  const playMultiple = useCallback(async (times: number = 5, delayMs: number = 800) => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    for (let i = 0; i < times; i++) {
      const audio = createAudio();
      await audio.play().catch(() => {});
      if (i < times - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    isPlayingRef.current = false;
  }, [createAudio]);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  return {
    playOnce,
    playMultiple,
    stopAll,
  };
}
