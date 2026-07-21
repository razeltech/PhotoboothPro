/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Volume2, VolumeX, RotateCw } from 'lucide-react';
import { synth } from '../utils/audio';

interface RetakeModalProps {
  index: number;
  template: string;
  photos: string[];
  onClose: () => void;
  onCapture: (capturedDataUrl: string) => void;
}

export default function RetakeModal({
  index,
  template,
  photos,
  onClose,
  onCapture,
}: RetakeModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // States
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [cameraRatio, setCameraRatio] = useState<'4:3' | '16:9' | '1:1'>('4:3');

  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize and get media devices list
  useEffect(() => {
    async function setupDevices() {
      try {
        const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        initialStream.getTracks().forEach((track) => track.stop());

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (err: any) {
        setHasPermission(false);
        setErrorMsg(err.message || 'Could not access camera. Please enable permissions.');
      }
    }
    setupDevices();

    return () => {
      stopCamera();
    };
  }, []);

  // Handle stream initialization when device ID changes or cameraRatio changes
  useEffect(() => {
    if (selectedDeviceId) {
      startCamera(selectedDeviceId, cameraRatio);
    }
  }, [selectedDeviceId, cameraRatio]);

  const startCamera = async (deviceId: string, ratioToUse?: '4:3' | '16:9' | '1:1') => {
    stopCamera();
    try {
      const activeRatio = ratioToUse || cameraRatio;
      let width = 960;
      let height = 720;
      if (activeRatio === '16:9') {
        width = 1280;
        height = 720;
      } else if (activeRatio === '1:1') {
        width = 720;
        height = 720;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      };
      const activeStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(activeStream);
      if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
      }
    } catch (err: any) {
      console.error('Error starting camera stream in RetakeModal:', err);
      setErrorMsg('Failed to bind selected camera.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDeviceId(devices[nextIndex].deviceId);
    if (soundEnabled) {
      synth.playBeep(600, 0.08);
    }
  };

  const triggerRetakeCapture = async () => {
    if (!stream || !videoRef.current) return;

    // 3-second countdown
    for (let count = 3; count > 0; count--) {
      setCountdown(count);
      if (soundEnabled) {
        synth.playBeep(880, 0.08); // warning tick
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    setCountdown(0);
    if (soundEnabled) {
      synth.playBeep(1200, 0.2); // Snap trigger indicator
    }

    // Capture frame
    const dataUrl = captureFrameFromVideo();
    
    // Play shutter and flash screen
    setIsFlashing(true);
    if (soundEnabled) {
      synth.playShutter();
    }
    
    await new Promise((r) => setTimeout(r, 400));
    setIsFlashing(false);
    setCountdown(null);

    if (dataUrl) {
      // Small cooldown before close to let user see captured frame
      await new Promise((r) => setTimeout(r, 600));
      onCapture(dataUrl);
    }
  };

  const captureFrameFromVideo = (): string | null => {
    if (!videoRef.current) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      const videoW = video.videoWidth || 640;
      const videoH = video.videoHeight || 480;
      
      let targetAspect = 4/3;
      if (cameraRatio === '16:9') {
        targetAspect = 16/9;
      } else if (cameraRatio === '1:1') {
        targetAspect = 1;
      }

      let drawW = videoW;
      let drawH = videoH;
      let sx = 0;
      let sy = 0;

      const currentAspect = videoW / videoH;
      if (currentAspect > targetAspect) {
        drawW = videoH * targetAspect;
        sx = (videoW - drawW) / 2;
      } else {
        drawH = videoW / targetAspect;
        sy = (videoH - drawH) / 2;
      }

      drawW = Math.round(drawW);
      drawH = Math.round(drawH);
      sx = Math.round(sx);
      sy = Math.round(sy);

      canvas.width = drawW;
      canvas.height = drawH;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, sx, sy, drawW, drawH, 0, 0, drawW, drawH);
      return canvas.toDataURL('image/jpeg', 0.95);
    } catch (err) {
      console.error('Error during video capture in RetakeModal:', err);
      return null;
    }
  };

  const generateMockStudioSnapshot = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Warm gradient background
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#FFE29F');
      grad.addColorStop(1, '#FFA99F');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);
      
      // Draw smiley face/selfie outline
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 10;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(320, 220, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(280, 200, 12, 0, Math.PI * 2);
      ctx.arc(360, 200, 12, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.beginPath();
      ctx.arc(320, 230, 45, 0, Math.PI);
      ctx.stroke();

      // Draw shiny elements
      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('❤️', 120, 120);
      ctx.fillText('🎈', 500, 140);
      ctx.fillText('📸', 480, 360);
      ctx.fillText('🍒', 140, 380);

      // Text label
      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = '#3F2C2A';
      ctx.textAlign = 'center';
      ctx.fillText(`MOCK RETAKE SNAP #${index + 1}`, 320, 400);
      
      // Stamp time
      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(63,44,42,0.6)';
      ctx.fillText(new Date().toLocaleTimeString(), 320, 430);
    }
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleSimulateCapture = () => {
    setIsFlashing(true);
    if (soundEnabled) {
      synth.playShutter();
    }
    setTimeout(() => {
      setIsFlashing(false);
      onCapture(generateMockStudioSnapshot());
    }, 400);
  };

  // Determine aspect ratio class
  const getAspectRatioClass = () => {
    if (cameraRatio === '16:9') return 'aspect-[16/9]';
    if (cameraRatio === '1:1') return 'aspect-square';
    return 'aspect-[4/3]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 flex flex-col text-zinc-900">
        
        {/* Header bar */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-display text-zinc-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-500 animate-pulse" />
              Retake Frame #{index + 1}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Customize settings and snap a fresh shot to swap into this slot.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer"
            title="Cancel retake"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Screen */}
        <div className="relative flex-1 bg-zinc-900 flex items-center justify-center overflow-hidden min-h-[320px] max-h-[460px]">
          
          {/* Flash screen layer overlay */}
          {isFlashing && (
            <div className="absolute inset-0 z-40 bg-white animate-flash pointer-events-none" />
          )}

          {/* Countdown Indicator Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex items-center justify-center select-none pointer-events-none">
              <div className="text-7xl font-display font-extrabold text-white animate-scale-up drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                {countdown === 0 ? '📸' : countdown}
              </div>
            </div>
          )}

          {/* Camera Frame Preview Container */}
          <div className={`relative w-full max-w-md ${getAspectRatioClass()} overflow-hidden bg-black shadow-inner`}>
            {hasPermission === false ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white/80">
                <p className="text-sm font-semibold mb-2">Camera Access Blocked</p>
                <p className="text-xs text-white/50 mb-4">{errorMsg}</p>
                <button
                  type="button"
                  onClick={handleSimulateCapture}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold font-mono rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                  Simulate Fresh Capture 📸
                </button>
              </div>
            ) : !stream ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white/60 p-6">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
                <p className="text-xs font-mono mb-4">Initializing camera lens...</p>
                <button
                  type="button"
                  onClick={handleSimulateCapture}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold font-mono rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                  Quick Bypass & Simulate 📸
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
              />
            )}
          </div>
        </div>

        {/* Toolbar & Controls Bar (Light Theme UI) */}
        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex flex-col gap-4">
          
          {/* Quick Settings Selector */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Left side: Quick Toggles */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  soundEnabled
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    Sound ON
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    Muted
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMirrored(!isMirrored)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isMirrored
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                }`}
              >
                Mirror View: {isMirrored ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Right side: Aspect Ratios / Lens settings */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Lens Ratio:
              </span>
              <div className="bg-white p-0.5 rounded-full border border-zinc-200 flex gap-1">
                {(['4:3', '16:9', '1:1'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCameraRatio(r)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight transition-all ${
                      cameraRatio === r
                        ? 'bg-emerald-500 text-white'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="p-1.5 rounded-full bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-600 transition-all ml-1"
                  title="Switch hardware camera"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="h-[1px] bg-zinc-200/50" />

          {/* Action Capture Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-zinc-200 hover:border-zinc-300 bg-white rounded-2xl text-zinc-700 hover:text-zinc-950 text-sm font-semibold transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={countdown !== null}
              onClick={stream ? triggerRetakeCapture : handleSimulateCapture}
              className="flex-1.5 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-sm tracking-wider transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {stream ? 'START 3S TIMER' : 'SIMULATE CAPTURE 📸'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
