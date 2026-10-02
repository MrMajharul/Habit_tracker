"use client";

import * as React from "react";
import {
  AlertCircle,
  Check,
  Download,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_RECITER_ID,
  downloadSurahAudio,
  getCachedSurahAudioBlob,
  getSavedAudioState,
  getSurahAudioUrls,
  RECITERS,
  removeDownloadedSurahAudio,
  saveAudioState,
  setupMediaSession,
  updateMediaPlaybackState,
} from "@/services/quran/quran-audio-service";
import type { SurahInfo } from "@/services/quran/quran-types";
import { cn } from "@/lib/utils";

interface QuranAudioPlayerProps {
  currentSurah: SurahInfo;
  onSelectSurah?: (surahNumber: number) => void;
  className?: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuranAudioPlayer({
  currentSurah,
  onSelectSurah,
  className,
}: QuranAudioPlayerProps) {
  const [selectedReciterId, setSelectedReciterId] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = getSavedAudioState();
      if (saved?.reciterId && RECITERS.some((r) => r.id === saved.reciterId)) {
        return saved.reciterId;
      }
    }
    return DEFAULT_RECITER_ID;
  });

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isCachedOffline, setIsCachedOffline] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [audioSrc, setAudioSrc] = React.useState<string>("");

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = React.useRef<string | null>(null);
  const isPendingPlayRef = React.useRef(false);
  const triedFallbackRef = React.useRef(false);
  const wasAutoAdvancingRef = React.useRef(false);
  const onSelectSurahRef = React.useRef(onSelectSurah);

  React.useEffect(() => {
    onSelectSurahRef.current = onSelectSurah;
  }, [onSelectSurah]);

  const selectedReciter =
    RECITERS.find((r) => r.id === selectedReciterId) ?? RECITERS[0];

  // Resolve audio source (cached blob or remote primary CDN) when Surah or Reciter changes
  React.useEffect(() => {
    let cancelled = false;
    triedFallbackRef.current = false;

    async function initAudioSource() {
      // Clean up previous blob URL if any
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }

      try {
        const cachedBlob = await getCachedSurahAudioBlob(currentSurah.number, selectedReciterId);
        if (cancelled) return;

        setError(null);
        setIsLoading(false);

        // Restore saved time if available for this surah and reciter
        const saved = getSavedAudioState();
        if (saved && saved.surahNumber === currentSurah.number && saved.reciterId === selectedReciterId) {
          setCurrentTime(saved.currentTime);
        } else {
          setCurrentTime(0);
        }
        setDuration(0);

        if (cachedBlob) {
          setIsCachedOffline(true);
          const blobUrl = URL.createObjectURL(cachedBlob);
          activeBlobUrlRef.current = blobUrl;
          setAudioSrc(blobUrl);
        } else {
          setIsCachedOffline(false);
          const { primary } = getSurahAudioUrls(currentSurah.number, selectedReciterId);
          setAudioSrc(primary);
        }
      } catch {
        if (!cancelled) {
          setError(null);
          setIsLoading(false);
          setCurrentTime(0);
          setDuration(0);
          const { primary } = getSurahAudioUrls(currentSurah.number, selectedReciterId);
          setAudioSrc(primary);
        }
      }

      // If user was auto-advancing from the previous Surah ending, resume playback
      if (wasAutoAdvancingRef.current) {
        wasAutoAdvancingRef.current = false;
        setTimeout(() => {
          if (audioRef.current && !cancelled) {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
              updateMediaPlaybackState("playing");
            }).catch(() => {
              setIsPlaying(false);
            });
          }
        }, 150);
      }
    }

    initAudioSource();

    return () => {
      cancelled = true;
    };
  }, [currentSurah.number, selectedReciterId]);

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      updateMediaPlaybackState("none");
    };
  }, []);

  // Setup Media Session API for lock-screen / control center controls
  React.useEffect(() => {
    setupMediaSession(
      currentSurah.englishName,
      currentSurah.englishNameTranslation,
      currentSurah.arabicName,
      selectedReciter.name,
      {
        onPlay: () => {
          if (audioRef.current) {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
              updateMediaPlaybackState("playing");
            }).catch(() => {});
          }
        },
        onPause: () => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            updateMediaPlaybackState("paused");
          }
        },
        onPrevious: () => {
          if (currentSurah.number > 1 && onSelectSurahRef.current) {
            onSelectSurahRef.current(currentSurah.number - 1);
          }
        },
        onNext: () => {
          if (currentSurah.number < 114 && onSelectSurahRef.current) {
            onSelectSurahRef.current(currentSurah.number + 1);
          }
        },
        onSeekTo: ({ seekTime }) => {
          if (audioRef.current && !isNaN(seekTime)) {
            audioRef.current.currentTime = seekTime;
            setCurrentTime(seekTime);
          }
        },
      },
    );
  }, [
    currentSurah.number,
    currentSurah.englishName,
    currentSurah.englishNameTranslation,
    currentSurah.arabicName,
    selectedReciter.name,
  ]);

  // Play / Pause toggle with immediate user gesture unlock
  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      updateMediaPlaybackState("paused");
    } else {
      if (isPendingPlayRef.current) return;
      isPendingPlayRef.current = true;
      setIsLoading(true);

      try {
        // Ensure src is bound
        if (!audio.src && audioSrc) {
          audio.src = audioSrc;
        }
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
        updateMediaPlaybackState("playing");
      } catch (err: unknown) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        if (!isAbort) {
          console.warn("Audio playback error:", err);
          // Try fallback CDN immediately if primary failed
          const { fallback } = getSurahAudioUrls(currentSurah.number, selectedReciterId);
          if (fallback && !audio.src.includes(fallback) && !triedFallbackRef.current) {
            triedFallbackRef.current = true;
            setAudioSrc(fallback);
            try {
              audio.src = fallback;
              await audio.play();
              setIsPlaying(true);
              setIsLoading(false);
              updateMediaPlaybackState("playing");
              return;
            } catch (fbErr) {
              console.warn("Audio fallback error:", fbErr);
            }
          }
          setError("Audio stream unavailable. Please check your network connection.");
        }
        setIsPlaying(false);
        setIsLoading(false);
      } finally {
        isPendingPlayRef.current = false;
      }
    }
  };

  const handleSeek = (targetTime: number) => {
    if (!audioRef.current || isNaN(targetTime)) return;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !audioRef.current.muted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (audio.duration && !isNaN(audio.duration) && audio.duration !== duration) {
      setDuration(audio.duration);
    }
    // Save state periodically (every 5 seconds)
    if (Math.floor(audio.currentTime) % 5 === 0) {
      saveAudioState({
        surahNumber: currentSurah.number,
        currentTime: audio.currentTime,
        reciterId: selectedReciterId,
      });
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && !isNaN(audio.duration)) {
      setDuration(audio.duration);
    }
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsLoading(false);
    updateMediaPlaybackState("paused");
    // Auto-advance to next surah if available
    if (currentSurah.number < 114 && onSelectSurahRef.current) {
      wasAutoAdvancingRef.current = true;
      onSelectSurahRef.current(currentSurah.number + 1);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    // Switch to fallback CDN if primary fails
    const { fallback } = getSurahAudioUrls(currentSurah.number, selectedReciterId);
    if (fallback && !audioSrc.includes(fallback) && !triedFallbackRef.current) {
      triedFallbackRef.current = true;
      setAudioSrc(fallback);
      if (audioRef.current) {
        audioRef.current.src = fallback;
      }
    } else {
      setError("Audio stream unavailable. Please check your network connection.");
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setError(null);
    try {
      await downloadSurahAudio(currentSurah.number, selectedReciterId);
      setIsCachedOffline(true);
      // Immediately switch audio source to the offline cached blob
      const cachedBlob = await getCachedSurahAudioBlob(currentSurah.number, selectedReciterId);
      if (cachedBlob) {
        if (activeBlobUrlRef.current) {
          URL.revokeObjectURL(activeBlobUrlRef.current);
        }
        const blobUrl = URL.createObjectURL(cachedBlob);
        activeBlobUrlRef.current = blobUrl;
        setAudioSrc(blobUrl);
      }
      toast.success(`${currentSurah.englishName} downloaded for offline listening`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      toast.error(msg);
      setError(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemoveDownload = async () => {
    try {
      await removeDownloadedSurahAudio(currentSurah.number, selectedReciterId);
      setIsCachedOffline(false);
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      const { primary } = getSurahAudioUrls(currentSurah.number, selectedReciterId);
      setAudioSrc(primary);
      toast.info(`${currentSurah.englishName} removed from offline storage`);
    } catch {
      toast.error("Failed to remove offline audio");
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 transition-all",
        className,
      )}
    >
      {/* Declarative HTML5 Audio Element in DOM tree */}
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        preload="metadata"
        playsInline
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
          updateMediaPlaybackState("playing");
        }}
        onPause={() => {
          setIsPlaying(false);
          updateMediaPlaybackState("paused");
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onCanPlay={() => setIsLoading(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
      />

      <div className="flex flex-col gap-3">
        {/* Top row: Reciter selector + offline download badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Reciter:</span>
            <select
              value={selectedReciterId}
              onChange={(e) => {
                const nextReciter = e.target.value;
                setSelectedReciterId(nextReciter);
                saveAudioState({
                  surahNumber: currentSurah.number,
                  currentTime: 0,
                  reciterId: nextReciter,
                });
              }}
              className="h-8 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.style})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {isCachedOffline ? (
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] gap-1 py-0.5"
                >
                  <Check className="size-3" />
                  Offline Ready
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={handleRemoveDownload}
                  title="Remove offline copy"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 font-medium cursor-pointer"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="size-3.5" />
                    <span>Download Offline</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-destructive hover:bg-destructive/20 cursor-pointer"
              onClick={togglePlayPause}
            >
              <RotateCcw className="size-3 mr-1" /> Retry
            </Button>
          </div>
        )}

        {/* Middle row: Progress slider + Time */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            step={1}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            aria-label="Audio progress"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>

        {/* Bottom row: Playback controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
              disabled={currentSurah.number <= 1}
              onClick={() => onSelectSurahRef.current?.(currentSurah.number - 1)}
              title="Previous Surah"
            >
              <SkipBack className="size-4" />
            </Button>

            <Button
              size="icon"
              className="size-10 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
              onClick={togglePlayPause}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause recitation" : "Play recitation"}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
              disabled={currentSurah.number >= 114}
              onClick={() => onSelectSurahRef.current?.(currentSurah.number + 1)}
              title="Next Surah"
            >
              <SkipForward className="size-4" />
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold text-foreground">
              {currentSurah.number}. {currentSurah.englishName}
            </p>
            <p className="text-[11px] text-muted-foreground font-arabic">
              {currentSurah.arabicName}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
