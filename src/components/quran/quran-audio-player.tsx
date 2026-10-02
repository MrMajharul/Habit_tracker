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
  getSavedAudioState,
  getSurahAudioUrls,
  isSurahAudioCached,
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

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const selectedReciter =
    RECITERS.find((r) => r.id === selectedReciterId) ?? RECITERS[0];

  // Check offline status when surah or reciter changes
  React.useEffect(() => {
    let cancelled = false;
    async function checkCache() {
      const cached = await isSurahAudioCached(currentSurah.number, selectedReciterId);
      if (!cancelled) {
        setIsCachedOffline(cached);
      }
    }
    checkCache();
    return () => {
      cancelled = true;
    };
  }, [currentSurah.number, selectedReciterId]);

  // Audio element setup and event handlers
  React.useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = "metadata";

    const { primary } = getSurahAudioUrls(currentSurah.number, selectedReciterId);
    audio.src = primary;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
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
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      updateMediaPlaybackState("paused");
      // Auto-play next surah if available
      if (currentSurah.number < 114 && onSelectSurah) {
        onSelectSurah(currentSurah.number + 1);
      }
    };
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      // Try fallback URL if primary fails
      const { fallback } = getSurahAudioUrls(currentSurah.number, selectedReciterId);
      if (fallback && audio.src !== fallback) {
        audio.src = fallback;
        audio.load();
      } else {
        setError("Audio stream unavailable. Please check your network connection.");
      }
    };

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, [currentSurah.number, selectedReciterId, onSelectSurah]);

  // Setup Media Session API for OS lock screen / background controls
  React.useEffect(() => {
    setupMediaSession(
      currentSurah.englishName,
      currentSurah.englishNameTranslation,
      currentSurah.arabicName,
      selectedReciter.name,
      {
        onPlay: () => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        },
        onPause: () => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        },
        onPrevious: () => {
          if (currentSurah.number > 1 && onSelectSurah) {
            onSelectSurah(currentSurah.number - 1);
          }
        },
        onNext: () => {
          if (currentSurah.number < 114 && onSelectSurah) {
            onSelectSurah(currentSurah.number + 1);
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
  }, [currentSurah, selectedReciter, onSelectSurah]);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    setError(null);

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      updateMediaPlaybackState("paused");
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        updateMediaPlaybackState("playing");
      } catch (err) {
        console.warn("Audio playback error:", err);
        setError("Could not play audio. Tap to retry.");
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current || !value[0]) return;
    const target = value[0];
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setError(null);
    try {
      await downloadSurahAudio(currentSurah.number, selectedReciterId);
      setIsCachedOffline(true);
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
      <div className="flex flex-col gap-3">
        {/* Top row: Reciter selector + offline download badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Reciter:</span>
            <select
              value={selectedReciterId}
              onChange={(e) => {
                setSelectedReciterId(e.target.value);
                saveAudioState({
                  surahNumber: currentSurah.number,
                  currentTime: 0,
                  reciterId: e.target.value,
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
                  className="size-7 text-muted-foreground hover:text-destructive"
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
                className="h-7 text-xs gap-1.5 font-medium"
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
              className="h-6 px-2 text-xs text-destructive hover:bg-destructive/20"
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
            max={duration || 100}
            step={1}
            value={currentTime}
            onChange={(e) => handleSeek([Number(e.target.value)])}
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
              className="size-8 text-muted-foreground hover:text-foreground"
              disabled={currentSurah.number <= 1}
              onClick={() => onSelectSurah && onSelectSurah(currentSurah.number - 1)}
              title="Previous Surah"
            >
              <SkipBack className="size-4" />
            </Button>

            <Button
              size="icon"
              className="size-10 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-transform active:scale-95"
              onClick={togglePlayPause}
              disabled={isLoading && !isPlaying}
              title={isPlaying ? "Pause" : "Play"}
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
              className="size-8 text-muted-foreground hover:text-foreground"
              disabled={currentSurah.number >= 114}
              onClick={() => onSelectSurah && onSelectSurah(currentSurah.number + 1)}
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
              className="size-8 text-muted-foreground hover:text-foreground"
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
