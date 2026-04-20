"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Rewind, FastForward, Volume2, VolumeX } from "lucide-react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function AudioPlayerCard({
  src,
  fallbackDuration = 0,
}: {
  src: string;
  fallbackDuration?: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration);
  const probedRef = useRef(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      if (!dragging) setCurrentTime(audio.currentTime);
    };
    const onLoaded = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        probedRef.current = true;
      } else if (!probedRef.current) {
        // MediaRecorder webm: duration is Infinity until we force a full scan.
        // Seeking past the end makes the browser read the whole file and
        // compute the real duration, which fires durationchange.
        probedRef.current = true;
        const onProbed = () => {
          if (isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
          }
          audio.currentTime = 0;
          audio.removeEventListener("durationchange", onProbed);
        };
        audio.addEventListener("durationchange", onProbed);
        audio.currentTime = Number.MAX_SAFE_INTEGER;
      }
    };
    const onEnd = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("durationchange", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("durationchange", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, [dragging]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function skip(delta: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  }

  function cycleSpeed() {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  function seekFromEvent(clientX: number) {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const t = pct * duration;
    setCurrentTime(t);
    audio.currentTime = t;
  }

  function onScrubStart(e: React.PointerEvent) {
    setDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    seekFromEvent(e.clientX);
  }

  function onScrubMove(e: React.PointerEvent) {
    if (!dragging) return;
    seekFromEvent(e.clientX);
  }

  function onScrubEnd(e: React.PointerEvent) {
    setDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  function onVolumeChange(v: number) {
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
      if (v > 0 && audioRef.current.muted) {
        audioRef.current.muted = false;
        setMuted(false);
      }
    }
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="mb-4">
      <CardContent className="pt-5 pb-5">
        <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

        {/* Scrubber */}
        <div
          ref={progressRef}
          onPointerDown={onScrubStart}
          onPointerMove={onScrubMove}
          onPointerUp={onScrubEnd}
          onPointerCancel={onScrubEnd}
          className="group relative h-2 w-full rounded-full bg-muted cursor-pointer touch-none"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-primary shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Times */}
        <div className="flex justify-between mt-1.5 text-xs font-mono text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="h-9 w-9"
              title="Back 10s"
            >
              <Rewind className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={togglePlay}
              className="h-11 w-11 rounded-full"
            >
              {playing ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="h-9 w-9"
              title="Forward 10s"
            >
              <FastForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cycleSpeed}
              className="h-8 px-2.5 font-mono text-xs tabular-nums"
              title="Playback speed"
            >
              {speed}x
            </Button>
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-20 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
