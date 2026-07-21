/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Film, Volume2, VolumeX, AlertCircle, ArrowLeft, Zap, ZapOff } from 'lucide-react';
import { synth } from '../utils/audio';
import { TemplateType } from '../types';

interface CameraViewProps {
  onPhotosCaptured: (photos: string[], videoBlobUrl: string | null) => void;
  requiredPhotosCount: number;
  selectedTemplate?: TemplateType;
  onBack: () => void;
  onLockChange?: (isLocked: boolean) => void;
}

export default function CameraView({
  onPhotosCaptured,
  requiredPhotosCount,
  selectedTemplate = 'strip',
  onBack,
  onLockChange,
}: CameraViewProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Settings
  const [countdownStart, setCountdownStart] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [recordBtsVideo, setRecordBtsVideo] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(true);
  const [cameraRatio, setCameraRatio] = useState<'4:3' | '16:9' | '1:1'>('4:3');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Flow State
  const [isCapturingFlow, setIsCapturingFlow] = useState<boolean>(false);
  const [currentCaptureIndex, setCurrentCaptureIndex] = useState<number>(-1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [capturedPreviews, setCapturedPreviews] = useState<string[]>([]);
  const [recentSnapshot, setRecentSnapshot] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const flowTimerRef = useRef<any>(null);

  // References to keep state updated in high performance canvas animation loop
  const isFlashingRef = useRef<boolean>(false);
  const btsLoopIdRef = useRef<number | null>(null);
  const latestCapturedPhotoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    isFlashingRef.current = isFlashing;
  }, [isFlashing]);

  // Synchronize flash toggle to device torch (flashlight) if available
  useEffect(() => {
    if (!stream || isSimulating) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities() as any;
      if (capabilities && 'torch' in capabilities) {
        track.applyConstraints({
          advanced: [{ torch: flashEnabled } as any]
        });
      }
    } catch (e) {
      console.warn("Torch flashlight is not supported or locked on this stream:", e);
    }
  }, [flashEnabled, stream, isSimulating]);

  useEffect(() => {
    if (onLockChange) {
      onLockChange(isCapturingFlow);
    }
  }, [isCapturingFlow, onLockChange]);

  useEffect(() => {
    return () => {
      if (btsLoopIdRef.current) {
        clearInterval(btsLoopIdRef.current);
      }
    };
  }, []);

  // Sync stream to video element srcObject once stream changes and video element mounts
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    if (devices.length > 1) {
      const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setSelectedDeviceId(devices[nextIndex].deviceId);
    } else {
      startCamera('', cameraRatio, nextFacing);
    }
    if (soundEnabled) {
      synth.playBeep(600, 0.08);
    }
  };

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

  const startCamera = async (deviceId: string, ratioToUse?: '4:3' | '16:9' | '1:1', currentFacing?: 'user' | 'environment') => {
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

      const fMode = currentFacing || facingMode;
      let activeStream: MediaStream;

      try {
        // Try with ideal resolution and ideal deviceId first to avoid exact constraints failures
        const videoConstraints: any = {
          width: { ideal: width },
          height: { ideal: height },
        };
        if (deviceId) {
          videoConstraints.deviceId = { ideal: deviceId };
        } else {
          videoConstraints.facingMode = { ideal: fMode };
        }
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch (firstErr) {
        console.warn('Initial camera constraints failed, attempting relaxed fallback constraints...', firstErr);
        try {
          // Fallback 1: Try without dimensions, just deviceId/facingMode
          const videoConstraints: any = {};
          if (deviceId) {
            videoConstraints.deviceId = { ideal: deviceId };
          } else {
            videoConstraints.facingMode = { ideal: fMode };
          }
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false,
          });
        } catch (secondErr) {
          console.warn('Fallback constraints failed, seeking any valid video source...', secondErr);
          // Fallback 2: Grab the standard default available video source
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      setStream(activeStream);
      if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
      }
    } catch (err: any) {
      console.error('Error starting camera stream:', err);
      setErrorMsg('Failed to bind selected camera.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Run whole session capture sequence
  const startCaptureSession = async () => {
    if (!isSimulating && (!stream || !videoRef.current)) return;

    setIsCapturingFlow(true);
    setCapturedPreviews([]);
    setRecentSnapshot(null);
    videoChunksRef.current = [];

    // Start Recording Behind-The-Scenes Video if selected
    let btsStream: MediaStream | null = null;
    let btsLoopId: number | null = null;

    if (recordBtsVideo && !isSimulating) {
      try {
        const video = videoRef.current;
        const videoW = video.videoWidth || 640;
        const videoH = video.videoHeight || 480;
        
        let targetAspect = 4/3;
        if (cameraRatio === '16:9') {
          targetAspect = 16/9;
        } else if (cameraRatio === '1:1') {
          targetAspect = 1;
        }

        let btsW = videoW;
        let btsH = videoH;
        let sx = 0;
        let sy = 0;

        const currentAspect = videoW / videoH;
        if (currentAspect > targetAspect) {
          btsW = videoH * targetAspect;
          sx = (videoW - btsW) / 2;
        } else {
          btsH = videoW / targetAspect;
          sy = (videoH - btsH) / 2;
        }

        btsW = Math.round(btsW);
        btsH = Math.round(btsH);
        sx = Math.round(sx);
        sy = Math.round(sy);

        const btsCanvas = document.createElement('canvas');
        btsCanvas.width = btsW;
        btsCanvas.height = btsH;
        const btsCtx = btsCanvas.getContext('2d');

        if (btsCtx) {
          const btsStartTime = Date.now();

          const drawBtsFrame = () => {
            if (!videoRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
              return;
            }

            // Draw background video frame with proper cropping!
            btsCtx.save();
            if (isMirrored) {
              btsCtx.translate(btsCanvas.width, 0);
              btsCtx.scale(-1, 1);
            }
            btsCtx.drawImage(video, sx, sy, btsW, btsH, 0, 0, btsW, btsH);
            btsCtx.restore();

            // Draw "Razel Tech" Watermark (styled elegantly with opacity and drop shadow)
            btsCtx.save();
            btsCtx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            btsCtx.shadowBlur = 6;
            btsCtx.shadowOffsetY = 2;
            btsCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            btsCtx.font = 'bold 16px "Inter", sans-serif';
            btsCtx.textAlign = 'right';
            btsCtx.textBaseline = 'bottom';
            btsCtx.fillText('Razel Tech', btsCanvas.width - 20, btsCanvas.height - 20);
            btsCtx.restore();

            // Draw real-time ticking timecode timer
            const elapsedMs = Date.now() - btsStartTime;
            const minutes = Math.floor(elapsedMs / 60000);
            const seconds = Math.floor((elapsedMs % 60000) / 1000);
            const ms = Math.floor((elapsedMs % 1000) / 10);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;

            btsCtx.save();
            btsCtx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            btsCtx.shadowBlur = 6;
            btsCtx.shadowOffsetY = 2;

            // Red REC dot blinking
            const isBlinking = Math.floor(elapsedMs / 500) % 2 === 0;
            if (isBlinking) {
              btsCtx.fillStyle = '#EF4444'; // Red-500
              btsCtx.beginPath();
              btsCtx.arc(25, 25, 6, 0, Math.PI * 2);
              btsCtx.fill();
            }

            btsCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            btsCtx.font = 'bold 15px monospace';
            btsCtx.textAlign = 'left';
            btsCtx.textBaseline = 'middle';
            btsCtx.fillText(`REC ${timeString}`, 38, 25);
            btsCtx.restore();

            // Draw active CAPTURED shutter flash overlay!
            if (isFlashingRef.current) {
              btsCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              btsCtx.fillRect(0, 0, btsCanvas.width, btsCanvas.height);

              btsCtx.fillStyle = '#000000';
              btsCtx.font = '900 36px monospace';
              btsCtx.textAlign = 'center';
              btsCtx.textBaseline = 'middle';
              btsCtx.fillText('POSE CAPTURED! 📸', btsCanvas.width / 2, btsCanvas.height / 2);
            } else if (latestCapturedPhotoRef.current) {
              // Draw custom Polaroid frame with the photo inside it floating on screen
              const img = latestCapturedPhotoRef.current;
              btsCtx.save();
              
              // Darken background video a bit to draw focus
              btsCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
              btsCtx.fillRect(0, 0, btsCanvas.width, btsCanvas.height);
              
              // Polaroid frame dimensions
              const frameW = btsCanvas.width * 0.44;
              const frameH = frameW * 1.22;
              
              // Center the frame on the BTS canvas and rotate slightly
              btsCtx.translate(btsCanvas.width / 2, btsCanvas.height / 2);
              btsCtx.rotate(-2.5 * Math.PI / 180);
              
              // Shadow effect
              btsCtx.shadowColor = 'rgba(0, 0, 0, 0.6)';
              btsCtx.shadowBlur = 20;
              btsCtx.shadowOffsetY = 10;
              
              // Draw white Polaroid backing card
              btsCtx.fillStyle = '#FFFDF9';
              btsCtx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
              
              // Thin border stroke
              btsCtx.strokeStyle = 'rgba(0,0,0,0.08)';
              btsCtx.lineWidth = 1.5;
              btsCtx.strokeRect(-frameW / 2, -frameH / 2, frameW, frameH);
              
              // Reset shadow for the image drawing
              btsCtx.shadowColor = 'transparent';
              
              // Draw photo box (square aspect ratio)
              const photoW = frameW * 0.88;
              const photoH = photoW;
              const photoX = -photoW / 2;
              const photoY = -frameH / 2 + (frameW * 0.06);
              
              btsCtx.drawImage(img, photoX, photoY, photoW, photoH);
              
              // Draw signature text label at bottom
              btsCtx.fillStyle = '#27272A'; // zinc-800
              btsCtx.font = 'bold italic 16px "Caveat", cursive, sans-serif';
              btsCtx.textAlign = 'center';
              btsCtx.textBaseline = 'middle';
              btsCtx.fillText(`Pose #${capturedPreviews.length || 1}`, 0, frameH / 2 - (frameH * 0.12));
              
              btsCtx.restore();
            }
          };

          // Capture the processing canvas stream
          btsStream = btsCanvas.captureStream(30); // 30 FPS stream

          // Detect preferred MP4 or WEBM mime types
          let preferredType = 'video/webm;codecs=vp8';
          if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
            preferredType = 'video/mp4;codecs=h264';
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            preferredType = 'video/mp4';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
            preferredType = 'video/webm;codecs=h264';
          }

          const recorder = new MediaRecorder(btsStream, {
            mimeType: preferredType,
          });

          mediaRecorderRef.current = recorder;
          videoChunksRef.current = [];

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              videoChunksRef.current.push(event.data);
            }
          };

          // Start loop & recorder using steady setInterval to avoid browser frame throttling inside iframes
          btsLoopIdRef.current = setInterval(drawBtsFrame, 33) as any;
          recorder.start(100);
        }
      } catch (err) {
        console.warn('MediaRecorder canvas setup failed, falling back to direct stream:', err);
        // Fallback directly to raw stream if canvas stream fails
        try {
          const tracks = stream.getVideoTracks();
          if (tracks.length > 0) {
            btsStream = new MediaStream([tracks[0]]);
            const recorder = new MediaRecorder(btsStream, { mimeType: 'video/webm' });
            mediaRecorderRef.current = recorder;
            videoChunksRef.current = [];
            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) videoChunksRef.current.push(event.data);
            };
            recorder.start(100);
          }
        } catch (fbErr) {
          console.error('Fallback recorder failed:', fbErr);
        }
      }
    }

    const collectedPhotos: string[] = [];

    // Loop through required snapshots
    for (let i = 0; i < requiredPhotosCount; i++) {
      setCurrentCaptureIndex(i);

      // Countdown Phase
      for (let count = countdownStart; count > 0; count--) {
        setCountdown(count);
        if (soundEnabled) {
          synth.playBeep(880, 0.08); // warning tick
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Snap point!
      setCountdown(0);
      if (soundEnabled) {
        synth.playBeep(1200, 0.2); // Snap trigger indicator
      }

      // Capture frame
      const dataUrl = captureFrameFromVideo();
      if (dataUrl) {
        collectedPhotos.push(dataUrl);
        setCapturedPreviews((prev) => [...prev, dataUrl]);
        setRecentSnapshot(dataUrl);

        // Load into our image element ref for the BTS recording canvas!
        const img = new Image();
        img.onload = () => {
          latestCapturedPhotoRef.current = img;
        };
        img.src = dataUrl;
      }

      // Shutter shutter animation
      if (flashEnabled) {
        setIsFlashing(true);
      }
      if (soundEnabled) {
        synth.playShutter();
      }
      await new Promise((r) => setTimeout(r, 400));
      setIsFlashing(false);
      setCountdown(null);

      // Snapshot display cooldown
      await new Promise((r) => setTimeout(r, 1200));
      setRecentSnapshot(null);
      latestCapturedPhotoRef.current = null;
    }

    // Stop BTS video recording and generate blob URL
    let videoUrl: string | null = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      await new Promise((resolve) => {
        if (!mediaRecorderRef.current) return resolve(null);
        mediaRecorderRef.current.onstop = () => {
          // Cancel interval timer
          if (btsLoopIdRef.current) {
            clearInterval(btsLoopIdRef.current);
            btsLoopIdRef.current = null;
          }

          // Generate a premium compatible video blob with its real recorded mimeType!
          const finalMimeType = mediaRecorderRef.current?.mimeType || 'video/mp4';
          const videoBlob = new Blob(videoChunksRef.current, { type: finalMimeType });
          videoUrl = URL.createObjectURL(videoBlob);
          resolve(videoUrl);
        };
      });
    }

    setIsCapturingFlow(false);
    setCurrentCaptureIndex(-1);
    stopCamera();

    // Trigger completion melody!
    if (soundEnabled) {
      synth.playSuccess();
    }

    onPhotosCaptured(collectedPhotos, videoUrl);
  };

  const generateSimulatedBoothPhoto = (index: number): string => {
    const canvas = document.createElement('canvas');
    let width = 960;
    let height = 720;
    if (cameraRatio === '16:9') {
      width = 1280;
      height = 720;
    } else if (cameraRatio === '1:1') {
      width = 720;
      height = 720;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const styles = [
        {
          gradStart: '#FF6B6B',
          gradEnd: '#FFD93D',
          title: 'VINTAGE SUNSET',
          emoji: '🕶️',
          accessory: '☀️'
        },
        {
          gradStart: '#6C5CE7',
          gradEnd: '#A8FF78',
          title: 'NEON DREAM',
          emoji: '🎧',
          accessory: '🎵'
        },
        {
          gradStart: '#11998E',
          gradEnd: '#38EF7D',
          title: 'ARCADE GLOW',
          emoji: '👾',
          accessory: '🕹️'
        },
        {
          gradStart: '#ED213A',
          gradEnd: '#93291E',
          title: 'CHERRY DISCO',
          emoji: '🍒',
          accessory: '🪩'
        }
      ];
      
      const style = styles[index % styles.length];
      
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, style.gradStart);
      grad.addColorStop(1, style.gradEnd);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, height * 0.2);
      ctx.lineTo(width, height * 0.2);
      ctx.moveTo(0, height * 0.8);
      ctx.lineTo(width, height * 0.8);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      
      ctx.beginPath();
      ctx.ellipse(width / 2, height * 0.85, width * 0.25, height * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(width / 2, height * 0.45, Math.min(width, height) * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = `${Math.min(width, height) * 0.14}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(style.emoji, width / 2, height * 0.44);

      ctx.font = `${Math.min(width, height) * 0.08}px sans-serif`;
      ctx.fillText(style.accessory, width * 0.25, height * 0.3);
      ctx.fillText(style.accessory, width * 0.75, height * 0.7);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, height - 60, width, 60);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`SIMULATED POSE #${index + 1} - ${style.title}`, width / 2, height - 30);
    }
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const captureFrameFromVideo = (): string | null => {
    if (isSimulating) {
      return generateSimulatedBoothPhoto(capturedPreviews.length);
    }
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
        // Video is wider than target aspect ratio - crop horizontal sides
        drawW = videoH * targetAspect;
        sx = (videoW - drawW) / 2;
      } else {
        // Video is taller than target aspect ratio - crop vertical sides
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

      // Match flip mirror settings
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      // Draw the cropped portion onto the canvas
      ctx.drawImage(video, sx, sy, drawW, drawH, 0, 0, drawW, drawH);
      return canvas.toDataURL('image/jpeg', 0.95);
    } catch (err) {
      console.error('Error during video capture:', err);
      return null;
    }
  };

  // Find aspect ratio crop style
  const getCropMaskType = () => {
    switch (selectedTemplate) {
      case 'polaroid':
      case 'golden-polaroid':
      case 'grid':
      case 'purikura':
      case 'grunge-collage':
        return 'square'; // 1:1
      case 'duo':
      case 'gallery':
      case 'passport':
      case 'wedding':
      case 'magazine':
        return 'vertical'; // 3:4 or 4:5 vertical
      default:
        return 'landscape'; // standard landscape
    }
  };

  if (hasPermission === false && !isSimulating) {
    return (
      <div className="w-full max-w-xl mx-auto bg-razel-card border border-white/10 rounded-2xl p-8 text-center" id="camera-error-container">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">Camera Access Restricted</h3>
        <p className="text-sm text-white/60 mb-6">{errorMsg}</p>
        
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-emerald-400 mb-1">💡 Sandbox Environment Detected</p>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Browsers block hardware camera access inside nested sandboxed iFrames. Use our virtual simulator bypass to generate gorgeous retro shots and test the full custom design panel!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button onClick={onBack} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-sm font-semibold transition-all">
            Go Back
          </button>
          
          <button 
            onClick={() => {
              setIsSimulating(true);
              setHasPermission(true);
            }} 
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" /> Bypass & Simulate 📸
          </button>
          
          <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-razel-neon text-white font-semibold hover:bg-razel-neon/90 text-sm shadow-md transition-all">
            Retry Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          disabled={isCapturingFlow}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Change Layout
        </button>

        {devices.length > 1 && !isCapturingFlow && (
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-white/40" />
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="bg-razel-panel border border-white/10 text-xs text-white/80 rounded-lg px-3 py-1.5 focus:outline-none focus:border-razel-neon"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Viewport Container */}
      <div className={`w-full relative max-w-2xl rounded-2xl border-2 border-white/10 overflow-hidden bg-black shadow-2xl transition-all duration-300 ${
        cameraRatio === '16:9' ? 'aspect-video' : cameraRatio === '1:1' ? 'aspect-square' : 'aspect-[4/3]'
      }`}>
        {isSimulating ? (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
            <div className="absolute w-72 h-72 rounded-full border border-emerald-500/10 animate-pulse flex items-center justify-center">
              <div className="w-56 h-56 rounded-full border-2 border-emerald-500/20 border-dashed animate-spin-slow" />
            </div>
            
            <div className="z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <Camera className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-emerald-400 font-mono text-xs tracking-wider uppercase font-semibold mb-1">
                LENS SIMULATOR ACTIVE
              </p>
              <p className="text-white/50 text-[11px] max-w-sm mb-4 leading-relaxed">
                Virtual capture is active. We will synthesize gorgeous high-resolution retro prints for you!
              </p>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] font-mono text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                BYPASS MODE: READY
              </div>
            </div>
          </div>
        ) : !stream ? (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none z-10">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3 animate-pulse">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Camera Feed Inactive</p>
            <p className="text-xs text-white/40 max-w-sm mb-4">
              Waiting for camera hardware initialization...
            </p>
            <button
              onClick={() => {
                setIsSimulating(true);
                setHasPermission(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-all shadow-md animate-bounce"
            >
              Use Virtual Simulator 📸
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover select-none pointer-events-none transition-transform duration-300 ${
              isMirrored ? 'scale-x-[-1]' : 'scale-x-[1]'
            }`}
          />
        )}

        {/* Shutter snapshot freeze frame with Custom retro Polaroid Frame overlay */}
        {recentSnapshot && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in select-none">
            <div className="bg-[#FFFDF9] p-4 pb-12 rounded-sm shadow-[0_20px_40px_rgba(0,0,0,0.85)] border border-amber-900/10 max-w-[270px] w-full transform rotate-[-2deg] transition-all duration-300 animate-scale-up relative">
              {/* Image box */}
              <div className="aspect-square w-full bg-zinc-950 border border-zinc-200/10 overflow-hidden rounded-[1px] relative shadow-inner">
                <img
                  src={recentSnapshot}
                  alt="Snapshot"
                  className="w-full h-full object-cover"
                />
                
                {/* Captured flash light sweep effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent translate-x-[-100%] animate-shimmer" />
              </div>
              
              {/* Bottom polaroid signature label */}
              <div className="absolute bottom-3 left-0 right-0 text-center flex flex-col items-center">
                <span className="font-handwriting text-zinc-800 text-xl font-bold tracking-tight">
                  DigiSmile Moment #{currentCaptureIndex + 1}
                </span>
                <span className="font-mono text-[7px] text-zinc-400 mt-1 uppercase tracking-widest">
                  {new Date().toLocaleTimeString()} • REALTIME SHUTTER
                </span>
              </div>

              {/* Little red tape header or green captured badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white font-mono text-[9px] font-bold px-3 py-1 rounded shadow-md tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                POSED #{currentCaptureIndex + 1}
              </div>
            </div>
          </div>
        )}

        {/* Shutter screen flash element */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-30 flash-effect" />
        )}

        {/* Real-time countdown overlay */}
        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10 select-none">
            <div className="flex flex-col items-center">
              <span className="text-8xl md:text-[140px] font-display font-extrabold text-white tracking-tighter animate-ping">
                {countdown}
              </span>
              <span className="text-white/60 tracking-widest font-mono text-xs md:text-sm uppercase mt-4">
                Pose for Snapshot #{currentCaptureIndex + 1}
              </span>
            </div>
          </div>
        )}

        {/* Countdown Smile instruction */}
        {countdown === 0 && (
          <div className="absolute inset-0 bg-razel-neon/20 flex items-center justify-center z-10 select-none">
            <span className="text-4xl md:text-6xl font-display font-extrabold text-white animate-bounce uppercase">
              SMILE! 📸
            </span>
          </div>
        )}

        {/* Template-aware Crop Viewport Shutters */}
        {getCropMaskType() === 'square' && (
          <>
            {/* Left and Right overlay bars */}
            <div className="absolute inset-y-0 left-0 w-[12%] md:w-[15%] bg-black/75 border-r border-white/10 pointer-events-none z-10 flex items-center justify-center">
              <span className="text-[8px] text-white/20 tracking-wider font-mono uppercase hidden md:inline [writing-mode:vertical-lr]">CROP ZONE</span>
            </div>
            <div className="absolute inset-y-0 right-0 w-[12%] md:w-[15%] bg-black/75 border-l border-white/10 pointer-events-none z-10 flex items-center justify-center">
              <span className="text-[8px] text-white/20 tracking-wider font-mono uppercase hidden md:inline [writing-mode:vertical-lr]">CROP ZONE</span>
            </div>
          </>
        )}
        {getCropMaskType() === 'vertical' && (
          <>
            {/* Vertical crop in 16:9 or 4:3 view - left and right thicker bars */}
            <div className="absolute inset-y-0 left-0 w-[16%] md:w-[20%] bg-black/75 border-r border-white/10 pointer-events-none z-10 flex items-center justify-center">
              <span className="text-[8px] text-white/20 tracking-wider font-mono uppercase hidden md:inline [writing-mode:vertical-lr]">CROP ZONE</span>
            </div>
            <div className="absolute inset-y-0 right-0 w-[16%] md:w-[20%] bg-black/75 border-l border-white/10 pointer-events-none z-10 flex items-center justify-center">
              <span className="text-[8px] text-white/20 tracking-wider font-mono uppercase hidden md:inline [writing-mode:vertical-lr]">CROP ZONE</span>
            </div>
          </>
        )}

        {/* Studio Grid Overlay */}
        <div className={`absolute inset-0 border border-white/5 pointer-events-none grid grid-cols-3 grid-rows-3 transition-opacity duration-300 ${isCapturingFlow ? 'opacity-40' : 'opacity-100'}`}>
          <div className="border-r border-b border-white/5" />
          <div className="border-r border-b border-white/5" />
          <div className="border-b border-white/5" />
          <div className="border-r border-b border-white/5" />
          <div className="border-r border-b border-white/5" />
          <div className="border-b border-white/5" />
          <div className="border-r border-white/5" />
          <div className="border-r border-white/5" />
          <div className="border-white/0" />
          
          {/* Guide circle in center */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border rounded-full flex items-end justify-center pb-2 transition-all duration-300 ${
            countdown === 0 
              ? 'border-emerald-400 bg-emerald-500/10 scale-105 shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
              : countdown !== null 
              ? 'border-razel-neon animate-pulse scale-100 shadow-[0_0_12px_rgba(255,46,84,0.35)]'
              : 'border-white/10'
          }`}>
            <span className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${
              countdown === 0 ? 'text-emerald-400 font-bold' : countdown !== null ? 'text-razel-neon font-bold' : 'text-white/30'
            }`}>
              {countdown === 0 ? 'SMILE! 📸' : countdown !== null ? `POSE #${currentCaptureIndex + 1}` : 'Alignment Guide'}
            </span>
          </div>
        </div>

        {/* Active layout format tag */}
        <div className="absolute bottom-4 left-4 z-10 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 font-mono text-[9px] text-white/60 tracking-wider uppercase">
          <Film className="w-3 h-3 text-razel-neon animate-pulse" />
          Format: {cameraRatio === '1:1' ? 'Square 1:1' : cameraRatio === '16:9' ? 'Landscape 16:9' : 'Standard 4:3'}
        </div>

        {/* Floating Quick Action Overlay Buttons (Camera Switch and Flash Toggles) */}
        {!isCapturingFlow && (
          <div className="absolute bottom-4 right-4 flex gap-2.5 z-10">
            {!isSimulating && (
              <button
                onClick={toggleCamera}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                title="Switch Front/Back Camera"
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            )}
            
            <button
              onClick={() => setFlashEnabled(!flashEnabled)}
              className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                flashEnabled ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-black/60 text-white/50'
              }`}
              title={flashEnabled ? "Camera Flash Enabled" : "Camera Flash Disabled"}
            >
              {flashEnabled ? <Zap className="w-5 h-5 fill-amber-400" /> : <ZapOff className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Capturing Indicators */}
        {isCapturingFlow && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="bg-razel-neon text-white font-mono text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-razel-neon/20">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              RECORDING LIVE SESSION
            </div>

            <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg flex gap-1.5 text-white font-mono text-xs border border-white/10">
              {Array.from({ length: requiredPhotosCount }).map((_, idx) => {
                const isCaptured = idx < capturedPreviews.length;
                const isCurrent = idx === currentCaptureIndex;

                return (
                  <div
                    key={idx}
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                      isCaptured
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-razel-neon text-white animate-pulse shadow-[0_0_8px_var(--color-razel-neon-glow)]'
                        : 'bg-white/15 text-white/40'
                    }`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Control Panel Settings */}
      <div className="w-full max-w-2xl bg-razel-card border border-white/10 rounded-2xl p-6 mt-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left: Toggles */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Record Behind-The-Scenes Video</span>
                <span className="text-xs text-white/50">Generates a live MP4 timelapse of your poses</span>
              </div>
              <button
                disabled={isCapturingFlow}
                onClick={() => setRecordBtsVideo(!recordBtsVideo)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  recordBtsVideo ? 'bg-razel-neon' : 'bg-white/10'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    recordBtsVideo ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Mirror Camera Feed</span>
                <span className="text-xs text-white/50">Flips viewfinder for natural look</span>
              </div>
              <button
                disabled={isCapturingFlow}
                onClick={() => setIsMirrored(!isMirrored)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isMirrored ? 'bg-razel-neon' : 'bg-white/10'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isMirrored ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right: Settings and Audio */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Audio Shutter Sound</span>
                <span className="text-xs text-white/50">Play vintage shutter beeps & clicks</span>
              </div>
              <button
                disabled={isCapturingFlow}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-razel-neon" />
                ) : (
                  <VolumeX className="w-5 h-5 text-white/40" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Timer Delay</span>
                <span className="text-xs text-white/50">Seconds between pose captures</span>
              </div>
              <div className="flex gap-1">
                {[3, 5, 10].map((sec) => (
                  <button
                    key={sec}
                    disabled={isCapturingFlow}
                    onClick={() => setCountdownStart(sec)}
                    className={`w-10 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                      countdownStart === sec
                        ? 'bg-razel-neon text-white shadow-md'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Camera Aspect Ratio</span>
                <span className="text-xs text-white/50">Capture resolution format</span>
              </div>
              <div className="flex gap-1">
                {(['4:3', '16:9', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    disabled={isCapturingFlow}
                    onClick={() => setCameraRatio(ratio)}
                    className={`w-12 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                      cameraRatio === ratio
                        ? 'bg-razel-neon text-white shadow-md'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        {!isCapturingFlow ? (
          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={startCaptureSession}
              className={`w-full py-4 rounded-xl font-display font-bold text-lg tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 ${
                isSimulating 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-razel-neon hover:bg-razel-neon/90 text-white shadow-[0_4px_20px_rgba(255,46,84,0.3)]'
              }`}
            >
              <Camera className="w-5 h-5 animate-pulse" /> {isSimulating ? 'START SIMULATED CAPTURE' : 'START CAPTURE SESSION'}
            </button>
            {isSimulating && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSimulating(false);
                    window.location.reload();
                  }}
                  className="text-[11px] text-white/40 hover:text-white/60 underline font-mono transition-colors"
                >
                  Turn off Simulator & Try Hardware Camera
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-white/5 border border-white/10 rounded-xl py-4 flex flex-col items-center justify-center text-white/70 animate-pulse">
            <Film className="w-5 h-5 text-razel-neon mb-2 animate-spin" />
            <span className="text-sm font-semibold">Capturing Photo {capturedPreviews.length + 1} of {requiredPhotosCount}...</span>
            <span className="text-xs text-white/40 mt-1 font-mono">Do not close window or block camera</span>
          </div>
        )}
      </div>
    </div>
  );
}
