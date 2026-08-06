/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { 
  Download, 
  Share2, 
  Printer, 
  RotateCcw, 
  Flame, 
  Film, 
  Image as ImageIcon, 
  CheckCircle2,
  Loader2,
  Lock,
  Copy,
  Check,
  Sliders,
  QrCode,
  Scissors,
  Sun,
  Thermometer
} from 'lucide-react';
import QRCode from 'qrcode';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { TemplateType, FilterType, FilterSettings, Sticker, BorderOption } from '../types';

interface ExportPanelProps {
  photos: string[];
  template: TemplateType;
  filter: FilterType;
  filterSettings: FilterSettings;
  stickers: Sticker[];
  caption: string;
  captionFont: string;
  captionColor: string;
  borderId: string;
  videoBlobUrl: string | null;
  frameThemeId: string;
  customBgImage: string | null;
  customBgOpacity: number;
  customBgScale: number;
  customBgTiling: 'cover' | 'contain' | 'repeat';
  pictureFrameStroke: string;
  onReset: () => void;
}

export default function ExportPanel({
  photos,
  template,
  filter,
  filterSettings,
  stickers,
  caption,
  captionFont,
  captionColor,
  borderId,
  videoBlobUrl,
  frameThemeId,
  customBgImage,
  customBgOpacity,
  customBgScale,
  customBgTiling,
  pictureFrameStroke,
  onReset,
}: ExportPanelProps) {
  const [compiling, setCompiling] = useState<boolean>(true);
  const [compilingStep, setCompilingStep] = useState<string>('Initializing Core...');
  const [staticImageBlob, setStaticImageBlob] = useState<Blob | null>(null);
  const [staticImageUrl, setStaticImageUrl] = useState<string | null>(null);
  const [staticJpgUrl, setStaticJpgUrl] = useState<string | null>(null);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  
  // Tab control: 'strip' | 'print' | 'gif' | 'video'
  const [activeTab, setActiveTab] = useState<'strip' | 'print' | 'gif' | 'video'>('strip');
  // Mobile Export Control Tab
  const [exportControlTab, setExportControlTab] = useState<'downloads' | 'settings' | 'qr'>('downloads');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [gifFps, setGifFps] = useState<number>(3); // 2fps to 15fps, default 3fps (333ms delay)
  const [exportQuality, setExportQuality] = useState<'standard' | 'print300' | 'ultra400'>('print300');

  // Premium Paper Texture Finish
  const [paperTexture, setPaperTexture] = useState<'none' | 'matte' | 'satin' | 'glossy'>('none');

  // Client-Side QR Code Sharing
  const [qrTab, setQrTab] = useState<'direct-photo' | 'app-link'>('direct-photo');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Print settings
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [printPaperSize, setPrintPaperSize] = useState<'letter' | 'a4' | '4x6' | 'wallet'>('4x6');
  const [printColorMode, setPrintColorMode] = useState<'color' | 'mono'>('color');
  const [printGridLayout, setPrintGridLayout] = useState<'single' | 'double'>('single');
  const [showPrintBorder, setShowPrintBorder] = useState<boolean>(true);
  const [showPrintSettings, setShowPrintSettings] = useState<boolean>(false);

  // Advanced Physical Print Compensation & Alignment
  const [brightnessAdjustment, setBrightnessAdjustment] = useState<'neutral' | 'bright' | 'bright-plus'>('neutral');
  const [printWarmth, setPrintWarmth] = useState<'neutral' | 'warm' | 'cool'>('neutral');
  const [showCutMarks, setShowCutMarks] = useState<boolean>(true);
  const [paperSizingMode, setPaperSizingMode] = useState<'fit' | 'fill'>('fit');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const borderOptions: BorderOption[] = [
    { id: 'white', name: 'Snow White', color: '#FFFFFF', bgClass: 'bg-white', textClass: 'text-zinc-900 border-zinc-200' },
    { id: 'pink', name: 'Sakura Pink', color: '#FFF5F7', bgClass: 'bg-[#FFF5F7]', textClass: 'text-pink-600 border-pink-100' },
    { id: 'black', name: 'Stealth Black', color: '#12141C', bgClass: 'bg-zinc-950 border-white/5', textClass: 'text-white' },
    { id: 'cream', name: 'Warm Cream', color: '#FAF6E9', bgClass: 'bg-[#FAF6E9]', textClass: 'text-amber-950 border-amber-900/10' },
    { id: 'aged-polaroid', name: 'Vintage Polaroid', color: '#FBF9F3', bgClass: 'bg-[#FBF9F3]', textClass: 'text-zinc-800' },
    { id: 'sprocket', name: 'Film Sprocket Strip', color: '#151518', bgClass: 'bg-[#151518]', textClass: 'text-white' },
    { id: 'wood', name: 'Teakwood Arcade', color: '#5C4033', bgClass: 'bg-[#5C4033]', textClass: 'text-amber-100' },
    { id: 'retro', name: 'Newsprint', color: '#E8DCC4', bgClass: 'bg-[#E8DCC4]', textClass: 'text-zinc-900 border-zinc-800' },
    { id: 'neon', name: 'Acid Neon Grid', color: '#090B11', bgClass: 'bg-razel-dark', textClass: 'text-razel-neon' },
    { id: 'paper-torn', name: 'Fibrous Torn Paper', color: '#F6F4EB', bgClass: 'bg-[#F6F4EB]', textClass: 'text-zinc-800' },
    { id: 'distressed-retro', name: 'Grunge Distressed Film', color: '#141211', bgClass: 'bg-[#141211]', textClass: 'text-zinc-300' },
    { id: 'gilded-museum', name: 'Gilded Gold Gallery', color: '#241710', bgClass: 'bg-[#241710]', textClass: 'text-amber-100' },
  ];

  const currentBorder = borderOptions.find((b) => b.id === borderId) || borderOptions[0];

  useEffect(() => {
    let createdPngUrl: string | null = null;
    let createdJpgUrl: string | null = null;
    let createdGifUrl: string | null = null;

    async function compileAllAssets() {
      try {
        // Step 1: Render High-Res Composite Canvas
        setCompilingStep('Rendering High-Res Print layout...');
        const compositeCanvas = await renderHighResCanvas();
        if (compositeCanvas) {
          const imageBlob = await new Promise<Blob | null>((res) => 
            compositeCanvas.toBlob((b) => res(b), 'image/png', 1.0)
          );
          if (imageBlob) {
            setStaticImageBlob(imageBlob);
            createdPngUrl = URL.createObjectURL(imageBlob);
            setStaticImageUrl(createdPngUrl);
          }

          const jpgBlob = await new Promise<Blob | null>((res) => 
            compositeCanvas.toBlob((b) => res(b), 'image/jpeg', 0.95)
          );
          if (jpgBlob) {
            createdJpgUrl = URL.createObjectURL(jpgBlob);
            setStaticJpgUrl(createdJpgUrl);
          }
        }

        // Step 2: Compile Animated Looping GIF
        setCompilingStep('Synthesizing Animated Loop GIF...');
        const gif = await compileAnimatedGif();
        if (gif) {
          setGifBlob(gif);
          createdGifUrl = URL.createObjectURL(gif);
          setGifUrl(createdGifUrl);
        }

        setCompiling(false);
      } catch (err) {
        console.error('Error during asset compilation:', err);
        setCompiling(false);
      }
    }

    compileAllAssets();

    return () => {
      // Cleanup URLs to save memory
      if (createdPngUrl) URL.revokeObjectURL(createdPngUrl);
      if (createdJpgUrl) URL.revokeObjectURL(createdJpgUrl);
      if (createdGifUrl) URL.revokeObjectURL(createdGifUrl);
    };
  }, [gifFps, exportQuality, paperTexture]);

  // Convert image URL to Image object helper
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (src && !src.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.error("Failed to load image in ExportPanel:", src.substring(0, 50) + "...", e);
        reject(e);
      };
      img.src = src;
    });
  };

  const generateQrForPhoto = async () => {
    if (!staticImageBlob) return;
    setQrLoading(true);
    setQrError(null);
    try {
      const formData = new FormData();
      formData.append('file', staticImageBlob, `digismile-${Date.now()}.png`);
      
      const response = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload server returned an error');
      }
      
      const result = await response.json();
      if (result && result.data && result.data.url) {
        const rawUrl = result.data.url;
        const directDownloadUrl = rawUrl.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
        
        const code = await QRCode.toDataURL(directDownloadUrl, {
          margin: 1.5,
          width: 220,
          color: {
            dark: '#12141C',
            light: '#FFFFFF',
          },
        });
        setQrUrl(code);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Error generating direct download QR:', err);
      setQrError('Direct transfer servers are busy. The QR Code below will load the workspace Web App instead!');
      try {
        const fallbackCode = await QRCode.toDataURL(window.location.href, {
          margin: 1.5,
          width: 220,
          color: {
            dark: '#12141C',
            light: '#FFFFFF',
          },
        });
        setQrUrl(fallbackCode);
      } catch (e) {
        console.error('QR fallback failed:', e);
      }
    } finally {
      setQrLoading(false);
    }
  };

  const generateQrForApp = async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      const code = await QRCode.toDataURL(window.location.href, {
        margin: 1.5,
        width: 220,
        color: {
          dark: '#12141C',
          light: '#FFFFFF',
        },
      });
      setQrUrl(code);
    } catch (err) {
      console.error('Error generating app share QR:', err);
      setQrError('Failed to generate QR code.');
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (compiling) return;
    
    if (qrTab === 'direct-photo') {
      if (staticImageBlob) {
        generateQrForPhoto();
      }
    } else {
      generateQrForApp();
    }
  }, [qrTab, staticImageBlob, compiling]);

  // Helper to generate the CSS string style of the filter to apply directly to Canvas Context 2D
  const getCanvasFilterString = () => {
    let base = 'none';
    switch (filter) {
      case 'mono':
        base = 'grayscale(100%) contrast(1.25)';
        break;
      case 'vintage':
        base = 'sepia(0.55) contrast(1.1) brightness(0.95)';
        break;
      case 'cyberpunk':
        base = 'hue-rotate(185deg) saturate(1.4) contrast(1.15)';
        break;
      case 'golden':
        base = 'sepia(0.2) saturate(1.3) brightness(1.05) contrast(1.05)';
        break;
      case 'ice':
        base = 'hue-rotate(160deg) saturate(1.15) brightness(0.98)';
        break;
      case 'vhs':
        base = 'contrast(1.2) saturate(1.5) hue-rotate(-10deg)';
        break;
      case 'creamy':
        base = 'contrast(0.85) brightness(1.12) saturate(1.05)';
        break;
      case 'polaroid':
        base = 'sepia(0.15) contrast(0.95) brightness(1.02) saturate(0.9)';
        break;
      case 'fuji-superia':
        base = 'contrast(1.1) saturate(1.15) hue-rotate(-12deg) sepia(0.08)';
        break;
      case 'kodachrome-74':
        base = 'saturate(1.3) contrast(1.12) sepia(0.18) hue-rotate(5deg)';
        break;
      case 'tri-x-grain':
        base = 'grayscale(100%) contrast(1.4) brightness(0.95)';
        break;
      case 'teal-orange':
        base = 'contrast(1.25) saturate(1.2) hue-rotate(-8deg) sepia(0.12)';
        break;
      case 'golden-hour':
        base = 'sepia(0.28) saturate(1.45) brightness(1.08) hue-rotate(8deg)';
        break;
      case 'ethereal-pastel':
        base = 'brightness(1.15) contrast(0.88) saturate(1.25) sepia(0.05)';
        break;
      case 'lomo-vivid':
        base = 'saturate(1.6) contrast(1.2) brightness(0.95)';
        break;
      default:
        base = 'none';
    }

    const bScale = filterSettings.brightness / 100;
    const cScale = filterSettings.contrast / 100;
    const sScale = filterSettings.saturation / 100;

    return `${base} brightness(${bScale}) contrast(${cScale}) saturate(${sScale})`;
  };

  const getQualityDimensions = (): string => {
    let baseW = 800;
    let baseH = 1000;

    if (template === 'strip' || template === 'vintage-silver') {
      baseW = 600;
      baseH = 1800;
    } else if (template === 'double-strip') {
      baseW = 1200;
      baseH = 1800;
    } else if (template === 'polaroid' || template === 'golden-polaroid') {
      baseW = 800;
      baseH = 1000;
    } else if (template === 'polaroid-wide') {
      baseW = 1000;
      baseH = 800;
    } else if (template === 'grid' || template === 'purikura' || template === 'grunge-collage' || template === 'passport') {
      baseW = 1000;
      baseH = 1000;
    } else if (template === 'duo' || template === 'gallery') {
      baseW = 1000;
      baseH = 800;
    } else if (template === 'cinematic' || template === 'directors-cut') {
      baseW = 800;
      baseH = 1500;
    } else if (template === 'sprocket-roll') {
      baseW = 1200;
      baseH = 500;
    } else if (template === 'neo-noir') {
      baseW = 700;
      baseH = 1000;
    } else if (template === 'comic') {
      baseW = 1200;
      baseH = 600;
    } else if (template === 'magazine') {
      baseW = 800;
      baseH = 1100;
    } else if (template === 'ticket') {
      baseW = 550;
      baseH = 1800;
    } else if (template === 'cyber-glitch') {
      baseW = 1000;
      baseH = 650;
    } else if (template === 'wedding') {
      baseW = 800;
      baseH = 1300;
    } else if (template === 'neon-wave') {
      baseW = 1000;
      baseH = 1000;
    } else if (template === 'editorial') {
      baseW = 800;
      baseH = 1100;
    } else if (template === 'marquee') {
      baseW = 800;
      baseH = 1400;
    }

    const mult = exportQuality === 'standard' ? 1 : exportQuality === 'print300' ? 2 : 3;
    return `${baseW * mult} x ${baseH * mult} px`;
  };

  // 300 DPI Canvas Rendering Core
  const renderHighResCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Define dimensions based on layout templates
    let canvasW = 800;
    let canvasH = 1000;

    if (template === 'strip' || template === 'vintage-silver') {
      canvasW = 600;
      canvasH = 1800;
    } else if (template === 'double-strip') {
      canvasW = 1200;
      canvasH = 1800;
    } else if (template === 'polaroid' || template === 'golden-polaroid') {
      canvasW = 800;
      canvasH = 1000;
    } else if (template === 'polaroid-wide') {
      canvasW = 1000;
      canvasH = 800;
    } else if (template === 'grid' || template === 'purikura' || template === 'grunge-collage' || template === 'passport') {
      canvasW = 1000;
      canvasH = 1000;
    } else if (template === 'duo' || template === 'gallery') {
      canvasW = 1000;
      canvasH = 800;
    } else if (template === 'cinematic' || template === 'directors-cut') {
      canvasW = 800;
      canvasH = 1500;
    } else if (template === 'sprocket-roll') {
      canvasW = 1200;
      canvasH = 500;
    } else if (template === 'neo-noir') {
      canvasW = 700;
      canvasH = 1000;
    } else if (template === 'comic') {
      canvasW = 1200;
      canvasH = 600;
    } else if (template === 'magazine') {
      canvasW = 800;
      canvasH = 1100;
    } else if (template === 'ticket') {
      canvasW = 550;
      canvasH = 1800;
    } else if (template === 'cyber-glitch') {
      canvasW = 1000;
      canvasH = 650;
    } else if (template === 'wedding') {
      canvasW = 800;
      canvasH = 1300;
    } else if (template === 'neon-wave') {
      canvasW = 1000;
      canvasH = 1000;
    } else if (template === 'editorial') {
      canvasW = 800;
      canvasH = 1100;
    } else if (template === 'marquee') {
      canvasW = 800;
      canvasH = 1400;
    }

    const multiplier = exportQuality === 'standard' ? 1 : exportQuality === 'print300' ? 2 : 3;
    canvasW = canvasW * multiplier;
    canvasH = canvasH * multiplier;

    canvas.width = canvasW;
    canvas.height = canvasH;

    // 1. Draw border background color/style
    ctx.fillStyle = currentBorder.color;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Render custom background image (with opacity, scaling, tiling) or thematic preset backgrounds
    if (customBgImage) {
      try {
        const bgImg = await loadImage(customBgImage);
        ctx.save();
        ctx.globalAlpha = customBgOpacity / 100;
        
        if (customBgTiling === 'repeat') {
          const pattern = ctx.createPattern(bgImg, 'repeat');
          if (pattern) {
            const scaleFactor = (customBgScale / 100) * (canvasW / 400); // balance resolution scaling
            const matrix = new DOMMatrix().scaleSelf(scaleFactor, scaleFactor);
            pattern.setTransform(matrix);
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, canvasW, canvasH);
          }
        } else if (customBgTiling === 'contain') {
          const imgAspect = bgImg.width / bgImg.height;
          const canvasAspect = canvasW / canvasH;
          let drawW = canvasW;
          let drawH = canvasH;
          if (imgAspect > canvasAspect) {
            drawH = canvasW / imgAspect;
          } else {
            drawW = canvasH * imgAspect;
          }
          const drawX = (canvasW - drawW) / 2;
          const drawY = (canvasH - drawH) / 2;
          ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
        } else {
          // 'cover'
          const imgAspect = bgImg.width / bgImg.height;
          const canvasAspect = canvasW / canvasH;
          let drawW = canvasW;
          let drawH = canvasH;
          if (imgAspect > canvasAspect) {
            drawW = canvasH * imgAspect;
          } else {
            drawH = canvasW / imgAspect;
          }
          const drawX = (canvasW - drawW) / 2;
          const drawY = (canvasH - drawH) / 2;
          ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
        }
        ctx.restore();
      } catch (err) {
        console.warn("Failed to render custom background image on canvas:", err);
      }
    } else if (frameThemeId && frameThemeId !== 'none') {
      ctx.save();
      if (frameThemeId === 'birthday') {
        const colors = ['rgba(244,180,26,0.22)', 'rgba(239,68,68,0.18)', 'rgba(59,130,246,0.18)', 'rgba(16,185,129,0.18)'];
        for (let x = 30 * multiplier; x < canvasW + 60 * multiplier; x += 120 * multiplier) {
          for (let y = 30 * multiplier; y < canvasH + 60 * multiplier; y += 120 * multiplier) {
            ctx.fillStyle = colors[(x + y) % colors.length];
            ctx.beginPath();
            ctx.arc(x + Math.sin(y) * 15 * multiplier, y, 12 * multiplier, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (frameThemeId === 'holiday') {
        const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        grad.addColorStop(0, 'rgba(251, 146, 60, 0.25)');
        grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.25)');
        grad.addColorStop(1, 'rgba(139, 92, 246, 0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (frameThemeId === 'nature') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
        grad.addColorStop(0, 'rgba(240, 253, 244, 0.5)');
        grad.addColorStop(1, 'rgba(220, 252, 231, 0.3)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
        for (let i = 0; i < 40; i++) {
          const cx = Math.sin(i) * canvasW * 0.5 + canvasW * 0.5;
          const cy = (i * 45 * multiplier) % canvasH;
          ctx.beginPath();
          ctx.arc(cx, cy, 18 * multiplier, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (frameThemeId === 'love') {
        const grad1 = ctx.createRadialGradient(canvasW * 0.3, canvasH * 0.2, 0, canvasW * 0.3, canvasH * 0.2, canvasW * 0.6);
        grad1.addColorStop(0, 'rgba(236, 72, 153, 0.2)');
        grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, canvasW, canvasH);

        const grad2 = ctx.createRadialGradient(canvasW * 0.75, canvasH * 0.65, 0, canvasW * 0.75, canvasH * 0.65, canvasW * 0.8);
        grad2.addColorStop(0, 'rgba(239, 68, 68, 0.22)');
        grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (frameThemeId === 'halloween') {
        const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        grad.addColorStop(0, 'rgba(249, 115, 22, 0.16)');
        grad.addColorStop(0.5, 'rgba(88, 28, 135, 0.14)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (frameThemeId === 'thanksgiving') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
        grad.addColorStop(0, 'rgba(217, 119, 6, 0.18)');
        grad.addColorStop(1, 'rgba(146, 64, 14, 0.18)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (frameThemeId === 'goth') {
        const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        grad.addColorStop(0, 'rgba(15, 15, 25, 0.35)');
        grad.addColorStop(0.5, 'rgba(46, 16, 58, 0.25)');
        grad.addColorStop(1, 'rgba(5, 5, 5, 0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (frameThemeId === 'christmas') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
        grad.addColorStop(0, 'rgba(22, 101, 52, 0.16)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        grad.addColorStop(1, 'rgba(185, 28, 28, 0.16)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (frameThemeId === 'girly') {
        const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        grad.addColorStop(0, 'rgba(253, 242, 248, 0.45)');
        grad.addColorStop(0.5, 'rgba(252, 231, 243, 0.35)');
        grad.addColorStop(1, 'rgba(244, 63, 94, 0.12)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      }
      ctx.restore();
    }

    // Apply background textures for specific frames
    if (borderId === 'retro') {
      // Draw newsprint dots
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      for (let x = 0; x < canvasW; x += 12 * multiplier) {
        for (let y = 0; y < canvasH; y += 12 * multiplier) {
          ctx.beginPath();
          ctx.arc(x, y, 1 * multiplier, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (borderId === 'neon') {
      // Acid Neon grid lines
      ctx.strokeStyle = 'rgba(255, 46, 84, 0.15)';
      ctx.lineWidth = 1 * multiplier;
      for (let x = 0; x < canvasW; x += 40 * multiplier) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasH);
        ctx.stroke();
      }
      for (let y = 0; y < canvasH; y += 40 * multiplier) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasW, y);
        ctx.stroke();
      }
    } else if (borderId === 'sprocket') {
      // Draw premium dark film canister style with physical sprocket holes
      ctx.fillStyle = '#0f0f12';
      ctx.fillRect(0, 0, canvasW, canvasH);
      
      ctx.fillStyle = '#000000'; // black hole interiors
      const holeW = 32 * multiplier;
      const holeH = 54 * multiplier;
      const holeR = 12 * multiplier;
      
      const drawRoundedRect = (cx: number, cy: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(cx + r, cy);
        ctx.arcTo(cx + w, cy, cx + w, cy + h, r);
        ctx.arcTo(cx + w, cy + h, cx, cy + h, r);
        ctx.arcTo(cx, cy + h, cx, cy, r);
        ctx.arcTo(cx, cy, cx + w, cy, r);
        ctx.closePath();
        ctx.fill();
      };
      
      // Draw left & right film holes
      for (let y = 35 * multiplier; y < canvasH - 35 * multiplier; y += 95 * multiplier) {
        drawRoundedRect(16 * multiplier, y, holeW, holeH, holeR);
        drawRoundedRect(canvasW - 16 * multiplier - holeW, y, holeW, holeH, holeR);
      }
    } else if (borderId === 'wood') {
      // Organic teakwood wavy background stripes
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.fillStyle = '#452f25';
      for (let i = 0; i < canvasH; i += 28 * multiplier) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        // Create a gentle wavy wood-grain aesthetic
        for (let x = 0; x <= canvasW; x += 40 * multiplier) {
          ctx.lineTo(x, i + Math.sin(x / (100 * multiplier) + i) * 12 * multiplier);
        }
        ctx.lineTo(canvasW, i + 8 * multiplier);
        ctx.lineTo(canvasW, i + 18 * multiplier);
        for (let x = canvasW; x >= 0; x -= 40 * multiplier) {
          ctx.lineTo(x, i + 10 * multiplier + Math.sin(x / (100 * multiplier) + i) * 12 * multiplier);
        }
        ctx.closePath();
        ctx.fill();
      }
    } else if (borderId === 'aged-polaroid') {
      // Light paper texture speckles
      ctx.fillStyle = 'rgba(120, 85, 45, 0.05)';
      for (let i = 0; i < 450; i++) {
        const x = Math.random() * canvasW;
        const y = Math.random() * canvasH;
        const size = (Math.random() * 2.5 + 1) * multiplier;
        ctx.fillRect(x, y, size, size);
      }
    } else if (borderId === 'pink') {
      // Soft aesthetic cherry blossom texture spots
      ctx.fillStyle = 'rgba(244, 143, 177, 0.12)';
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * canvasW;
        const y = Math.random() * canvasH;
        const size = (Math.random() * 3 + 1) * multiplier;
        ctx.fillRect(x, y, size, size);
      }
    } else if (borderId === 'paper-torn') {
      // Draw simulated torn paper fibrous jags on margins and photoboxes
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvasW;
        const y = Math.random() * canvasH;
        ctx.fillRect(x, y, (Math.random() * 8 + 2) * multiplier, 1.5 * multiplier);
      }
      // Add jagged ripped outlines
      ctx.strokeStyle = '#D5D1C6';
      ctx.lineWidth = 2 * multiplier;
      ctx.beginPath();
      ctx.moveTo(10 * multiplier, 10 * multiplier);
      for (let y = 10 * multiplier; y < canvasH - 10 * multiplier; y += 15 * multiplier) {
        ctx.lineTo(10 * multiplier + (Math.sin(y / (5 * multiplier)) * 2 * multiplier) + (Math.random() * 1.5 * multiplier - 0.75 * multiplier), y);
      }
      ctx.lineTo(canvasW - 10 * multiplier, canvasH - 10 * multiplier);
      for (let y = canvasH - 10 * multiplier; y > 10 * multiplier; y -= 15 * multiplier) {
        ctx.lineTo(canvasW - 10 * multiplier + (Math.sin(y / (5 * multiplier)) * 2 * multiplier) + (Math.random() * 1.5 * multiplier - 0.75 * multiplier), y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    } else if (borderId === 'distressed-retro') {
      // White scratches and film speckles
      ctx.save();
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvasW, 0);
        ctx.lineTo(Math.random() * canvasW, canvasH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = (Math.random() * 1 + 0.5) * multiplier;
        ctx.stroke();
      }
      // White hair line dust
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1 * multiplier;
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        const rx = Math.random() * canvasW;
        const ry = Math.random() * canvasH;
        ctx.arc(rx, ry, (Math.random() * 15 + 2) * multiplier, 0, Math.random() * Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    } else if (borderId === 'gilded-museum') {
      // Draw gilded gold corners and frame borders
      ctx.save();
      ctx.strokeStyle = '#C5A059'; // rich dull gold
      ctx.lineWidth = 5 * multiplier;
      ctx.strokeRect(18 * multiplier, 18 * multiplier, canvasW - 36 * multiplier, canvasH - 36 * multiplier);
      
      ctx.strokeStyle = '#E5C07B'; // bright gold highlight
      ctx.lineWidth = 2 * multiplier;
      ctx.strokeRect(23 * multiplier, 23 * multiplier, canvasW - 46 * multiplier, canvasH - 46 * multiplier);

      // Corner ornaments
      const corners = [
        [18 * multiplier, 18 * multiplier],
        [canvasW - 18 * multiplier, 18 * multiplier],
        [18 * multiplier, canvasH - 18 * multiplier],
        [canvasW - 18 * multiplier, canvasH - 18 * multiplier]
      ];
      ctx.fillStyle = '#C5A059';
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 10 * multiplier, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // Load and draw captured photos
    const loadedImages = await Promise.all(photos.map((src) => loadImage(src)));

    // Set filter configuration for snapshots drawing
    ctx.save();
    // We will apply the filter directly on each photo in drawPhotoWithEffects to keep light leak overlays clean/unfiltered!
    
    const padding = 40 * multiplier;
    const gap = 30 * multiplier;

    // Helper to get image or first if empty
    const getImg = (idx: number): HTMLImageElement | undefined => {
      return loadedImages[idx] || loadedImages[0];
    };

    // Helper to draw each photo with its isolated CSS filter and custom light leaks
    const drawPhotoWithEffects = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
      // If bento-plaster, draw offset shadow block FIRST
      if (pictureFrameStroke === 'bento-plaster') {
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 5 * multiplier, y + 5 * multiplier, w, h);
        ctx.restore();
      }

      ctx.save();
      ctx.filter = getCanvasFilterString();
      
      const imgAspect = img.width / img.height;
      const targetAspect = w / h;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      if (imgAspect > targetAspect) {
        // Image is wider than target aspect ratio - crop horizontal sides
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
      } else {
        // Image is taller than target aspect ratio - crop vertical sides
        sh = img.width / targetAspect;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      ctx.restore();

      // Overlay Vignette Dark Corners restricted inside the photo box
      if (filterSettings.vignette > 0) {
        ctx.save();
        const gradient = ctx.createRadialGradient(
          x + w / 2, y + h / 2, Math.min(w, h) * 0.4,
          x + w / 2, y + h / 2, Math.max(w, h) * 0.7
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${(filterSettings.vignette / 100) * 0.8})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
      }

      // Overlay light leak effects
      if (filterSettings.lightLeak && filterSettings.lightLeak !== 'none') {
        ctx.save();
        if (filterSettings.lightLeak === 'sunflare') {
          ctx.globalCompositeOperation = 'screen';
          const grad = ctx.createRadialGradient(
            x + w * 0.9, y + h * 0.1, 0,
            x + w * 0.9, y + h * 0.1, Math.max(w, h) * 1.15
          );
          grad.addColorStop(0, 'rgba(255, 215, 0, 0.45)');
          grad.addColorStop(0.4, 'rgba(255, 120, 0, 0.25)');
          grad.addColorStop(0.75, 'rgba(255, 60, 0, 0.05)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, w, h);
        } else if (filterSettings.lightLeak === 'neonspill') {
          ctx.globalCompositeOperation = 'color-dodge';
          const grad = ctx.createLinearGradient(x, y, x + w, y + h);
          grad.addColorStop(0, 'rgba(255, 46, 84, 0.35)');
          grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.15)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, w, h);
        } else if (filterSettings.lightLeak === 'warmfog') {
          ctx.globalCompositeOperation = 'screen';
          const grad = ctx.createRadialGradient(
            x - w * 0.1, y + h * 0.5, 0,
            x - w * 0.1, y + h * 0.5, Math.max(w, h) * 1.15
          );
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
          grad.addColorStop(0.55, 'rgba(249, 115, 22, 0.15)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, w, h);
        } else if (filterSettings.lightLeak === 'prismflare') {
          ctx.globalCompositeOperation = 'screen';
          const grad = ctx.createLinearGradient(x, y, x + w, y + h);
          grad.addColorStop(0, 'rgba(255, 0, 0, 0.28)');
          grad.addColorStop(0.15, 'rgba(255, 154, 0, 0.22)');
          grad.addColorStop(0.3, 'rgba(208, 222, 33, 0.22)');
          grad.addColorStop(0.45, 'rgba(79, 220, 74, 0.22)');
          grad.addColorStop(0.6, 'rgba(63, 218, 216, 0.22)');
          grad.addColorStop(0.75, 'rgba(47, 201, 226, 0.22)');
          grad.addColorStop(0.9, 'rgba(150, 47, 226, 0.28)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, w, h);
        } else if (filterSettings.lightLeak === 'lensflare') {
          ctx.globalCompositeOperation = 'screen';
          // Main central bright ring
          const grad1 = ctx.createRadialGradient(
            x + w * 0.5, y + h * 0.5, 0,
            x + w * 0.5, y + h * 0.5, Math.max(w, h) * 0.25
          );
          grad1.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          grad1.addColorStop(0.3, 'rgba(255, 235, 180, 0.45)');
          grad1.addColorStop(0.6, 'rgba(255, 180, 100, 0.15)');
          grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad1;
          ctx.fillRect(x, y, w, h);

          // Secondary cyan halo ring
          const grad2 = ctx.createRadialGradient(
            x + w * 0.35, y + h * 0.35, 0,
            x + w * 0.35, y + h * 0.35, Math.max(w, h) * 0.12
          );
          grad2.addColorStop(0, 'rgba(0, 180, 255, 0.35)');
          grad2.addColorStop(0.5, 'rgba(0, 180, 255, 0.12)');
          grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad2;
          ctx.fillRect(x, y, w, h);

          // Tertiary magenta halo ring
          const grad3 = ctx.createRadialGradient(
            x + w * 0.65, y + h * 0.65, 0,
            x + w * 0.65, y + h * 0.65, Math.max(w, h) * 0.18
          );
          grad3.addColorStop(0, 'rgba(255, 0, 128, 0.28)');
          grad3.addColorStop(0.5, 'rgba(255, 0, 128, 0.08)');
          grad3.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad3;
          ctx.fillRect(x, y, w, h);
        } else if (filterSettings.lightLeak === 'disco-glimmer') {
          ctx.globalCompositeOperation = 'color-dodge';
          // Draw ambient white star spots
          const sparkles = [
            { rx: 0.15, ry: 0.25, size: 0.15, opacity: 0.65 },
            { rx: 0.85, ry: 0.35, size: 0.18, opacity: 0.55 },
            { rx: 0.35, ry: 0.7, size: 0.12, opacity: 0.55 },
            { rx: 0.75, ry: 0.8, size: 0.15, opacity: 0.65 }
          ];
          sparkles.forEach((s) => {
            const grad = ctx.createRadialGradient(
              x + w * s.rx, y + h * s.ry, 0,
              x + w * s.rx, y + h * s.ry, Math.max(w, h) * s.size
            );
            grad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, w, h);
          });

          // Horizontal/Vertical star lens rays
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1;
          sparkles.forEach((s) => {
            const sx = x + w * s.rx;
            const sy = y + h * s.ry;
            const rLen = Math.max(w, h) * 0.25;
            ctx.beginPath();
            ctx.moveTo(sx - rLen, sy);
            ctx.lineTo(sx + rLen, sy);
            ctx.moveTo(sx, sy - rLen);
            ctx.lineTo(sx, sy + rLen);
            ctx.stroke();
          });
        }
        ctx.restore();
      }

      // Draw premium customized picture holder strokes
      if (pictureFrameStroke && pictureFrameStroke !== 'none') {
        ctx.save();
        if (pictureFrameStroke === 'white-stroke') {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 4 * multiplier;
          ctx.strokeRect(x, y, w, h);
        } else if (pictureFrameStroke === 'bento-plaster') {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 5 * multiplier;
          ctx.strokeRect(x, y, w, h);
        } else if (pictureFrameStroke === 'polaroid-classic') {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 14 * multiplier;
          ctx.strokeRect(x, y, w, h);
        } else if (pictureFrameStroke === 'vintage-burn') {
          // Draw outer scorched border
          ctx.strokeStyle = '#5c4033';
          ctx.lineWidth = 6 * multiplier;
          ctx.strokeRect(x, y, w, h);
          // Inner distressed tint
          ctx.strokeStyle = 'rgba(139, 92, 26, 0.2)';
          ctx.lineWidth = 12 * multiplier;
          ctx.strokeRect(x, y, w, h);
        }
        ctx.restore();
      }

      ctx.restore();
    };

    if (template === 'strip' || template === 'vintage-silver') {
      const imgW = canvasW - padding * 2;
      const imgH = (canvasH * 0.85 - padding * 2 - gap * 3) / 4;

      for (let i = 0; i < 4; i++) {
        const img = getImg(i);
        if (img) {
          const startY = padding + i * (imgH + gap);
          drawPhotoWithEffects(img, padding, startY, imgW, imgH);
        }
      }
    } else if (template === 'double-strip') {
      const halfW = canvasW / 2;
      const imgW = halfW - padding * 1.6;
      const imgH = (canvasH * 0.85 - padding * 2 - gap * 3) / 4;

      for (let i = 0; i < 4; i++) {
        const img = getImg(i);
        if (img) {
          const startY = padding + i * (imgH + gap);
          drawPhotoWithEffects(img, padding, startY, imgW, imgH);
          drawPhotoWithEffects(img, halfW + padding * 0.6, startY, imgW, imgH);
        }
      }

      // Draw vintage dashed separator cut line down the exact center
      ctx.save();
      ctx.strokeStyle = borderId === 'black' || borderId === 'sprocket' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 4 * multiplier;
      ctx.setLineDash([12 * multiplier, 12 * multiplier]);
      ctx.beginPath();
      ctx.moveTo(halfW, 20 * multiplier);
      ctx.lineTo(halfW, canvasH - 20 * multiplier);
      ctx.stroke();
      ctx.restore();
    } else if (template === 'grid' || template === 'purikura') {
      const imgW = (canvasW - padding * 2 - gap) / 2;
      const imgH = imgW;

      const coords = [
        [padding, padding],
        [padding + imgW + gap, padding],
        [padding, padding + imgH + gap],
        [padding + imgW + gap, padding + imgH + gap],
      ];

      for (let i = 0; i < 4; i++) {
        const img = getImg(i);
        if (img && coords[i]) {
          drawPhotoWithEffects(img, coords[i][0], coords[i][1], imgW, imgH);
        }
      }
    } else if (template === 'polaroid' || template === 'golden-polaroid') {
      const imgW = canvasW - padding * 2;
      const imgH = imgW;
      const img = getImg(0);
      if (img) {
        drawPhotoWithEffects(img, padding, padding, imgW, imgH);
      }
    } else if (template === 'polaroid-wide') {
      const imgW = canvasW - padding * 2;
      const imgH = canvasH - padding * 2 - 120 * multiplier;
      const img = getImg(0);
      if (img) {
        drawPhotoWithEffects(img, padding, padding, imgW, imgH);
      }
    } else if (template === 'duo') {
      const imgW = (canvasW - padding * 2 - gap) / 2;
      const imgH = canvasH - padding * 2 - 120 * multiplier;

      for (let i = 0; i < 2; i++) {
        const img = getImg(i);
        if (img) {
          const startX = padding + i * (imgW + gap);
          drawPhotoWithEffects(img, startX, padding, imgW, imgH);
        }
      }
    } else if (template === 'cinematic' || template === 'directors-cut') {
      const imgW = canvasW - padding * 2;
      const imgH = (canvasH * 0.82 - padding * 2 - gap * 2) / 3;

      for (let i = 0; i < 3; i++) {
        const img = getImg(i);
        if (img) {
          const startY = padding + i * (imgH + gap);
          drawPhotoWithEffects(img, padding, startY, imgW, imgH);
        }
      }
    } else if (template === 'sprocket-roll') {
      // 3 horizontal widescreen photos with sprocket strip look
      const imgW = (canvasW - padding * 2 - gap * 2) / 3;
      const imgH = canvasH - padding * 2;

      for (let i = 0; i < 3; i++) {
        const img = getImg(i);
        if (img) {
          const startX = padding + i * (imgW + gap);
          drawPhotoWithEffects(img, startX, padding, imgW, imgH);
        }
      }
    } else if (template === 'neo-noir' || template === 'magazine') {
      // 1 single premium dramatic focus image
      const imgW = canvasW - padding * 2;
      const imgH = canvasH - padding * 2 - 120 * multiplier;
      const img = getImg(0);
      if (img) {
        drawPhotoWithEffects(img, padding, padding, imgW, imgH);
      }
    } else if (template === 'comic') {
      // 3 vertical panels side-by-side
      const imgW = (canvasW - padding * 2 - gap * 2) / 3;
      const imgH = canvasH - padding * 2;

      for (let i = 0; i < 3; i++) {
        const img = getImg(i);
        if (img) {
          const startX = padding + i * (imgW + gap);
          drawPhotoWithEffects(img, startX, padding, imgW, imgH);
        }
      }
    } else if (template === 'ticket') {
      // 4 poses stacked nicely
      const imgW = canvasW - padding * 2;
      const imgH = (canvasH * 0.75 - padding * 2 - gap * 3) / 4;

      for (let i = 0; i < 4; i++) {
        const img = getImg(i);
        if (img) {
          const startY = padding + i * (imgH + gap);
          drawPhotoWithEffects(img, padding, startY, imgW, imgH);
        }
      }
    } else if (template === 'cyber-glitch') {
      // 2 horizontal side-by-side photos
      const imgW = (canvasW - padding * 2 - gap) / 2;
      const imgH = canvasH - padding * 2;

      for (let i = 0; i < 2; i++) {
        const img = getImg(i);
        if (img) {
          const startX = padding + i * (imgW + gap);
          drawPhotoWithEffects(img, startX, padding, imgW, imgH);
        }
      }
    } else if (template === 'grunge-collage') {
      // 4 overlapping collage snapshots slightly rotated and styled
      const positions = [
        { x: canvasW * 0.3, y: canvasH * 0.3, rot: -0.1 },
        { x: canvasW * 0.7, y: canvasH * 0.32, rot: 0.08 },
        { x: canvasW * 0.32, y: canvasH * 0.7, rot: 0.05 },
        { x: canvasW * 0.68, y: canvasH * 0.72, rot: -0.06 },
      ];
      const size = 360 * multiplier;

      for (let i = 0; i < 4; i++) {
        const img = getImg(i);
        if (img) {
          ctx.save();
          ctx.translate(positions[i].x, positions[i].y);
          ctx.rotate(positions[i].rot);
          // Draw subtle drop shadow for scrapbook layer feel
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 15 * multiplier;
          ctx.shadowOffsetY = 6 * multiplier;
          ctx.fillStyle = '#FFFFFF';
          // Draw mini Polaroid paper background under each photo
          ctx.fillRect(-size / 2 - 10 * multiplier, -size / 2 - 10 * multiplier, size + 20 * multiplier, size + 50 * multiplier);
          drawPhotoWithEffects(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      }
    } else if (template === 'gallery') {
      // 2 side-by-side arched portraits
      const imgW = (canvasW - padding * 2 - gap) / 2;
      const imgH = canvasH - padding * 2 - 100 * multiplier;

      for (let i = 0; i < 2; i++) {
        const img = getImg(i);
        if (img) {
          const startX = padding + i * (imgW + gap);
          const startY = padding;

          ctx.save();
          // Clip path to form an elegant rounded arch top
          ctx.beginPath();
          ctx.arc(startX + imgW / 2, startY + imgW / 2, imgW / 2, Math.PI, 0, false);
          ctx.lineTo(startX + imgW, startY + imgH);
          ctx.lineTo(startX, startY + imgH);
          ctx.closePath();
          ctx.clip();

          drawPhotoWithEffects(img, startX, startY, imgW, imgH);
          ctx.restore();
        }
      }
    } else if (template === 'passport') {
      // 4 identical portrait outputs of first pose
      const imgW = (canvasW - padding * 2 - gap) / 2;
      const imgH = (canvasH - padding * 2 - gap) / 2;

      const coords = [
        [padding, padding],
        [padding + imgW + gap, padding],
        [padding, padding + imgH + gap],
        [padding + imgW + gap, padding + imgH + gap],
      ];

      for (let i = 0; i < 4; i++) {
        const img = getImg(0); // passport quad is always the exact same pose 1!
        if (img) {
          drawPhotoWithEffects(img, coords[i][0], coords[i][1], imgW, imgH);
        }
      }
    } else if (template === 'wedding') {
      // 3 vertical portrait photos with gold frame divider dividers
      const imgW = (canvasW - padding * 2 - gap * 2) / 3;
      const imgH = canvasH - padding * 2 - 100 * multiplier;

      for (let i = 0; i < 3; i++) {
        const img = getImg(i);
        if (img) {
          const startX = padding + i * (imgW + gap);
          drawPhotoWithEffects(img, startX, padding, imgW, imgH);

          // Draw elegant golden leaf stroke around photo
          ctx.strokeStyle = '#D4AF37'; // gold
          ctx.lineWidth = 3 * multiplier;
          ctx.strokeRect(startX, padding, imgW, imgH);
        }
      }
    } else if (template === 'neon-wave') {
      const imgW = (canvasW - padding * 2 - gap) / 2;
      const imgH = imgW;
      const coords = [
        [padding, padding],
        [padding + imgW + gap, padding],
        [padding, padding + imgH + gap],
        [padding + imgW + gap, padding + imgH + gap],
      ];
      for (let i = 0; i < 4; i++) {
        const img = getImg(i);
        if (img) {
          drawPhotoWithEffects(img, coords[i][0], coords[i][1], imgW, imgH);
          ctx.strokeStyle = i % 2 === 0 ? '#00f0ff' : '#ff007f';
          ctx.lineWidth = 4 * multiplier;
          ctx.strokeRect(coords[i][0], coords[i][1], imgW, imgH);
        }
      }
    } else if (template === 'editorial') {
      const imgW = canvasW - padding * 3;
      const imgH = canvasH - padding * 4 - 80 * multiplier;
      const img = getImg(0);
      if (img) {
        drawPhotoWithEffects(img, padding * 1.5, padding * 1.5, imgW, imgH);
        ctx.strokeStyle = '#12141C';
        ctx.lineWidth = 1.5 * multiplier;
        ctx.strokeRect(padding * 1.5, padding * 1.5, imgW, imgH);
      }
    } else if (template === 'marquee') {
      const imgW = canvasW - padding * 2.5;
      const imgH = (canvasH * 0.82 - padding * 2 - gap * 2) / 3;
      for (let i = 0; i < 3; i++) {
        const img = getImg(i);
        if (img) {
          drawPhotoWithEffects(img, padding * 1.25, padding * 1.25 + i * (imgH + gap), imgW, imgH);
          ctx.strokeStyle = '#C5A059';
          ctx.lineWidth = 4 * multiplier;
          ctx.strokeRect(padding * 1.25, padding * 1.25 + i * (imgH + gap), imgW, imgH);
        }
      }
    }

    ctx.restore();

    // 2. Draw Text Captions with custom layout pairings
    ctx.fillStyle = captionColor;
    let fontName = 'sans-serif';
    let fontSize = 32;

    switch (captionFont) {
      case 'display':
        fontName = '"Space Grotesk", sans-serif';
        fontSize = 38;
        break;
      case 'serif':
        fontName = '"Playfair Display", serif';
        fontSize = 44;
        break;
      case 'mono':
        fontName = '"Courier Prime", monospace';
        fontSize = 28;
        break;
      case 'handwriting':
        fontName = '"Caveat", cursive';
        fontSize = 62;
        break;
      case 'signature':
        fontName = '"Dancing Script", cursive';
        fontSize = 68;
        break;
      case 'retroblack':
        fontName = '"Archivo Black", sans-serif';
        fontSize = 42;
        break;
      default:
        fontName = 'Inter, sans-serif';
        fontSize = 32;
    }

    fontSize = Math.round(fontSize * multiplier);
    
    // Set matching styling properties
    if (captionFont === 'display') {
      ctx.font = `800 ${fontSize}px ${fontName}`;
    } else if (captionFont === 'serif') {
      ctx.font = `italic 600 ${fontSize}px ${fontName}`;
    } else if (captionFont === 'mono') {
      ctx.font = `700 ${fontSize}px ${fontName}`;
    } else if (captionFont === 'handwriting') {
      ctx.font = `700 ${fontSize}px ${fontName}`;
    } else if (captionFont === 'signature') {
      ctx.font = `700 ${fontSize}px ${fontName}`;
    } else if (captionFont === 'retroblack') {
      ctx.font = `900 ${fontSize}px ${fontName}`;
    } else {
      ctx.font = `800 ${fontSize}px ${fontName}`;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let textY = canvasH - 75 * multiplier;
    if (template === 'strip' || template === 'double-strip') {
      textY = canvasH - 100 * multiplier;
    } else if (template === 'polaroid' || template === 'editorial' || template === 'marquee') {
      textY = canvasH - 95 * multiplier;
    }

    if (['strip', 'vintage-silver', 'double-strip', 'polaroid', 'golden-polaroid', 'polaroid-wide', 'ticket', 'duo', 'cinematic', 'directors-cut', 'neo-noir', 'magazine', 'wedding', 'gallery', 'editorial', 'marquee', 'neon-wave'].includes(template)) {
      ctx.fillText((caption || 'DIGISMILE SESSION').toUpperCase(), canvasW / 2, textY);

      // Date timestamp drawing
      ctx.fillStyle = borderId === 'black' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
      ctx.font = `bold ${Math.round(14 * multiplier)}px "Courier Prime", monospace`;
      ctx.fillText(new Date().toLocaleDateString(), canvasW / 2, textY + 45 * multiplier);
    }

    // 3. Draw Emojis / Stamps
    for (const sticker of stickers) {
      ctx.save();
      const stX = (sticker.x / 100) * canvasW;
      const stY = (sticker.y / 100) * canvasH;

      ctx.translate(stX, stY);
      ctx.rotate((sticker.rotation * Math.PI) / 180);

      // Add subtle drop shadow to stamps
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10 * multiplier;
      ctx.shadowOffsetY = 4 * multiplier;

      if (sticker.src) {
        try {
          const sImg = await loadImage(sticker.src);
          const baseSize = canvasW * 0.18;
          const sW = baseSize * sticker.scale;
          const sH = sW * (sImg.height / sImg.width);
          ctx.drawImage(sImg, -sW / 2, -sH / 2, sW, sH);
        } catch (e) {
          console.error("Failed to render custom watermark sticker:", e);
        }
      } else {
        const emojiSize = canvasW * 0.13 * sticker.scale;
        ctx.font = `${emojiSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.emoji || '⭐', 0, 0);
      }
      ctx.restore();
    }

    // Draw thematic corner overlay emojis on top of the final composite for printable perfection
    if (frameThemeId && frameThemeId !== 'none') {
      ctx.save();
      const emojiSize = Math.floor(canvasW * 0.05);
      ctx.font = `${emojiSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      // Add subtle drop shadow to corner icons
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;

      if (frameThemeId === 'birthday') {
        ctx.fillText('🎈', canvasW * 0.08, canvasH * 0.04);
        ctx.fillText('🎉', canvasW * 0.92, canvasH * 0.12);
        ctx.fillText('🍰', canvasW * 0.08, canvasH * 0.85);
        ctx.fillText('🎁', canvasW * 0.92, canvasH * 0.75);
      } else if (frameThemeId === 'holiday') {
        ctx.fillText('🌅', canvasW * 0.08, canvasH * 0.04);
        ctx.fillText('🌴', canvasW * 0.92, canvasH * 0.12);
        ctx.fillText('🌊', canvasW * 0.08, canvasH * 0.85);
        ctx.fillText('🍹', canvasW * 0.92, canvasH * 0.75);
      } else if (frameThemeId === 'nature') {
        ctx.fillText('🌸', canvasW * 0.08, canvasH * 0.04);
        ctx.fillText('🍃', canvasW * 0.92, canvasH * 0.12);
        ctx.fillText('🌸', canvasW * 0.08, canvasH * 0.85);
        ctx.fillText('🦋', canvasW * 0.92, canvasH * 0.75);
      } else if (frameThemeId === 'love') {
        ctx.fillText('❤️', canvasW * 0.08, canvasH * 0.04);
        ctx.fillText('💖', canvasW * 0.92, canvasH * 0.12);
        ctx.fillText('💝', canvasW * 0.08, canvasH * 0.85);
        ctx.fillText('💌', canvasW * 0.92, canvasH * 0.75);
      } else if (frameThemeId === 'halloween') {
        ctx.fillText('🎃', canvasW * 0.08, canvasH * 0.04);
        ctx.fillText('👻', canvasW * 0.92, canvasH * 0.12);
        ctx.fillText('🦇', canvasW * 0.08, canvasH * 0.85);
        ctx.fillText('🕷️', canvasW * 0.92, canvasH * 0.75);
      } else if (frameThemeId === 'thanksgiving') {
        ctx.fillText('🦃', canvasW * 0.08, canvasH * 0.04);
        ctx.fillText('🍂', canvasW * 0.92, canvasH * 0.12);
        ctx.fillText('🥧', canvasW * 0.08, canvasH * 0.85);
        ctx.fillText('🍁', canvasW * 0.92, canvasH * 0.75);
      } else if (frameThemeId === 'goth') {
        ctx.fillText('🖤', canvasW * 0.08, canvasH * 0.04);
        ctx.fillText('🦇', canvasW * 0.92, canvasH * 0.12);
        ctx.fillText('🕸️', canvasW * 0.08, canvasH * 0.85);
        ctx.fillText('💀', canvasW * 0.92, canvasH * 0.75);
      } else if (frameThemeId === 'christmas') {
        ctx.fillText('🎄', canvasW * 0.08, canvasH * 0.04);
        ctx.fillText('❄️', canvasW * 0.92, canvasH * 0.12);
        ctx.fillText('🎅', canvasW * 0.08, canvasH * 0.85);
        ctx.fillText('🎁', canvasW * 0.92, canvasH * 0.75);
      } else if (frameThemeId === 'girly') {
        ctx.fillText('🎀', canvasW * 0.08, canvasH * 0.04);
        ctx.fillText('🍒', canvasW * 0.92, canvasH * 0.12);
        ctx.fillText('🌸', canvasW * 0.08, canvasH * 0.85);
        ctx.fillText('🦄', canvasW * 0.92, canvasH * 0.75);
      }
      ctx.restore();
    }

    // Apply unified film grain noise over everything!
    if (filterSettings.grain > 0) {
      ctx.save();
      const noiseIntensity = (filterSettings.grain / 100) * 0.32; // high definition grain density
      const noiseImageData = ctx.createImageData(canvasW, canvasH);
      const data = noiseImageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const rand = Math.random() * 255;
        data[i] = rand;     // r
        data[i + 1] = rand; // g
        data[i + 2] = rand; // b
        data[i + 3] = Math.random() * 255 * noiseIntensity; // a
      }
      const noiseCanvas = document.createElement('canvas');
      noiseCanvas.width = canvasW;
      noiseCanvas.height = canvasH;
      noiseCanvas.getContext('2d')?.putImageData(noiseImageData, 0, 0);
      ctx.drawImage(noiseCanvas, 0, 0);
      ctx.restore();
    }

    // Apply Ultra Print Paper Simulation
    if (paperTexture !== 'none') {
      ctx.save();
      if (paperTexture === 'matte') {
        // Matte Finish: Low-contrast, subtle fine grain texture, soft flat chalky diffuse look.
        // 1. Gently wash out deep blacks for realistic paper absorbency
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(0, 0, canvasW, canvasH);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 2. Fine organic paper fiber texture
        const matteImageData = ctx.createImageData(canvasW, canvasH);
        const mData = matteImageData.data;
        const matteIntensity = 0.09;
        for (let i = 0; i < mData.length; i += 4) {
          const rand = Math.random() * 255;
          mData[i] = rand;
          mData[i + 1] = rand;
          mData[i + 2] = rand;
          mData[i + 3] = Math.random() * 255 * matteIntensity;
        }
        const matteNoiseCanvas = document.createElement('canvas');
        matteNoiseCanvas.width = canvasW;
        matteNoiseCanvas.height = canvasH;
        matteNoiseCanvas.getContext('2d')?.putImageData(matteImageData, 0, 0);
        
        ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(matteNoiseCanvas, 0, 0);
      } else if (paperTexture === 'glossy') {
        // Glossy Print: High-contrast, shiny specular highlights simulated with a dynamic gradient or light reflections overlay.
        // 1. Sleek diagonal sheen across the photo strip
        const sheenGrad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
        sheenGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
        sheenGrad.addColorStop(0.34, 'rgba(255, 255, 255, 0.22)');
        sheenGrad.addColorStop(0.38, 'rgba(255, 255, 255, 0.15)');
        sheenGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.0)');
        sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 2. Extra radial flash glare
        const glareGrad = ctx.createRadialGradient(canvasW * 0.9, 0, 10, canvasW * 0.9, 0, canvasW * 0.6);
        glareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
        glareGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.03)');
        glareGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glareGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (paperTexture === 'satin') {
        // Satin/Luster Finish: Semi-gloss pearlescent micro-texture, combines delicate grain with soft directional reflection.
        // 1. Soft widespread satin reflection bands
        const satinGrad = ctx.createLinearGradient(0, canvasH, canvasW, 0);
        satinGrad.addColorStop(0, 'rgba(255, 255, 255, 0.01)');
        satinGrad.addColorStop(0.42, 'rgba(255, 255, 255, 0.08)');
        satinGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
        satinGrad.addColorStop(0.58, 'rgba(255, 255, 255, 0.08)');
        satinGrad.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = satinGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 2. Pebbled luster pearlescent micro-texture
        const satinImageData = ctx.createImageData(canvasW, canvasH);
        const sData = satinImageData.data;
        for (let i = 0; i < sData.length; i += 4) {
          const rand = Math.sin(i / 16) * 127 + 128;
          sData[i] = rand;
          sData[i + 1] = rand;
          sData[i + 2] = rand;
          sData[i + 3] = Math.random() * 255 * 0.07;
        }
        const satinNoiseCanvas = document.createElement('canvas');
        satinNoiseCanvas.width = canvasW;
        satinNoiseCanvas.height = canvasH;
        satinNoiseCanvas.getContext('2d')?.putImageData(satinImageData, 0, 0);
        
        ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(satinNoiseCanvas, 0, 0);
      }
      ctx.restore();
    }

    return canvas;
  };

  // Compile Animated looping GIF
  const compileAnimatedGif = async (): Promise<Blob | null> => {
    try {
      // 1. Setup encoder
      const encoder = GIFEncoder();
      const gifWidth = 400;
      const gifHeight = 300;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = gifWidth;
      tempCanvas.height = gifHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return null;

      const loadedImages = await Promise.all(photos.map((src) => loadImage(src)));

      // Render each photo frame
      for (const img of loadedImages) {
        tempCtx.clearRect(0, 0, gifWidth, gifHeight);

        // Apply selected filter to GIF frames as well!
        tempCtx.save();
        tempCtx.filter = getCanvasFilterString();
        tempCtx.drawImage(img, 0, 0, gifWidth, gifHeight);
        tempCtx.restore();

        // Overlay caption at the bottom of each GIF frame for customized branding
        tempCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        tempCtx.fillRect(0, gifHeight - 32, gifWidth, 32);

        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.font = 'bold 11px Inter, sans-serif';
        tempCtx.textAlign = 'center';
        tempCtx.fillText((caption || 'DIGISMILE VIBES').toUpperCase(), gifWidth / 2, gifHeight - 12);

        // Extract frame pixels
        const { data } = tempCtx.getImageData(0, 0, gifWidth, gifHeight);

        // Use gifenc quantization & write frame
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        encoder.writeFrame(index, gifWidth, gifHeight, {
          palette,
          delay: Math.round(1000 / gifFps),
        });
      }

      encoder.finish();
      const bytes = encoder.bytes();
      return new Blob([bytes], { type: 'image/gif' });
    } catch (err) {
      console.error('GIF synthesis failed:', err);
      return null;
    }
  };

  // Triggers Web Share API natively or copies link
  const handleShare = async (blob: Blob | null, defaultFilename: string, mimeType: string) => {
    if (!blob) return;

    if (navigator.canShare && navigator.share) {
      const file = new File([blob], defaultFilename, { type: mimeType });
      try {
        await navigator.share({
          files: [file],
          title: 'DigiSmile Photobooth Session',
          text: `Check out my photo strip captured with DigiSmile! 📸\n\nCreate yours free here:\nhttps://razeltech.github.io/PhotoboothPro/`,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native sharing failed:', err);
        }
      }
    } else {
      // Fallback copy link to clipboard simulation
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        alert('Could not trigger sharing. Please download files directly!');
      }
    }
  };

  // Direct download functions
  const triggerDownload = (url: string | null, name: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadJpg = () => {
    if (staticJpgUrl) {
      triggerDownload(staticJpgUrl, `digismile-strip-${Date.now()}.jpg`);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        triggerDownload(dataUrl, `digismile-strip-${Date.now()}.jpg`);
      } catch (e) {
        console.error("Failed to compile client-side JPG", e);
      }
    }
  };

  const printImage = () => {
    if (!staticImageUrl) return;

    // Compose physical print filter adjustments to compensate for printer ink absorption
    const filters: string[] = [];
    if (printColorMode === 'mono') {
      filters.push('grayscale(100%) contrast(1.15)');
    }
    
    if (brightnessAdjustment === 'bright') {
      filters.push('brightness(1.12)');
    } else if (brightnessAdjustment === 'bright-plus') {
      filters.push('brightness(1.24)');
    }

    if (printWarmth === 'warm') {
      filters.push('sepia(0.18) hue-rotate(-5deg) saturate(1.1)');
    } else if (printWarmth === 'cool') {
      filters.push('saturate(0.9) hue-rotate(5deg)');
    }

    const filterString = filters.length > 0 ? filters.join(' ') : 'none';
    const imgBorderStyle = showPrintBorder ? 'border: 1px solid rgba(0,0,0,0.12);' : 'border: none;';

    // Page sizing styles & layout configurations
    let pageStyle = '';
    let maxImgHeight = '100%';
    let maxImgWidth = 'auto';

    if (printPaperSize === '4x6') {
      pageStyle = `@page { size: 4in 6in; margin: 0in; } body { width: 4in; height: 6in; margin: 0; padding: 0.1in; }`;
      maxImgHeight = paperSizingMode === 'fill' ? '5.8in' : '5.5in';
    } else if (printPaperSize === 'letter') {
      pageStyle = `@page { size: letter; margin: 0.25in; } body { margin: 0; padding: 0.1in; }`;
      maxImgHeight = paperSizingMode === 'fill' ? '10.2in' : '9.6in';
    } else if (printPaperSize === 'a4') {
      pageStyle = `@page { size: A4; margin: 0.25in; } body { margin: 0; padding: 0.1in; }`;
      maxImgHeight = paperSizingMode === 'fill' ? '11.0in' : '10.2in';
    } else if (printPaperSize === 'wallet') {
      pageStyle = `@page { size: 3.5in 5in; margin: 0in; } body { width: 3.5in; height: 5in; margin: 0; padding: 0.1in; }`;
      maxImgHeight = paperSizingMode === 'fill' ? '4.8in' : '4.4in';
    }

    // Dynamic items composition with crop marks and cut lines
    let itemsHtml = '';
    for (let i = 0; i < printCopies; i++) {
      if (printGridLayout === 'double') {
        itemsHtml += `
          <div class="print-item double-layout">
            <div class="strip-wrapper">
              ${showCutMarks ? `
                <div class="crop-mark crop-tl"></div>
                <div class="crop-mark crop-tr"></div>
                <div class="crop-mark crop-bl"></div>
                <div class="crop-mark crop-br"></div>
              ` : ''}
              <img src="${staticImageUrl}" style="filter: ${filterString}; ${imgBorderStyle}" />
            </div>
            ${showCutMarks ? `
              <div class="cut-guide">
                <div class="cut-badge">✂ CUT CENTER</div>
              </div>
            ` : ''}
            <div class="strip-wrapper">
              ${showCutMarks ? `
                <div class="crop-mark crop-tl"></div>
                <div class="crop-mark crop-tr"></div>
                <div class="crop-mark crop-bl"></div>
                <div class="crop-mark crop-br"></div>
              ` : ''}
              <img src="${staticImageUrl}" style="filter: ${filterString}; ${imgBorderStyle}" />
            </div>
          </div>
        `;
      } else {
        itemsHtml += `
          <div class="print-item single-layout">
            <div class="strip-wrapper">
              ${showCutMarks ? `
                <div class="crop-mark crop-tl"></div>
                <div class="crop-mark crop-tr"></div>
                <div class="crop-mark crop-bl"></div>
                <div class="crop-mark crop-br"></div>
              ` : ''}
              <img src="${staticImageUrl}" style="filter: ${filterString}; ${imgBorderStyle}" />
            </div>
          </div>
        `;
      }
    }

    // Build the iframe document element
    let iframe = document.getElementById('digismile-print-iframe') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'digismile-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      alert("Print subsystem is starting up. Please try again in a moment!");
      return;
    }

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>DigiSmile High-Res Print Studio</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 15px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #ffffff; 
              color: #000000;
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center;
              min-height: 100vh;
            }
            .print-container {
              display: flex;
              flex-direction: column;
              gap: 0.4in;
              align-items: center;
              justify-content: center;
              width: 100%;
            }
            .print-item {
              display: flex;
              justify-content: center;
              align-items: center;
              position: relative;
              page-break-after: always;
              width: 100%;
              max-width: 100%;
              padding: 10px;
            }
            .print-item:last-child {
              page-break-after: avoid;
            }
            .strip-wrapper {
              position: relative;
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 0 auto;
            }
            img { 
              height: ${maxImgHeight};
              width: auto; 
              max-width: 100%;
              display: block;
              image-rendering: auto;
              transition: none;
            }
            .double-layout {
              gap: 0.3in;
            }
            .double-layout .strip-wrapper {
              max-width: 48%;
            }
            .double-layout img {
              max-height: ${maxImgHeight};
              width: auto;
              max-width: 100%;
            }
            
            /* Scissors & Guidelines */
            .cut-guide {
              position: absolute;
              top: 0;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              border-left: 1px dashed rgba(0, 0, 0, 0.35);
              width: 0;
              z-index: 10;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .cut-badge {
              background: #ffffff;
              border: 1px solid #999999;
              color: #333333;
              font-size: 8px;
              font-weight: bold;
              font-family: monospace;
              padding: 2px 5px;
              border-radius: 3px;
              white-space: nowrap;
              letter-spacing: 0.5px;
            }
            
            /* Professional Crop marks for alignment */
            .crop-mark {
              position: absolute;
              width: 12px;
              height: 12px;
              border-color: rgba(0,0,0,0.35);
              border-style: solid;
              pointer-events: none;
              z-index: 5;
            }
            .crop-tl { top: -6px; left: -6px; border-width: 1px 0 0 1px; }
            .crop-tr { top: -6px; right: -6px; border-width: 1px 1px 0 0; }
            .crop-bl { bottom: -6px; left: -6px; border-width: 0 0 1px 1px; }
            .crop-br { bottom: -6px; right: -6px; border-width: 0 1px 1px 0; }

            @media print {
              body { 
                background-color: #ffffff; 
                color: #000000;
                padding: 0;
              }
              .print-container {
                gap: 0;
              }
              ${pageStyle}
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${itemsHtml}
          </div>
          <script>
            // Ensure all assets are loaded before triggering print dialog
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.print();
              }, 400);
            });
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const getPrintFilterStyle = () => {
    const filters: string[] = [];
    if (printColorMode === 'mono') {
      filters.push('grayscale(100%) contrast(1.15)');
    }
    if (brightnessAdjustment === 'bright') {
      filters.push('brightness(1.12)');
    } else if (brightnessAdjustment === 'bright-plus') {
      filters.push('brightness(1.24)');
    }
    if (printWarmth === 'warm') {
      filters.push('sepia(0.18) hue-rotate(-5deg) saturate(1.1)');
    } else if (printWarmth === 'cool') {
      filters.push('saturate(0.9) hue-rotate(5deg)');
    }
    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  return (
    <div className="w-full">
      <canvas ref={canvasRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden' }} />

      {compiling ? (
        <div className="w-full max-w-xl mx-auto bg-razel-card border border-white/10 rounded-2xl p-10 text-center flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-razel-neon animate-spin mb-6" />
          <h3 className="text-xl font-display font-extrabold text-white mb-2">Compiling Creative Assets</h3>
          <p className="text-sm text-white/50 mb-6 max-w-sm">
            Please wait. DigiSmile is drawing the 300-DPI high-res print layout and synthesizing your animated GIF frames...
          </p>
          <div className="w-full bg-white/5 border border-white/10 h-8 rounded-full overflow-hidden relative flex items-center justify-center">
            <div className="absolute top-0 left-0 h-full bg-razel-neon w-[75%] animate-pulse" />
            <span className="relative z-10 font-mono text-[10px] text-white font-bold tracking-widest uppercase">
              {compilingStep}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start min-h-[100dvh] pt-14 lg:pt-0 relative">
          
          {/* Mobile Top App-Like Controls */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-razel-dark/95 backdrop-blur-md border-b border-white/5 z-[60] flex items-center px-4 justify-between">
            <button
              onClick={onReset}
              className="p-2 -ml-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="New Session"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <span className="font-display font-bold text-sm tracking-widest text-white/90">
              FINALIZE
            </span>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>

          {/* Desktop Reset Button */}
          <div className="hidden lg:block absolute -top-8 left-0 lg:left-4 z-50">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-xs font-bold border border-white/5"
            >
              <RotateCcw className="w-4 h-4" /> New Session
            </button>
          </div>

      {/* LEFT COLUMN: Rendered Composite View Tabbed Panel (Sticky on desktop to prevent scrolling) */}
      <div className="w-full lg:w-5/12 flex flex-col items-center lg:sticky lg:top-6 lg:self-start">
        
        {/* Assets Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl mb-4 w-full">
          <button
            onClick={() => setActiveTab('strip')}
            className={`py-3 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === 'strip'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="High-Res Photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`py-3 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === 'print'
                ? 'bg-amber-400 text-black font-extrabold shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Print Sheet"
          >
            <Printer className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setActiveTab('gif')}
            className={`py-3 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === 'gif'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="AeroLoop GIF"
          >
            <Flame className="w-5 h-5" />
          </button>

          {videoBlobUrl ? (
            <button
              onClick={() => setActiveTab('video')}
              className={`py-3 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'video'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title="Timelapse Video"
            >
              <Film className="w-5 h-5" />
            </button>
          ) : (
            <div className="py-3 text-center text-[10px] text-white/20 flex items-center justify-center font-mono">
              <Film className="w-5 h-5 opacity-30" />
            </div>
          )}
        </div>

        {/* Display Wrapper */}
        <div className="w-full max-w-[340px] bg-black/40 border border-white/10 rounded-2xl p-3 shadow-2xl flex items-center justify-center">
          
          {activeTab === 'strip' && staticImageUrl && (
            <div className="w-full rounded-xl overflow-hidden shadow-lg animate-fade-in">
              <img
                src={staticImageUrl}
                alt="High Res Strip"
                className="w-full object-contain"
                style={{
                  maxHeight: '520px',
                }}
              />
            </div>
          )}

          {activeTab === 'print' && staticImageUrl && (
            <div className="w-full flex flex-col items-center animate-fade-in p-1">
              {/* Paper outer simulation sheet */}
              <div 
                className="bg-zinc-100 rounded-lg p-5 shadow-inner relative border border-zinc-200 flex items-center justify-center transition-all duration-300"
                style={{
                  width: '280px',
                  height: printPaperSize === 'letter' ? '362px' :
                          printPaperSize === 'a4' ? '396px' :
                          printPaperSize === '4x6' ? '420px' : '400px',
                  boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.1), 0 10px 25px rgba(0,0,0,0.4)'
                }}
              >
                {/* Paper scale and boundaries indicator */}
                <div className="absolute top-1.5 left-2.5 text-[8px] font-mono font-bold text-zinc-400 select-none tracking-widest">
                  {printPaperSize.toUpperCase()} SHEET SIMULATION
                </div>
                <div className="absolute bottom-1.5 right-2.5 text-[8px] font-mono font-bold text-zinc-400 select-none tracking-widest">
                  {paperSizingMode === 'fit' ? 'FIT (SAFE MARGINS)' : 'FILL (BORDERLESS)'}
                </div>

                {/* Simulated printable items wrapper */}
                <div 
                  className={`flex justify-center items-center h-full w-full relative ${
                    printGridLayout === 'double' ? 'gap-4' : ''
                  }`}
                >
                  <div className="relative flex justify-center items-center">
                    {/* Dotted corner guidelines */}
                    {showCutMarks && (
                      <>
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t border-l border-zinc-500 pointer-events-none" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t border-r border-zinc-500 pointer-events-none" />
                        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b border-l border-zinc-500 pointer-events-none" />
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b border-r border-zinc-500 pointer-events-none" />
                      </>
                    )}
                    <img 
                      src={staticImageUrl} 
                      alt="Mini Preview Strip 1" 
                      className="object-contain shadow-md border border-zinc-300"
                      style={{
                        maxHeight: printPaperSize === '4x6' ? '290px' : '260px',
                        filter: getPrintFilterStyle(),
                        transform: 'scale(0.96)',
                      }}
                    />
                  </div>

                  {printGridLayout === 'double' && (
                    <>
                      {/* Dotted vertical center cut line representation */}
                      {showCutMarks && (
                        <div className="h-4/5 border-l border-dashed border-zinc-400 relative flex items-center justify-center shrink-0">
                          <span className="absolute text-[8px] font-mono bg-zinc-200 text-zinc-700 font-extrabold px-1 py-0.5 rounded border border-zinc-300 rotate-90 select-none tracking-wider">
                            ✂ CUT CENTER
                          </span>
                        </div>
                      )}
                      
                      <div className="relative flex justify-center items-center">
                        {/* Dotted corner guidelines */}
                        {showCutMarks && (
                          <>
                            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t border-l border-zinc-500 pointer-events-none" />
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t border-r border-zinc-500 pointer-events-none" />
                            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b border-l border-zinc-500 pointer-events-none" />
                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b border-r border-zinc-500 pointer-events-none" />
                          </>
                        )}
                        <img 
                          src={staticImageUrl} 
                          alt="Mini Preview Strip 2" 
                          className="object-contain shadow-md border border-zinc-300"
                          style={{
                            maxHeight: printPaperSize === '4x6' ? '290px' : '260px',
                            filter: getPrintFilterStyle(),
                            transform: 'scale(0.96)',
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* simulated physical metadata */}
              <div className="mt-3.5 text-[9px] text-zinc-400 font-mono text-center leading-relaxed max-w-[280px]">
                💡 <span className="text-amber-400 font-bold">Paper Preview Mode:</span> Adjusted to reflect paper ink tone absorption.
              </div>
            </div>
          )}

          {activeTab === 'gif' && gifUrl && (
            <div className="w-full rounded-xl overflow-hidden shadow-lg animate-fade-in bg-zinc-950 flex flex-col justify-between">
              <img
                src={gifUrl}
                alt="Looping GIF"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="p-3 text-center border-t border-white/5 bg-black/50">
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold animate-pulse">
                  ⚡ Animated Live Loop
                </span>
              </div>
            </div>
          )}

          {activeTab === 'video' && videoBlobUrl && (
            <div className="w-full rounded-xl overflow-hidden shadow-lg animate-fade-in bg-zinc-900 flex flex-col relative aspect-[9/16] max-w-[280px] border border-emerald-400/30">
              
              {/* Direct Download Overlay Button */}
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
                <button
                  onClick={() => triggerDownload(videoBlobUrl, `digismile-bts-${Date.now()}.mp4`)}
                  className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/90 backdrop-blur-md text-white shadow-2xl hover:scale-105 active:scale-95 transition-all mt-auto mb-16 border border-emerald-400 font-bold text-sm"
                  title="Download MP4 Video"
                >
                  <Download className="w-5 h-5 animate-bounce" /> Save Video
                </button>
              </div>
              
              {/* Vintage Camcorder HUD Overlay Layer */}
              <div className="absolute inset-0 z-10 p-3 pointer-events-none flex flex-col justify-between font-mono text-[9px] text-emerald-400 select-none">
                {/* Top bar indicators */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-red-500 font-extrabold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> • REC
                    </span>
                    <span>1080p 30fps</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span>AERO-REC</span>
                    <span className="border border-emerald-400/30 px-1 py-0.2 rounded text-[7px] text-amber-400">
                      STBY
                    </span>
                  </div>
                </div>

                {/* Center scanline grain filter */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none mix-blend-overlay" />

                {/* Bottom bar timecode & battery */}
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-0.5">
                    <span>DATE: {new Date().toLocaleDateString()}</span>
                    <span>TIME: {new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span>BATT [||||] 92%</span>
                    <span>CH 1 / L+R</span>
                  </div>
                </div>
              </div>

              {/* Camcorder Viewport Video */}
              <video
                src={videoBlobUrl}
                controls
                loop
                autoPlay
                className="w-full h-full object-cover shrink-0"
                style={{ filter: 'contrast(1.1) saturate(1.2) sepia(0.1)' }}
              />

              {/* Sub-label banner */}
              <div className="absolute bottom-16 left-0 right-0 mx-auto w-11/12 z-20 bg-black/75 backdrop-blur-sm border border-white/10 rounded-lg p-1.5 text-center text-[10px] uppercase font-mono tracking-wider text-sky-400 font-bold shadow-lg">
                🎥 VHS Stories Layout
              </div>

            </div>
          )}

        </div>
      </div>

      {/* RIGHT COLUMN: Download & Share Hub */}
      <div className="w-full lg:flex-1 bg-razel-card border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-display font-extrabold text-white">Capture Completed!</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Your custom photobooth assets are fully generated in high fidelity. Save them below or print out.
            </p>
          </div>
        </div>

        <div className="h-[1px] bg-white/10 mb-6" />

        <div className="flex flex-col gap-4 flex-1">
          {/* Mobile Control Navigation Tabs */}
          <div className="flex overflow-x-auto whitespace-nowrap hide-scrollbar border-b border-white/10 bg-black/30 sticky top-0 z-20">
            {[
              { id: 'downloads', title: 'Save & Download', icon: <Download className="w-5 h-5" /> },
              { id: 'settings', title: 'Print & Layout', icon: <Printer className="w-5 h-5" /> },
              { id: 'qr', title: 'Mobile QR', icon: <QrCode className="w-5 h-5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setExportControlTab(tab.id as any)}
                className={`flex-1 py-4 flex items-center justify-center transition-all border-b-2 ${
                  exportControlTab === tab.id
                    ? 'border-emerald-400 text-emerald-400 bg-white/5'
                    : 'border-transparent text-white/45 hover:text-white/80 hover:bg-white/[0.01]'
                }`}
                title={tab.title}
              >
                {tab.icon}
              </button>
            ))}
          </div>

          {/* TAB 1: SETTINGS (Resolution & Paper & Print) */}
          {exportControlTab === 'settings' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Resolution Profile Selector */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Print DPI Resolution Profile
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20">
                    {getQualityDimensions()}
                  </span>
                </div>
                
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Adjust resolution settings before downloading or printing. Higher multipliers offer crisp layout details and sharp prints.
                </p>

                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => setExportQuality('standard')}
                    className={`py-1.5 px-2 rounded-md text-center text-xs font-bold transition-all ${
                      exportQuality === 'standard'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Standard (1x)
                  </button>
                  <button
                    onClick={() => setExportQuality('print300')}
                    className={`py-1.5 px-2 rounded-md text-center text-xs font-bold transition-all ${
                      exportQuality === 'print300'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    300 DPI Print (2x)
                  </button>
                  <button
                    onClick={() => setExportQuality('ultra400')}
                    className={`py-1.5 px-2 rounded-md text-center text-xs font-bold transition-all ${
                      exportQuality === 'ultra400'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    400 DPI Ultra (3x)
                  </button>
                </div>
              </div>

              {/* Premium Paper Simulation */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Premium Paper Texture Finish
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 uppercase tracking-wider">
                    Ultra Print Simulation
                  </span>
                </div>
                
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Apply realistic physical paper grain and light reflections over your final photo strip.
                </p>

                <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
                  {[
                    { id: 'none', name: 'Digital (None)', desc: 'Smooth' },
                    { id: 'matte', name: 'Matte Finish', desc: 'Flat Grain' },
                    { id: 'satin', name: 'Satin Luster', desc: 'Pebbled' },
                    { id: 'glossy', name: 'Glossy Print', desc: 'Shiny Sheen' },
                  ].map((paper) => (
                    <button
                      key={paper.id}
                      onClick={() => setPaperTexture(paper.id as any)}
                      className={`py-2 px-1 rounded-md text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                        paperTexture === paper.id
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="text-[10px] font-bold leading-tight">{paper.name}</span>
                      <span className="text-[8px] opacity-60 leading-none mt-0.5">{paper.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Print settings container */}
              <div className="mt-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <button
                  onClick={() => {
                    const nextState = !showPrintSettings;
                    setShowPrintSettings(nextState);
                    if (nextState) {
                      setActiveTab('print');
                    } else {
                      setActiveTab('strip');
                    }
                  }}
                  className="w-full flex items-center justify-between text-xs font-bold text-white/80 hover:text-white uppercase tracking-wider transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    Customize Print Options
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    {showPrintSettings ? 'Close Config' : 'Configure'}
                  </span>
                </button>

                {showPrintSettings && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4 animate-fade-in text-left">
                    {/* Print Copies */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-medium">Print Copies</span>
                      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold hover:bg-white/10 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold text-white min-w-8 text-center">{printCopies}</span>
                        <button
                          type="button"
                          onClick={() => setPrintCopies(Math.min(10, printCopies + 1))}
                          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold hover:bg-white/10 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Paper Size */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-zinc-400 font-medium">Paper Size</span>
                      <div className="grid grid-cols-4 gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1">
                        {(['letter', 'a4', '4x6', 'wallet'] as const).map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setPrintPaperSize(size)}
                            className={`py-1 px-1 text-[10px] font-bold rounded capitalize tracking-wide transition-all ${
                              printPaperSize === size
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                : 'text-zinc-400 hover:text-white border border-transparent'
                            }`}
                          >
                            {size === 'letter' ? 'Letter' : size === 'a4' ? 'A4' : size === '4x6' ? '4"x6"' : 'Wallet'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color mode & Layout style */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-zinc-400 font-medium">Color Mode</span>
                        <div className="grid grid-cols-2 gap-1 bg-black/40 border border-white/10 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setPrintColorMode('color')}
                            className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                              printColorMode === 'color'
                                ? 'bg-amber-400/20 text-amber-300'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Color
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrintColorMode('mono')}
                            className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                              printColorMode === 'mono'
                                ? 'bg-zinc-800 text-zinc-200'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Retro B&W
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-zinc-400 font-medium">Layout Style</span>
                        <div className="grid grid-cols-2 gap-1 bg-black/40 border border-white/10 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setPrintGridLayout('single')}
                            className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                              printGridLayout === 'single'
                                ? 'bg-amber-400/20 text-amber-300'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Single
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrintGridLayout('double')}
                            className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                              printGridLayout === 'double'
                                ? 'bg-amber-400/20 text-amber-300'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                            title="Prints 2 copies side-by-side on one sheet"
                          >
                            Duo Strip
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Paper Sizing Mode */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400 font-medium">Paper Sizing Boundary</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 bg-black/40 border border-white/10 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setPaperSizingMode('fit')}
                          className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                            paperSizingMode === 'fit'
                              ? 'bg-amber-400/20 text-amber-300'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                          title="Saves a standard print-safe blank margin around photo strips"
                        >
                          Fit to Page (Safe)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaperSizingMode('fill')}
                          className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                            paperSizingMode === 'fill'
                              ? 'bg-amber-400/20 text-amber-300'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                          title="Fills the entire sheet of photo paper borderlessly"
                        >
                          Fill Page (Borderless)
                        </button>
                      </div>
                    </div>

                    {/* Ink Density Brightness Compensation */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                          <Sun className="w-3.5 h-3.5 text-amber-400" /> Ink Density Compensator
                        </span>
                        <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider">Absorption Boost</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-black/40 border border-white/10 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setBrightnessAdjustment('neutral')}
                          className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                            brightnessAdjustment === 'neutral'
                              ? 'bg-amber-400/20 text-amber-300'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                          title="Standard digital exposure profile"
                        >
                          Standard (0%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrightnessAdjustment('bright')}
                          className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                            brightnessAdjustment === 'bright'
                              ? 'bg-amber-400/20 text-amber-300'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                          title="Compensate standard ink absorption with mild brightness boost (+12%)"
                        >
                          Medium (+12%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrightnessAdjustment('bright-plus')}
                          className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                            brightnessAdjustment === 'bright-plus'
                              ? 'bg-amber-400/20 text-amber-300'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                          title="Strong brightness boost for heavy matte photo paper to prevent dark prints (+24%)"
                        >
                          Heavy (+24%)
                        </button>
                      </div>
                    </div>

                    {/* Print Temperature Warmth */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Print Temperature Warmth
                        </span>
                        <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider">White Balance</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-black/40 border border-white/10 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setPrintWarmth('neutral')}
                          className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                            printWarmth === 'neutral'
                              ? 'bg-amber-400/20 text-amber-300'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                          title="True color profile matching"
                        >
                          Neutral Studio
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintWarmth('warm')}
                          className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                            printWarmth === 'warm'
                              ? 'bg-amber-400/20 text-amber-300'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                          title="Apply vintage sepia undertones for dynamic physical warmth"
                        >
                          Warm Vintage
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintWarmth('cool')}
                          className={`py-1 text-[10px] font-bold rounded tracking-wide transition-all ${
                            printWarmth === 'cool'
                              ? 'bg-amber-400/20 text-amber-300'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                          title="Apply rich cyan studio highlights for clean monochrome prints"
                        >
                          Cool Studio
                        </button>
                      </div>
                    </div>

                    {/* Toggle Crop Guidelines & Cut Marks */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-amber-400" />
                        Crop marks &amp; Cut guides
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCutMarks(!showCutMarks)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          showCutMarks ? 'bg-amber-400' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-black transition-transform ${
                            showCutMarks ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle border outline */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-medium">Print Frame Border</span>
                      <button
                        type="button"
                        onClick={() => setShowPrintBorder(!showPrintBorder)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          showPrintBorder ? 'bg-amber-400' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-black transition-transform ${
                            showPrintBorder ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Print action button inside settings tab */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={printImage}
                  className="flex-1 py-3.5 px-4 rounded-xl border border-amber-400/30 hover:border-amber-400 bg-amber-400/10 hover:bg-amber-400/20 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-md shadow-amber-500/5"
                >
                  <Printer className="w-4 h-4 text-amber-400 animate-pulse" /> Print Photo Strip
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: QR Transfer */}
          {exportControlTab === 'qr' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-razel-neon" /> Instant Mobile Transfer
                  </span>
                  <span className="text-[10px] font-mono font-bold text-razel-neon px-2 py-0.5 rounded bg-razel-neon/10 border border-razel-neon/20 uppercase tracking-wider">
                    Dynamic QR
                  </span>
                </div>

                <p className="text-[11px] text-white/50 leading-relaxed">
                  Scan with your phone's camera to instantly save your high-res photo strip or launch this photobooth session on mobile.
                </p>

                <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                  <button
                    type="button"
                    onClick={() => setQrTab('direct-photo')}
                    className={`py-1.5 px-2 rounded-md text-center text-xs font-bold transition-all cursor-pointer ${
                      qrTab === 'direct-photo'
                        ? 'bg-razel-neon text-white shadow-lg'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    📸 Mobile Save Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTab('app-link')}
                    className={`py-1.5 px-2 rounded-md text-center text-xs font-bold transition-all cursor-pointer ${
                      qrTab === 'app-link'
                        ? 'bg-razel-neon text-white shadow-lg'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    🔗 Share App Link
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/80 border border-white/5 rounded-xl min-h-[210px]">
                  {qrLoading ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <Loader2 className="w-8 h-8 text-razel-neon animate-spin" />
                      <span className="text-xs font-mono text-white/50">
                        {qrTab === 'direct-photo' ? 'Uploading & Generating...' : 'Creating App Link QR...'}
                      </span>
                    </div>
                  ) : qrUrl ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="p-2 bg-white rounded-xl shadow-lg border border-white/10">
                        <img src={qrUrl} alt="Scan QR Code" className="w-36 h-36 object-contain rounded" />
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono text-center flex items-center justify-center gap-1.5 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 animate-pulse" /> 
                        {qrTab === 'direct-photo' ? 'High-Res Direct Link ready' : 'Workspace Launch Link ready'}
                      </span>
                      {qrError && (
                        <span className="text-[9px] text-amber-400/80 text-center max-w-[220px] leading-tight">
                          {qrError}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">Failed to load QR code.</div>
                  )}
                </div>
              </div>
              
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  } catch (e) {}
                }}
                className="w-full py-3.5 px-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copied Link!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-400" /> Copy Share Link
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: DOWNLOADS (Static, GIF, Video) */}
          {exportControlTab === 'downloads' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Static Image Box */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" /> High-Res Photo Composite
                  </h4>
                  <p className="text-xs text-white/40 leading-normal mt-0.5">
                    Perfect for 300 DPI high-quality photo prints or wallpaper backgrounds.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadJpg}
                    className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                    title="Download standard high-res JPG print"
                  >
                    <Download className="w-3.5 h-3.5" /> JPG
                  </button>

                  <button
                    onClick={() => triggerDownload(staticImageUrl, `digismile-strip-${Date.now()}.png`)}
                    className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white/95 border border-white/10 font-semibold text-xs transition-colors flex items-center gap-1"
                    title="Download lossless high-res PNG"
                  >
                    <Download className="w-3.5 h-3.5" /> PNG
                  </button>
                  
                  <button
                    onClick={() => handleShare(staticImageBlob, `digismile-photo.png`, 'image/png')}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                    title="Share image to external applications"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>

              {/* Looping GIF Box */}
              {gifUrl && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-razel-neon" /> DigiSmile Loop Animated GIF
                      </h4>
                      <p className="text-xs text-white/40 leading-normal mt-0.5">
                        A looping digital animated flipbook of all your captured poses.
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => triggerDownload(gifUrl, `digismile-loop-${Date.now()}.gif`)}
                        className="px-4 py-2.5 rounded-lg bg-razel-neon hover:bg-razel-neon/95 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> GIF
                      </button>

                      <button
                        onClick={() => handleShare(gifBlob, `digismile-loop.gif`, 'image/gif')}
                        className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                      >
                        <Share2 className="w-4 h-4 text-razel-neon" />
                      </button>
                    </div>
                  </div>

                  {/* Animated Loop Velocity Control Slider */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-razel-neon" /> Loop Playback Velocity
                      </span>
                      <span className="text-[11px] font-mono font-bold text-razel-neon px-2 py-0.5 rounded bg-razel-neon/10 border border-razel-neon/20">
                        {gifFps} frames/sec
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      step="1"
                      value={gifFps}
                      onChange={(e) => setGifFps(Number(e.target.value))}
                      className="w-full accent-razel-neon cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-white/40">
                      <span>Slow (2 fps)</span>
                      <span>Fast (15 fps)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* BTS Video Box */}
              {videoBlobUrl && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-sky-400" /> Behind-The-Scenes Video Export
                    </h4>
                    <p className="text-xs text-white/40 leading-normal mt-0.5">
                      Live timelapse capturing all your organic smiles and pose prep moments.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerDownload(videoBlobUrl, `digismile-bts-${Date.now()}.mp4`)}
                      className="px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-lg shadow-sky-500/20"
                      title="Download MP4 Video"
                    >
                      <Download className="w-3.5 h-3.5" /> MP4
                    </button>

                    <button
                      onClick={async () => {
                        if (!videoBlobUrl) return;
                        try {
                          const res = await fetch(videoBlobUrl);
                          const blob = await res.blob();
                          await handleShare(blob, `digismile-bts-${Date.now()}.mp4`, 'video/mp4');
                        } catch (e) {
                          console.warn('Error sharing BTS video:', e);
                        }
                      }}
                      className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                      title="Share Behind-The-Scenes video to stories/apps"
                    >
                      <Share2 className="w-4 h-4 text-sky-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-[1px] bg-white/10 my-6" />

        {/* Home / Reset Button */}
        <button
          onClick={onReset}
          className="w-full py-4 rounded-xl border border-razel-neon/40 hover:border-razel-neon bg-razel-neon/10 hover:bg-razel-neon/20 text-white font-display font-bold text-md tracking-wider transition-all flex items-center justify-center gap-2"
          id="btn-export-new-session"
        >
          <RotateCcw className="w-4 h-4 animate-spin-slow" /> NEW SESSION
        </button>
      </div>
      </div>
      )}
    </div>
  );
}
