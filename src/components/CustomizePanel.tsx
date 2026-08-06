/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Smile, 
  Type, 
  Sliders, 
  RotateCw, 
  Trash2, 
  ChevronRight, 
  ArrowLeft,
  X,
  Maximize,
  Minimize,
  Flame,
  Upload,
  Image,
  Layers
} from 'lucide-react';
import { 
  FilterType, 
  FilterSettings, 
  Sticker, 
  TemplateType, 
  FontOption, 
  BorderOption 
} from '../types';
import RetakeModal from './RetakeModal';

interface CustomizePanelProps {
  photos: string[];
  onUpdatePhotos: (photos: string[]) => void;
  template: TemplateType;
  filter: FilterType;
  onChangeFilter: (f: FilterType) => void;
  filterSettings: FilterSettings;
  onChangeFilterSettings: (s: FilterSettings) => void;
  stickers: Sticker[];
  onUpdateStickers: (s: Sticker[]) => void;
  caption: string;
  onChangeCaption: (txt: string) => void;
  captionFont: string;
  onChangeCaptionFont: (f: string) => void;
  captionColor: string;
  onChangeCaptionColor: (color: string) => void;
  borderId: string;
  onChangeBorderId: (id: string) => void;
  frameThemeId: string;
  onChangeFrameThemeId: (theme: string) => void;
  customBgImage: string | null;
  onChangeCustomBgImage: (img: string | null) => void;
  customBgOpacity: number;
  onChangeCustomBgOpacity: (op: number) => void;
  customBgScale: number;
  onChangeCustomBgScale: (sc: number) => void;
  customBgTiling: 'cover' | 'contain' | 'repeat';
  onChangeCustomBgTiling: (style: 'cover' | 'contain' | 'repeat') => void;
  pictureFrameStroke: string;
  onChangePictureFrameStroke: (stroke: string) => void;
  onProceed: () => void;
  onBack: () => void;
  onReset: () => void;
}

export default function CustomizePanel({
  photos,
  onUpdatePhotos,
  template,
  filter,
  onChangeFilter,
  filterSettings,
  onChangeFilterSettings,
  stickers,
  onUpdateStickers,
  caption,
  onChangeCaption,
  captionFont,
  onChangeCaptionFont,
  captionColor,
  onChangeCaptionColor,
  borderId,
  onChangeBorderId,
  frameThemeId,
  onChangeFrameThemeId,
  customBgImage,
  onChangeCustomBgImage,
  customBgOpacity,
  onChangeCustomBgOpacity,
  customBgScale,
  onChangeCustomBgScale,
  customBgTiling,
  onChangeCustomBgTiling,
  pictureFrameStroke,
  onChangePictureFrameStroke,
  onProceed,
  onBack,
  onReset
}: CustomizePanelProps) {
  // Tabs: 'filter' | 'frame' | 'stickers'
  const [activeTab, setActiveTab] = useState<'filter' | 'frame' | 'stickers'>('filter');
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  // Stored custom stamps state for uploading PNG stamps
  const [customStamps, setCustomStamps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('digismile_custom_stamps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const getStrokeClasses = () => {
    switch (pictureFrameStroke) {
      case 'white-stroke':
        return 'border-2 border-white shadow-md';
      case 'bento-plaster':
        return 'border-[3px] border-black';
      case 'polaroid-classic':
        return 'border-[6px] border-white shadow-lg';
      case 'vintage-burn':
        return 'border-2 border-[#5c4033] shadow-md';
      case 'none':
      default:
        return 'border border-black/10 shadow-sm';
    }
  };

  const getStrokeStyle = (borderRadius: string = '0px') => {
    const baseStyle: React.CSSProperties = { borderRadius };
    switch (pictureFrameStroke) {
      case 'bento-plaster':
        return { ...baseStyle, boxShadow: '4px 4px 0px #000000' };
      case 'vintage-burn':
        return { ...baseStyle, boxShadow: 'inset 0 0 10px rgba(139,92,26,0.35)' };
      default:
        return baseStyle;
    }
  };
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    stickerX: number;
    stickerY: number;
    containerWidth: number;
    containerHeight: number;
  } | null>(null);

  const fontOptions: FontOption[] = [
    { id: 'sans', name: 'Modern Sans', className: 'font-sans' },
    { id: 'display', name: 'Space Grotesk', className: 'font-display font-bold' },
    { id: 'serif', name: 'Editorial Serif', className: 'font-serif italic' },
    { id: 'mono', name: 'Typewriter Mono', className: 'font-mono' },
    { id: 'handwriting', name: 'Nostalgic Script', className: 'font-handwriting font-bold text-lg' },
    { id: 'signature', name: 'Original Signature', className: 'font-signature font-semibold text-xl' },
    { id: 'retroblack', name: 'Vintage Heavy', className: 'font-retroblack uppercase tracking-wider' },
  ];

  const borderOptions: BorderOption[] = [
    { id: 'white', name: 'Snow White', color: '#FFFFFF', bgClass: 'bg-white', textClass: 'text-zinc-900 border-zinc-200' },
    { id: 'pink', name: 'Sakura Pink', color: '#FFF5F7', bgClass: 'bg-[#FFF5F7] border-pink-200 shadow-[inset_0_0_12px_rgba(244,143,177,0.15)]', textClass: 'text-pink-600 border-pink-100' },
    { id: 'black', name: 'Stealth Black', color: '#12141C', bgClass: 'bg-zinc-950 border-white/5', textClass: 'text-white' },
    { id: 'cream', name: 'Warm Cream', color: '#FAF6E9', bgClass: 'bg-[#FAF6E9]', textClass: 'text-amber-950 border-amber-900/10' },
    { id: 'aged-polaroid', name: 'Vintage Polaroid', color: '#FBF9F3', bgClass: 'bg-[#FBF9F3] shadow-inner border-amber-900/5', textClass: 'text-zinc-800' },
    { id: 'sprocket', name: 'Film Sprocket Strip', color: '#151518', bgClass: 'bg-[#151518] relative before:absolute before:left-1 before:top-0 before:bottom-0 before:w-2 before:bg-[radial-gradient(circle,#000_30%,transparent_30%)] before:bg-[size:8px_16px] after:absolute after:right-1 after:top-0 after:bottom-0 after:w-2 after:bg-[radial-gradient(circle,#000_30%,transparent_30%)] after:bg-[size:8px_16px]', textClass: 'text-white border-zinc-800' },
    { id: 'wood', name: 'Teakwood Arcade', color: '#5C4033', bgClass: 'bg-[#5C4033] bg-[radial-gradient(#4a3329_1px,transparent_1px)] [background-size:12px_12px]', textClass: 'text-amber-100' },
    { id: 'retro', name: 'Newsprint', color: '#E8DCC4', bgClass: 'bg-[#E8DCC4] bg-[radial-gradient(#cac2af_1px,transparent_1px)] [background-size:16px_16px]', textClass: 'text-zinc-900 border-zinc-800' },
    { id: 'neon', name: 'Acid Neon Grid', color: '#090B11', bgClass: 'bg-razel-dark border-razel-neon/40 shadow-[inset_0_0_20px_rgba(255,46,84,0.15)]', textClass: 'text-razel-neon' },
    { id: 'paper-torn', name: 'Fibrous Torn Paper', color: '#F6F4EB', bgClass: 'bg-[#F6F4EB] border-zinc-300 shadow-[2px_2px_10px_rgba(0,0,0,0.15),inset_0_0_15px_rgba(100,80,60,0.08)] before:absolute before:inset-0 before:border-[3px] before:border-dashed before:border-white/40', textClass: 'text-zinc-800 font-serif' },
    { id: 'distressed-retro', name: 'Grunge Distressed Film', color: '#141211', bgClass: 'bg-[#141211] border-zinc-800 shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] after:absolute after:inset-1 after:border after:border-white/5 after:pointer-events-none', textClass: 'text-zinc-300 font-mono' },
    { id: 'gilded-museum', name: 'Gilded Gold Gallery', color: '#241710', bgClass: 'bg-[#241710] border-amber-600/35 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_0_20px_rgba(229,192,123,0.12)] after:absolute after:inset-2 after:border-2 after:border-amber-500/20 after:pointer-events-none', textClass: 'text-amber-100' },
  ];

  const currentBorder = borderOptions.find((b) => b.id === borderId) || borderOptions[0];

  const stickerBank = [
    // Emotes / Cute
    { id: 'star-classic', emoji: '⭐' },
    { id: 'star', emoji: '🌟' },
    { id: 'heart', emoji: '❤️' },
    { id: 'heart-fire', emoji: '❤️‍🔥' },
    { id: 'broken-heart', emoji: '💔' },
    { id: 'cherry', emoji: '🍒' },
    { id: 'camera', emoji: '📸' },
    { id: 'clover', emoji: '🍀' },
    { id: 'cloud', emoji: '☁️' },
    { id: 'kitty', emoji: '🐱' },
    { id: 'bear', emoji: '🧸' },
    { id: 'crown', emoji: '👑' },
    { id: 'sunglasses', emoji: '🕶️' },
    { id: 'alien', emoji: '👽' },
    { id: 'ribbon', emoji: '🎀' },
    { id: 'flower', emoji: '🌸' },
    { id: 'lightning', emoji: '⚡' },
    { id: 'fire', emoji: '🔥' },
    { id: 'ghost', emoji: '👻' },
    { id: 'party', emoji: '🎉' },
    // Halloween
    { id: 'pumpkin', emoji: '🎃' },
    { id: 'bat', emoji: '🦇' },
    { id: 'spider', emoji: '🕷️' },
    { id: 'web', emoji: '🕸️' },
    { id: 'candy', emoji: '🍬' },
    // Thanksgiving
    { id: 'turkey', emoji: '🦃' },
    { id: 'leaf-fall', emoji: '🍂' },
    { id: 'leaf-maple', emoji: '🍁' },
    { id: 'pie', emoji: '🥧' },
    { id: 'corn', emoji: '🌽' },
    // Goth
    { id: 'black-heart', emoji: '🖤' },
    { id: 'skull', emoji: '💀' },
    { id: 'coffin', emoji: '⚰️' },
    { id: 'candle', emoji: '🕯️' },
    { id: 'crystal-ball', emoji: '🔮' },
    { id: 'wilted-rose', emoji: '🥀' },
    // Christmas
    { id: 'xmas-tree', emoji: '🎄' },
    { id: 'snowflake', emoji: '❄️' },
    { id: 'santa', emoji: '🎅' },
    { id: 'xmas-gift', emoji: '🎁' },
    { id: 'xmas-bell', emoji: '🔔' },
    { id: 'snowman', emoji: '⛄' },
    { id: 'deer', emoji: '🦌' },
    // Girly & Coquette (no sparkles)
    { id: 'lipstick', emoji: '💄' },
    { id: 'purse', emoji: '👛' },
    { id: 'ballet', emoji: '🩰' },
    { id: 'nail-polish', emoji: '💅' },
    { id: 'lollipop', emoji: '🍭' },
  ];

  // Apply real-time canvas-style CSS filters
  const getFilterStyle = () => {
    let base = '';
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

    // Append custom slider values
    const bScale = filterSettings.brightness / 100;
    const cScale = filterSettings.contrast / 100;
    const sScale = filterSettings.saturation / 100;

    return {
      filter: `${base} brightness(${bScale}) contrast(${cScale}) saturate(${sScale})`,
    };
  };

  // Sticker Placement logic
  const handleAddSticker = (emoji: string, src?: string) => {
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      emoji: src ? undefined : emoji,
      src: src || undefined,
      x: 50,
      y: 50,
      scale: src ? 1.4 : 1.0,
      rotation: 0,
    };
    onUpdateStickers([...stickers, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  // Dragging Implementation
  const handlePointerDown = (e: React.PointerEvent, stickerId: string) => {
    e.stopPropagation();
    setSelectedStickerId(stickerId);
    setIsDragging(true);

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const targetSticker = stickers.find((s) => s.id === stickerId);
    if (!targetSticker) return;

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      stickerX: targetSticker.x,
      stickerY: targetSticker.y,
      containerWidth: rect.width,
      containerHeight: rect.height,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !selectedStickerId || !dragStartRef.current) return;
    const start = dragStartRef.current;

    const deltaX = e.clientX - start.clientX;
    const deltaY = e.clientY - start.clientY;

    const pctDeltaX = (deltaX / start.containerWidth) * 100;
    const pctDeltaY = (deltaY / start.containerHeight) * 100;

    const newX = Math.min(Math.max(start.stickerX + pctDeltaX, 0), 100);
    const newY = Math.min(Math.max(start.stickerY + pctDeltaY, 0), 100);

    onUpdateStickers(
      stickers.map((s) => (s.id === selectedStickerId ? { ...s, x: newX, y: newY } : s))
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (e.target) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // Safe fallback if target unmounted
      }
    }
  };

  // Modify Selected Sticker Values
  const handleRotateSelected = () => {
    if (!selectedStickerId) return;
    onUpdateStickers(
      stickers.map((s) =>
        s.id === selectedStickerId ? { ...s, rotation: (s.rotation + 45) % 360 } : s
      )
    );
  };

  const handleScaleSelected = (factor: number) => {
    if (!selectedStickerId) return;
    onUpdateStickers(
      stickers.map((s) => {
        if (s.id === selectedStickerId) {
          const newScale = Math.min(Math.max(s.scale + factor, 0.4), 3.0);
          return { ...s, scale: Number(newScale.toFixed(2)) };
        }
        return s;
      })
    );
  };

  const handleDeleteSelected = () => {
    if (!selectedStickerId) return;
    onUpdateStickers(stickers.filter((s) => s.id !== selectedStickerId));
    setSelectedStickerId(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto min-h-[100dvh] pt-14 lg:pt-0">
      
      {/* Mobile Top App-Like Controls */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-razel-dark/95 backdrop-blur-md border-b border-white/5 z-[60] flex items-center px-4 justify-between">
        <button
          onClick={onReset}
          className="p-2 -ml-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="New Session"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-sm tracking-widest text-white/90">
          CUSTOMIZE
        </span>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Desktop Reset Button */}
      <div className="hidden lg:block absolute top-6 left-6 z-50">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-xs font-bold border border-white/5"
        >
          <ArrowLeft className="w-4 h-4" /> New Session
        </button>
      </div>

      {/* LEFT COLUMN: Real-Time Strip Visual Preview with Drag Overlay (Sticky on desktop to prevent scrolling) */}
      <div className="w-full lg:w-5/12 flex flex-col items-center select-none shrink-0 lg:sticky lg:top-6 lg:self-start">
        <h3 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-3">
          Interactive Live Canvas
        </h3>

        {/* Outer Border Container */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => setSelectedStickerId(null)}
          className={`relative border w-full shadow-2xl transition-all overflow-hidden rounded-2xl ${currentBorder.bgClass} ${currentBorder.textClass} flex flex-col justify-between`}
          style={{
            aspectRatio: (() => {
              switch (template) {
                case 'strip':
                case 'vintage-silver':
                case 'ticket':
                  return '1/3';
                case 'double-strip':
                  return '2/3';
                case 'polaroid':
                case 'golden-polaroid':
                  return '4/5';
                case 'polaroid-wide':
                  return '5/4';
                case 'grid':
                case 'purikura':
                case 'grunge-collage':
                case 'passport':
                  return '1/1';
                case 'duo':
                case 'gallery':
                  return '5/4';
                case 'cinematic':
                case 'directors-cut':
                  return '8/15';
                case 'sprocket-roll':
                  return '12/5';
                case 'neo-noir':
                  return '7/10';
                case 'comic':
                  return '2/1';
                case 'magazine':
                  return '8/11';
                case 'cyber-glitch':
                  return '3/2';
                case 'wedding':
                  return '8/13';
                default:
                  return '4/5';
              }
            })(),
            maxWidth: (() => {
              switch (template) {
                case 'strip':
                case 'vintage-silver':
                case 'ticket':
                  return '185px';
                case 'cinematic':
                case 'directors-cut':
                  return '220px';
                case 'wedding':
                  return '240px';
                case 'double-strip':
                  return '280px';
                case 'sprocket-roll':
                case 'comic':
                  return '350px';
                default:
                  return '300px';
              }
            })(),
          }}
          id="photobooth-rendered-strip"
        >
          {/* Custom Background Layer (with scaling, opacity, tiling) */}
          <div 
            className="absolute inset-0 pointer-events-none z-0 transition-all duration-300"
            style={{
              opacity: customBgImage ? (customBgOpacity / 100) : 1.0,
              backgroundImage: (() => {
                if (customBgImage) {
                  return `url(${customBgImage})`;
                }
                // Pre-designed pattern overlays based on frameThemeId
                switch (frameThemeId) {
                  case 'birthday':
                    return `radial-gradient(circle, rgba(244,180,26,0.2) 10%, transparent 11%), 
                            radial-gradient(circle, rgba(239,68,68,0.15) 10%, transparent 11%), 
                            radial-gradient(circle, rgba(59,130,246,0.15) 10%, transparent 11%),
                            radial-gradient(circle, rgba(16,185,129,0.15) 10%, transparent 11%)`;
                  case 'holiday':
                    return `linear-gradient(135deg, rgba(251,146,60,0.22) 0%, rgba(244,63,94,0.22) 50%, rgba(139,92,246,0.18) 100%)`;
                  case 'nature':
                    return `linear-gradient(to bottom, rgba(240,253,244,0.45), rgba(220,252,231,0.25)),
                            radial-gradient(circle, rgba(16,185,129,0.08) 20%, transparent 20%),
                            radial-gradient(circle, rgba(236,72,153,0.1) 15%, transparent 20%)`;
                  case 'love':
                    return `radial-gradient(circle at 30% 20%, rgba(236,72,153,0.15) 0%, transparent 40%),
                            radial-gradient(circle at 75% 65%, rgba(239,68,68,0.18) 0%, transparent 50%),
                            linear-gradient(to bottom, rgba(253,242,248,0.35), rgba(252,231,243,0.15))`;
                  default:
                    return 'none';
                }
              })(),
              backgroundSize: (() => {
                if (customBgImage) {
                  if (customBgTiling === 'repeat') {
                    return `${customBgScale}%`;
                  }
                  return customBgTiling; // 'cover' or 'contain'
                }
                // Pattern sizes
                switch (frameThemeId) {
                  case 'birthday':
                    return '40px 40px';
                  case 'nature':
                    return '100% 100%, 30px 30px, 50px 50px';
                  default:
                    return 'auto';
                }
              })(),
              backgroundPosition: 'center',
              backgroundRepeat: customBgTiling === 'repeat' ? 'repeat' : 'no-repeat',
              backgroundColor: currentBorder.color,
            }}
          />

          {/* Frame Theme Decorative Floating Overlays */}
          {frameThemeId === 'birthday' && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <span className="absolute top-2 left-2 text-sm select-none animate-bounce">🎈</span>
              <span className="absolute top-12 right-2 text-sm select-none animate-pulse">🎉</span>
              <span className="absolute bottom-16 left-3 text-sm select-none">🍰</span>
              <span className="absolute bottom-24 right-3 text-sm select-none animate-bounce">🎁</span>
            </div>
          )}
          {frameThemeId === 'holiday' && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <span className="absolute top-2 left-2 text-sm select-none animate-pulse">🌅</span>
              <span className="absolute top-12 right-2 text-sm select-none">🌴</span>
              <span className="absolute bottom-16 left-3 text-sm select-none animate-bounce">🌊</span>
              <span className="absolute bottom-24 right-3 text-sm select-none">🍹</span>
            </div>
          )}
          {frameThemeId === 'nature' && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <span className="absolute top-2 left-2 text-sm select-none animate-pulse">🌸</span>
              <span className="absolute top-12 right-2 text-sm select-none">🍃</span>
              <span className="absolute bottom-16 left-3 text-sm select-none">🌸</span>
              <span className="absolute bottom-24 right-3 text-sm select-none animate-pulse">🦋</span>
            </div>
          )}
          {frameThemeId === 'love' && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <span className="absolute top-2 left-2 text-sm select-none animate-pulse">❤️</span>
              <span className="absolute top-12 right-2 text-sm select-none">💖</span>
              <span className="absolute bottom-16 left-3 text-sm select-none animate-bounce">💝</span>
              <span className="absolute bottom-24 right-3 text-sm select-none">💌</span>
            </div>
          )}
          {frameThemeId === 'halloween' && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <span className="absolute top-2 left-2 text-sm select-none animate-bounce">🎃</span>
              <span className="absolute top-12 right-2 text-sm select-none animate-pulse">👻</span>
              <span className="absolute bottom-16 left-3 text-sm select-none">🦇</span>
              <span className="absolute bottom-24 right-3 text-sm select-none animate-bounce">🕷️</span>
            </div>
          )}
          {frameThemeId === 'thanksgiving' && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <span className="absolute top-2 left-2 text-sm select-none animate-pulse">🦃</span>
              <span className="absolute top-12 right-2 text-sm select-none">🍂</span>
              <span className="absolute bottom-16 left-3 text-sm select-none animate-bounce">🥧</span>
              <span className="absolute bottom-24 right-3 text-sm select-none">🍁</span>
            </div>
          )}
          {frameThemeId === 'goth' && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <span className="absolute top-2 left-2 text-sm select-none">🖤</span>
              <span className="absolute top-12 right-2 text-sm select-none animate-bounce">🦇</span>
              <span className="absolute bottom-16 left-3 text-sm select-none animate-pulse">🕸️</span>
              <span className="absolute bottom-24 right-3 text-sm select-none">💀</span>
            </div>
          )}
          {frameThemeId === 'christmas' && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <span className="absolute top-2 left-2 text-sm select-none animate-bounce">🎄</span>
              <span className="absolute top-12 right-2 text-sm select-none animate-pulse">❄️</span>
              <span className="absolute bottom-16 left-3 text-sm select-none">🎅</span>
              <span className="absolute bottom-24 right-3 text-sm select-none animate-bounce">🎁</span>
            </div>
          )}
          {frameThemeId === 'girly' && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <span className="absolute top-2 left-2 text-sm select-none animate-bounce">🎀</span>
              <span className="absolute top-12 right-2 text-sm select-none">🍒</span>
              <span className="absolute bottom-16 left-3 text-sm select-none animate-pulse">🌸</span>
              <span className="absolute bottom-24 right-3 text-sm select-none">🦄</span>
            </div>
          )}

          {/* Subtle Film Grain Noise overlay - placed at very top (z-45) */}
          {filterSettings.grain > 0 && (
            <div 
              className="film-grain !z-[45]" 
              style={{ opacity: (filterSettings.grain / 100) * 0.35 }} 
            />
          )}

          {/* Content Layouts */}
          <div className="p-4 flex flex-col gap-3 h-full justify-start overflow-hidden">
            {/* Helper safe image getter */}
            {(() => {
              const getImgSrc = (idx: number): string => {
                return photos[idx] || photos[0] || '';
              };

              const renderPhoto = (src: string, label: string, index: number) => {
                if (!src) return null;

                let leakOverlay = null;
                if (filterSettings.lightLeak === 'sunflare') {
                  leakOverlay = (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 mix-blend-screen animate-fade-in"
                      style={{
                        background: 'radial-gradient(circle at 90% 10%, rgba(255, 215, 0, 0.4) 0%, rgba(255, 120, 0, 0.2) 40%, rgba(255, 60, 0, 0.05) 75%, transparent 100%)'
                      }}
                    />
                  );
                } else if (filterSettings.lightLeak === 'neonspill') {
                  leakOverlay = (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 mix-blend-color-dodge animate-fade-in"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 46, 84, 0.3) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 95%)'
                      }}
                    />
                  );
                } else if (filterSettings.lightLeak === 'warmfog') {
                  leakOverlay = (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 mix-blend-screen animate-fade-in"
                      style={{
                        background: 'radial-gradient(circle at -10% 50%, rgba(239, 68, 68, 0.3) 0%, rgba(249, 115, 22, 0.15) 55%, transparent 95%)'
                      }}
                    />
                  );
                } else if (filterSettings.lightLeak === 'prismflare') {
                  leakOverlay = (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 mix-blend-screen animate-fade-in"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.25) 0%, rgba(255, 154, 0, 0.2) 15%, rgba(208, 222, 33, 0.2) 30%, rgba(79, 220, 74, 0.2) 45%, rgba(63, 218, 216, 0.2) 60%, rgba(47, 201, 226, 0.2) 75%, rgba(150, 47, 226, 0.25) 90%, transparent 100%)'
                      }}
                    />
                  );
                } else if (filterSettings.lightLeak === 'lensflare') {
                  leakOverlay = (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 mix-blend-screen animate-fade-in"
                      style={{
                        background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 235, 180, 0.4) 8%, rgba(255, 180, 100, 0.1) 15%, transparent 25%), radial-gradient(circle at 35% 35%, rgba(0, 180, 255, 0.3) 0%, rgba(0, 180, 255, 0.1) 5%, transparent 10%), radial-gradient(circle at 65% 65%, rgba(255, 0, 128, 0.25) 0%, rgba(255, 0, 128, 0.05) 8%, transparent 15%)'
                      }}
                    />
                  );
                } else if (filterSettings.lightLeak === 'disco-glimmer') {
                  leakOverlay = (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 mix-blend-color-dodge animate-fade-in"
                      style={{
                        background: 'radial-gradient(circle at 15% 25%, rgba(255, 255, 255, 0.6) 0%, transparent 12%), radial-gradient(circle at 85% 35%, rgba(255, 255, 255, 0.5) 0%, transparent 15%), radial-gradient(circle at 35% 70%, rgba(255, 255, 255, 0.5) 0%, transparent 10%), radial-gradient(circle at 75% 80%, rgba(255, 255, 255, 0.6) 0%, transparent 12%), linear-gradient(to right, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.02))'
                      }}
                    />
                  );
                }

                return (
                  <div className="group relative w-full h-full overflow-hidden">
                    {/* Core Image with CSS Filters */}
                    <img
                      src={src}
                      alt={label}
                      className="w-full h-full object-cover transition-all duration-300"
                      style={getFilterStyle()}
                    />

                    {/* Real-time Vignette Overlays per photo */}
                    {filterSettings.vignette > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none z-10 transition-all duration-300"
                        style={{
                          background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${(filterSettings.vignette / 100) * 0.7}) 100%)`
                        }}
                      />
                    )}

                    {/* Real-time Organic Film Grain Overlay per photo */}
                    {filterSettings.grain > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none z-10 transition-all duration-300"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                          opacity: (filterSettings.grain / 100) * 0.22,
                          mixBlendMode: 'overlay',
                        }}
                      />
                    )}

                    {/* Real-time Light Leaks & Lens Flares Overlay per photo */}
                    {leakOverlay}

                    {/* Desktop Hover Retake Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 lg:group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 hidden lg:flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRetakeIndex(index);
                        }}
                        className="pointer-events-auto px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-[10px] font-bold tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-1.5"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-white" />
                        RETAKE
                      </button>
                    </div>

                    {/* Always-visible Mobile Retake Icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setRetakeIndex(index);
                      }}
                      className="absolute bottom-1.5 right-1.5 z-30 p-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white/90 hover:text-white hover:bg-emerald-500 transition-all lg:hidden shadow-sm"
                      title="Retake this pose"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              };

              return (
                <>
                  {(template === 'strip' || template === 'vintage-silver') && (
                    <div className="flex flex-col gap-3 h-[85%]">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden ${getStrokeClasses()}`}
                          style={getStrokeStyle('4px')}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}

                  {template === 'double-strip' && (
                    <div className="flex gap-2.5 h-[85%] justify-between overflow-hidden">
                      {/* Left duplicate strip */}
                      <div className="w-[48%] h-full flex flex-col gap-1.5 border-r border-dashed border-black/20 pr-1.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className={`relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden ${getStrokeClasses()}`}
                            style={getStrokeStyle('2px')}
                          >
                            {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                          </div>
                        ))}
                      </div>
                      {/* Right duplicate strip */}
                      <div className="w-[48%] h-full flex flex-col gap-1.5 pl-0.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className={`relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden ${getStrokeClasses()}`}
                            style={getStrokeStyle('2px')}
                          >
                            {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(template === 'grid' || template === 'purikura') && (
                    <div className="grid grid-cols-2 grid-rows-2 gap-3 aspect-square w-full mb-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`relative w-full aspect-square bg-zinc-900 overflow-hidden ${getStrokeClasses()}`}
                          style={getStrokeStyle('6px')}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}

                  {(template === 'polaroid' || template === 'golden-polaroid') && (
                    <div className={`w-full aspect-square bg-zinc-900 overflow-hidden mb-2 ${getStrokeClasses()}`} style={getStrokeStyle('2px')}>
                      {getImgSrc(0) && renderPhoto(getImgSrc(0), "Pose 1", 0)}
                    </div>
                  )}

                  {template === 'polaroid-wide' && (
                    <div className={`w-full aspect-[4/3] bg-zinc-900 overflow-hidden mb-2 ${getStrokeClasses()}`} style={getStrokeStyle('2px')}>
                      {getImgSrc(0) && renderPhoto(getImgSrc(0), "Pose 1", 0)}
                    </div>
                  )}

                  {template === 'duo' && (
                    <div className="flex gap-3 aspect-[3/2] w-full mb-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div
                          key={i}
                          className={`relative w-1/2 h-full bg-zinc-900 overflow-hidden ${getStrokeClasses()}`}
                          style={getStrokeStyle('6px')}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}

                  {(template === 'cinematic' || template === 'directors-cut') && (
                    <div className="flex flex-col gap-3 h-[82%]">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className={`relative w-full aspect-[16/7] bg-zinc-900 overflow-hidden ${getStrokeClasses()}`}
                          style={getStrokeStyle('4px')}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}

                  {template === 'sprocket-roll' && (
                    <div className="flex gap-2 w-full h-[80%] items-center overflow-hidden">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className={`relative w-1/3 aspect-[9/16] bg-zinc-900 overflow-hidden ${getStrokeClasses()}`}
                          style={getStrokeStyle('4px')}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}

                  {(template === 'neo-noir' || template === 'magazine') && (
                    <div className={`w-full aspect-[3/4] bg-zinc-900 overflow-hidden mb-2 ${getStrokeClasses()}`} style={getStrokeStyle('4px')}>
                      {getImgSrc(0) && renderPhoto(getImgSrc(0), "Pose 1", 0)}
                    </div>
                  )}

                  {template === 'comic' && (
                    <div className="flex gap-2 w-full aspect-[2/1] mb-2 overflow-hidden">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className={`relative w-1/3 h-full bg-zinc-900 overflow-hidden ${getStrokeClasses()}`}
                          style={getStrokeStyle('4px')}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}

                  {template === 'ticket' && (
                    <div className="flex flex-col gap-2 h-[82%] overflow-hidden">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden ${getStrokeClasses()}`}
                          style={getStrokeStyle('4px')}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}

                  {template === 'cyber-glitch' && (
                    <div className="flex gap-2.5 w-full aspect-[3/2] mb-2 overflow-hidden">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div
                          key={i}
                          className={`relative w-1/2 h-full bg-zinc-900 overflow-hidden ${getStrokeClasses()}`}
                          style={getStrokeStyle('4px')}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}

                  {template === 'grunge-collage' && (
                    <div className="relative w-full aspect-square mb-2 overflow-hidden">
                      {[
                        { rotate: '-6deg', top: '10%', left: '10%', zIndex: 'z-10' },
                        { rotate: '4deg', top: '12%', left: '48%', zIndex: 'z-20' },
                        { rotate: '3deg', top: '48%', left: '12%', zIndex: 'z-30' },
                        { rotate: '-5deg', top: '50%', left: '46%', zIndex: 'z-40' },
                      ].map((pos, i) => (
                        <div
                          key={i}
                          className={`absolute w-[44%] aspect-square bg-white border border-black/10 shadow-md p-1 ${pos.zIndex}`}
                          style={{
                            transform: `rotate(${pos.rotate})`,
                            top: pos.top,
                            left: pos.left,
                            borderRadius: '2px',
                          }}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}

                  {template === 'gallery' && (
                    <div className="flex gap-3 aspect-[4/3] w-full mb-2 overflow-hidden">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div
                          key={i}
                          className="relative w-1/2 h-full bg-zinc-900 border border-black/10 overflow-hidden"
                          style={{ 
                            borderTopLeftRadius: '100% 50%', 
                            borderTopRightRadius: '100% 50%',
                            borderBottomLeftRadius: '4px',
                            borderBottomRightRadius: '4px'
                          }}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}

                  {template === 'passport' && (
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 aspect-square w-full mb-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="relative w-full aspect-square bg-zinc-900 border border-black/10 overflow-hidden"
                          style={{ borderRadius: '2px' }}
                        >
                          {getImgSrc(0) && renderPhoto(getImgSrc(0), "Pose 1", 0)}
                        </div>
                      ))}
                    </div>
                  )}

                  {template === 'wedding' && (
                    <div className="flex gap-2 w-full h-[80%] items-center overflow-hidden">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="relative w-1/3 aspect-[2/3] bg-zinc-900 border border-[#D4AF37]/50 overflow-hidden ring-1 ring-[#D4AF37]/20"
                          style={{ borderRadius: '2px' }}
                        >
                          {getImgSrc(i) && renderPhoto(getImgSrc(i), `Pose ${i + 1}`, i)}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Bottom Banner Area (Customizable Caption + Date stamp) */}
          {['strip', 'vintage-silver', 'double-strip', 'polaroid', 'golden-polaroid', 'polaroid-wide', 'ticket', 'duo', 'cinematic', 'directors-cut', 'neo-noir', 'magazine', 'wedding', 'gallery'].includes(template) && (
            <div className="px-4 pb-5 flex flex-col items-center justify-center text-center select-none gap-0.5 min-h-[50px] z-10">
              <span
                className={`${
                  fontOptions.find((f) => f.id === captionFont)?.className || 'font-sans'
                } break-all px-2 leading-tight select-none`}
                style={{ color: captionColor }}
              >
                {caption || 'DIGISMILE SESSION'}
              </span>
              <span className="text-[9px] uppercase tracking-widest opacity-40 font-mono select-none font-bold">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Absolute Stamp Sticker Layer */}
          {stickers.map((sticker) => {
            const isSelected = selectedStickerId === sticker.id;

            return (
              <div
                key={sticker.id}
                onPointerDown={(e) => handlePointerDown(e, sticker.id)}
                onClick={(e) => e.stopPropagation()}
                className={`absolute z-30 select-none cursor-move touch-none flex items-center justify-center p-2 rounded-lg ${
                  isSelected ? 'ring-2 ring-razel-neon bg-black/20 backdrop-blur-[1px]' : ''
                }`}
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              >
                {sticker.src ? (
                  <img
                    src={sticker.src}
                    alt="Custom branding watermark logo"
                    className="max-w-[110px] max-h-[110px] object-contain pointer-events-none select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  />
                ) : (
                  <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] select-none">
                    {sticker.emoji}
                  </span>
                )}

                {isSelected && (
                  <div 
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-950 text-white border border-white/10 px-1.5 py-0.5 rounded-md flex gap-1 items-center scale-90"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScaleSelected(0.15);
                      }}
                      className="hover:text-razel-neon"
                      title="Scale Up"
                    >
                      <Maximize className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScaleSelected(-0.15);
                      }}
                      className="hover:text-razel-neon"
                      title="Scale Down"
                    >
                      <Minimize className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotateSelected();
                      }}
                      className="hover:text-razel-neon"
                      title="Rotate 45°"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSelected();
                      }}
                      className="text-red-400 hover:text-red-500"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-white/40 font-mono mt-3 text-center max-w-[280px]">
          💡 Click a placed emoji sticker to rotate, scale, or delete it directly from the canvas!
        </p>
      </div>

      {/* RIGHT COLUMN: Professional Customization Control Panel */}
      <div id="customize-tabs" className="w-full lg:flex-1 bg-razel-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col scroll-mt-20">
        
        {/* Editor Tabs Navigation */}
        <div className="flex overflow-x-auto whitespace-nowrap hide-scrollbar border-b border-white/10 bg-black/30 sticky top-0 z-20">
          {[
            { id: 'filter', title: 'Filters & Adjust', icon: <Sliders className="w-5 h-5" /> },
            { id: 'frame', title: 'Frame & Text', icon: <Type className="w-5 h-5" /> },
            { id: 'stickers', title: 'Stickers Stamp', icon: <Smile className="w-5 h-5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 flex items-center justify-center transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-razel-neon text-razel-neon bg-white/5'
                  : 'border-transparent text-white/45 hover:text-white/80 hover:bg-white/[0.01]'
              }`}
              title={tab.title}
            >
              {tab.icon}
            </button>
          ))}
        </div>

        {/* Customization Details Wrapper */}
        <div className="p-6 flex-1 min-h-[380px] overflow-y-auto max-h-[500px]">
          
          {/* TAB 1: FILTERS & COLOR ADJUST */}
          {activeTab === 'filter' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-3">
                  Realistic Filter Presets
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', name: 'Original', desc: 'No Filter' },
                    { id: 'mono', name: 'Retro Noir', desc: 'Slightly high contrast' },
                    { id: 'vintage', name: '70s Sepia', desc: 'Warm aged film' },
                    { id: 'cyberpunk', name: 'Neon Glitch', desc: 'Vibrant neon tints' },
                    { id: 'golden', name: 'Golden Hour', desc: 'Warm sunset feel' },
                    { id: 'ice', name: 'Nordic Ice', desc: 'Cool blue shadows' },
                    { id: 'vhs', name: 'VHS Tape', desc: 'Organic VHS static' },
                    { id: 'creamy', name: 'Tokyo Soft', desc: 'Low-contrast pastel' },
                    { id: 'polaroid', name: 'Polaroid', desc: 'Classic faded matte' },
                    { id: 'fuji-superia', name: 'Fuji Superia', desc: 'Teal-green film' },
                    { id: 'kodachrome-74', name: 'Kodachrome 74', desc: 'Deep warm saturation' },
                    { id: 'tri-x-grain', name: 'Tri-X 400 Mono', desc: 'Grainy retro B&W' },
                    { id: 'teal-orange', name: 'Teal & Orange', desc: 'Cinematic contrast' },
                    { id: 'golden-hour', name: 'Sunset Dusk', desc: 'Warm ambient bloom' },
                    { id: 'ethereal-pastel', name: 'Tokyo Pastel', desc: 'Soft bright washes' },
                    { id: 'lomo-vivid', name: 'Lomo Vivid', desc: 'Saturated vignette' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => onChangeFilter(f.id as FilterType)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        filter === f.id
                          ? 'border-razel-neon bg-razel-neon/10 text-white shadow-md'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold font-display">{f.name}</span>
                      <span className="text-[10px] text-white/40 leading-none mt-1">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              <div>
                <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-4">
                  Manual Lab Adjustment Controls
                </h4>
                
                <div className="flex flex-col gap-4">
                  {[
                    { key: 'brightness', label: 'Brightness', min: 70, max: 130, unit: '%' },
                    { key: 'contrast', label: 'Contrast', min: 70, max: 130, unit: '%' },
                    { key: 'saturation', label: 'Saturation', min: 0, max: 180, unit: '%' },
                    { key: 'vignette', label: 'Vignette Dark Corners', min: 0, max: 100, unit: '%' },
                    { key: 'grain', label: 'Organic Film Grain', min: 0, max: 100, unit: '%' },
                  ].map((slider) => {
                    const value = (filterSettings as any)[slider.key];
                    return (
                      <div key={slider.key} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white/80">{slider.label}</span>
                          <span className="font-mono text-razel-neon">{value}{slider.unit}</span>
                        </div>
                        <input
                          type="range"
                          min={slider.min}
                          max={slider.max}
                          value={value}
                          onChange={(e) => {
                            onChangeFilterSettings({
                              ...filterSettings,
                              [slider.key]: Number(e.target.value),
                            });
                          }}
                          className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-razel-neon"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              <div>
                <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-3">
                  Analog Light Leaks & Lens Flares
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', name: 'No Leak / Flare', desc: 'Pristine exposure' },
                    { id: 'sunflare', name: 'Golden Hour Flare', desc: 'Warm vintage leak' },
                    { id: 'neonspill', name: 'Cyberpunk Spill', desc: 'Neon blue & pink spill' },
                    { id: 'warmfog', name: 'Aged Warm Fog', desc: 'Retro red fog' },
                    { id: 'prismflare', name: 'Rainbow Prism', desc: 'Prismatic color ray' },
                    { id: 'lensflare', name: 'Cinematic Lens Flare', desc: 'Concentric flare ring' },
                    { id: 'disco-glimmer', name: 'Retro Shimmer', desc: 'Ambient star sparkles' },
                  ].map((leak) => (
                    <button
                      key={leak.id}
                      onClick={() => {
                        onChangeFilterSettings({
                          ...filterSettings,
                          lightLeak: leak.id as any,
                        });
                      }}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        filterSettings.lightLeak === leak.id
                          ? 'border-razel-neon bg-razel-neon/10 text-white shadow-md'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold font-display">{leak.name}</span>
                      <span className="text-[10px] text-white/40 leading-none mt-1">{leak.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FRAME & TEXT */}
          {activeTab === 'frame' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-3">
                  Frame Border Base Color
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {borderOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onChangeBorderId(opt.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                        borderId === opt.id
                          ? 'border-razel-neon bg-razel-neon/10 text-white shadow-md'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0" 
                        style={{ backgroundColor: opt.color }}
                      />
                      <span className="text-xs font-bold font-display leading-tight truncate">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              {/* Thematic Frame Presets */}
              <div>
                <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-3">
                  Thematic Frame Presets
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'Classic Border', desc: 'Minimal solid look', icon: '🎨' },
                    { id: 'birthday', label: 'Birthday Bash', desc: 'Confetti & party overlays', icon: '🎈' },
                    { id: 'holiday', label: 'Holiday Spot', desc: 'Summer sunset & palms', icon: '🌅' },
                    { id: 'nature', label: 'Sakura Forest', desc: 'Floral petals & leaves', icon: '🌸' },
                    { id: 'love', label: 'Sweet Hearts', desc: 'Cupid hearts & romance', icon: '❤️' },
                    { id: 'halloween', label: 'Spooky Halloween', desc: 'Gothic pumpkins & bats', icon: '🎃' },
                    { id: 'thanksgiving', label: 'Harvest Feast', desc: 'Warm autumn & pumpkins', icon: '🦃' },
                    { id: 'goth', label: 'Midnight Goth', desc: 'Chains, skulls & spiders', icon: '🦇' },
                    { id: 'christmas', label: 'Christmas Cheer', desc: 'Festive holly & snow', icon: '🎄' },
                    { id: 'girly', label: 'Coquette Pink', desc: 'Cute cherry & pink bows', icon: '🎀' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => onChangeFrameThemeId(theme.id)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        frameThemeId === theme.id
                          ? 'border-razel-neon bg-razel-neon/10 text-white shadow-md'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-lg shrink-0">{theme.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold font-display leading-tight">{theme.label}</span>
                        <span className="text-[9px] text-white/40 leading-normal mt-0.5 truncate">{theme.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              {/* Picture Holder Frame Strokes */}
              <div>
                <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-3">
                  Picture Holder Frame Strokes
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'Default Inset', desc: 'Traditional clean fit', icon: '📷' },
                    { id: 'white-stroke', label: 'Crisp White Stroke', desc: 'Thin white frame outline', icon: '⬜' },
                    { id: 'bento-plaster', label: 'Bento Plaster', desc: 'Bold outline + shadow', icon: '🍱' },
                    { id: 'polaroid-classic', label: 'Polaroid Border', desc: 'Thick custom polaroid frame', icon: '🖼️' },
                    { id: 'vintage-burn', label: 'Distressed Burn', desc: 'Burnished amber frame edges', icon: '🔥' },
                  ].map((stroke) => (
                    <button
                      key={stroke.id}
                      onClick={() => onChangePictureFrameStroke(stroke.id)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        pictureFrameStroke === stroke.id
                          ? 'border-razel-neon bg-razel-neon/10 text-white shadow-md'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-lg shrink-0">{stroke.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold font-display leading-tight">{stroke.label}</span>
                        <span className="text-[9px] text-white/40 leading-normal mt-0.5 truncate">{stroke.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              {/* Upload Custom Image Background */}
              <div>
                <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-razel-neon" /> Custom Frame Background Image
                </h4>
                
                <div className="flex flex-col gap-3">
                  {customBgImage ? (
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl">
                      <img 
                        src={customBgImage} 
                        alt="Custom BG Preview" 
                        className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">Uploaded BG Pattern</p>
                        <p className="text-[9px] text-white/40">Custom resolution image</p>
                      </div>
                      <button
                        onClick={() => onChangeCustomBgImage(null)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors shrink-0"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label 
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-razel-neon', 'bg-razel-neon/5');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-razel-neon', 'bg-razel-neon/5');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-razel-neon', 'bg-razel-neon/5');
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            onChangeCustomBgImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="border-2 border-dashed border-white/10 hover:border-razel-neon/50 bg-white/5 hover:bg-razel-neon/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              onChangeCustomBgImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Upload className="w-5 h-5 text-white/40" />
                      <span className="text-xs font-bold text-white">Upload Custom Background Image</span>
                      <span className="text-[9px] text-white/40 text-center">Drag & drop or click to select image</span>
                    </label>
                  )}

                  {/* Settings Sliders if Custom Background Image is Loaded */}
                  {customBgImage && (
                    <div className="flex flex-col gap-3.5 bg-black/20 border border-white/5 p-3.5 rounded-xl animate-fade-in">
                      {/* Opacity */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/75 font-semibold">Image Opacity</span>
                          <span className="font-mono text-razel-neon">{customBgOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={customBgOpacity}
                          onChange={(e) => onChangeCustomBgOpacity(Number(e.target.value))}
                          className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-razel-neon"
                        />
                      </div>

                      {/* Scale (only applies for repeat) */}
                      {customBgTiling === 'repeat' && (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/75 font-semibold">Tiling Pattern Scale</span>
                            <span className="font-mono text-razel-neon">{customBgScale}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="150"
                            value={customBgScale}
                            onChange={(e) => onChangeCustomBgScale(Number(e.target.value))}
                            className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-razel-neon"
                          />
                        </div>
                      )}

                      {/* Layout Tiling Format */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Layout Style</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'cover', name: 'Fill Cover' },
                            { id: 'contain', name: 'Fit Center' },
                            { id: 'repeat', name: 'Tile Repeat' },
                          ].map((tile) => (
                            <button
                              key={tile.id}
                              type="button"
                              onClick={() => onChangeCustomBgTiling(tile.id as any)}
                              className={`py-1 px-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                                customBgTiling === tile.id
                                  ? 'border-razel-neon bg-razel-neon/10 text-white'
                                  : 'border-white/10 bg-white/5 text-white/40 hover:text-white/80'
                              }`}
                            >
                              {tile.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              <div>
                <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-3">
                  Custom Text Caption
                </h4>
                <input
                  type="text"
                  maxLength={40}
                  placeholder="Enter photobooth event name / caption..."
                  value={caption}
                  onChange={(e) => onChangeCaption(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-razel-neon placeholder-white/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-2.5">
                    Typographic Style
                  </h4>
                  <div className="flex flex-col gap-1">
                    {fontOptions.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => onChangeCaptionFont(f.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          captionFont === f.id
                            ? 'border-razel-neon bg-razel-neon/10 text-white'
                            : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white/80'
                        }`}
                      >
                        <span className={f.className}>{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-2.5">
                    Text Color Picker
                  </h4>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      '#FFFFFF', '#12141C', '#E63946', '#F4A261',
                      '#E9D8A6', '#94D2BD', '#0A9396', '#7209B7',
                      '#FF2E54', '#1F2937', '#8B5CF6', '#F59E0B'
                    ].map((col) => (
                      <button
                        key={col}
                        onClick={() => onChangeCaptionColor(col)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${
                          captionColor === col ? 'border-razel-neon scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STICKERS STAMP */}
          {activeTab === 'stickers' && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div>
                <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-1.5">
                  Stamp Sticker Deck
                </h4>
                <p className="text-xs text-white/40 mb-4 leading-normal">
                  Click on any digital sticker below to stamp it into the center of the photo. Then, drag it to reposition, scale, or rotate directly on the photo strip canvas!
                </p>
                
                <div className="grid grid-cols-5 gap-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {/* Plus trigger to add new stamp */}
                  <label className="aspect-square bg-razel-neon/5 border-2 border-dashed border-razel-neon/30 hover:border-razel-neon hover:bg-razel-neon/15 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all p-2 select-none text-center">
                    <input
                      type="file"
                      accept="image/png, image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const dataUrl = reader.result as string;
                            setCustomStamps(prev => {
                              const updated = [...prev, dataUrl];
                              localStorage.setItem('digismile_custom_stamps', JSON.stringify(updated));
                              return updated;
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Upload className="w-4 h-4 text-razel-neon mb-1" />
                    <span className="text-[8px] font-bold text-razel-neon leading-none uppercase tracking-wider">Add PNG</span>
                  </label>

                  {customStamps.map((src, idx) => (
                    <div
                      key={`custom-stamp-${idx}`}
                      className="relative group aspect-square bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-xl flex items-center justify-center p-1.5 select-none overflow-hidden"
                    >
                      <button
                        onClick={() => handleAddSticker('', src)}
                        className="w-full h-full flex items-center justify-center cursor-pointer"
                      >
                        <img src={src} className="max-w-full max-h-full object-contain" alt="custom stamp" referrerPolicy="no-referrer" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomStamps(prev => {
                            const updated = prev.filter((_, i) => i !== idx);
                            localStorage.setItem('digismile_custom_stamps', JSON.stringify(updated));
                            return updated;
                          });
                        }}
                        className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                        title="Remove custom stamp"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {stickerBank.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleAddSticker(st.emoji)}
                      className="sticker-item aspect-square bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-xl flex items-center justify-center text-3xl p-2 select-none cursor-pointer"
                    >
                      {st.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              <div>
                <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-razel-neon" /> Upload Branding Watermark or Event Logo
                </h4>
                <p className="text-xs text-white/40 mb-3 leading-normal">
                  Add custom event logos, host badges, or transparent PNG watermarks. Drag & drop or click below to stamp them directly onto your photo strip!
                </p>

                <div className="mb-4 bg-white/5 border border-white/15 p-3 rounded-xl">
                  <span className="text-[11px] font-mono font-bold text-white/50 block mb-2 uppercase tracking-wider">
                    Official Instant Watermarks
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 400;
                        canvas.height = 100;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                          ctx.font = 'bold 36px "Space Grotesk", sans-serif';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText('⚡ DIGISMILE', 200, 50);
                        }
                        handleAddSticker('', canvas.toDataURL('image/png'));
                      }}
                      className="py-2 px-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-emerald-500 hover:border-emerald-500 transition-all text-center"
                    >
                      ⚡ DigiSmile Logo
                    </button>
                    <button
                      onClick={() => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 400;
                        canvas.height = 100;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                          ctx.font = 'bold 32px "Courier Prime", monospace';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText('[ VIP SESSION ]', 200, 50);
                        }
                        handleAddSticker('', canvas.toDataURL('image/png'));
                      }}
                      className="py-2 px-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-emerald-500 hover:border-emerald-500 transition-all text-center"
                    >
                      [ VIP Session ]
                    </button>
                  </div>
                </div>
                
                <label 
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-razel-neon', 'bg-razel-neon/5');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-razel-neon', 'bg-razel-neon/5');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-razel-neon', 'bg-razel-neon/5');
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        handleAddSticker('', reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="border-2 border-dashed border-white/10 hover:border-razel-neon/50 bg-white/5 hover:bg-razel-neon/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          handleAddSticker('', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Layers className="w-5 h-5 text-white/40" />
                  <span className="text-xs font-bold text-white">Upload Custom PNG/JPG Logo</span>
                  <span className="text-[9px] text-white/40 text-center">Drag & drop logo file or click to select</span>
                </label>
              </div>

              {selectedStickerId && (
                <div className="bg-black/30 border border-white/10 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-razel-neon flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 animate-pulse" /> Sticker Active Controls
                    </span>
                    <button
                      onClick={() => setSelectedStickerId(null)}
                      className="text-white/40 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between gap-2.5">
                    <button
                      onClick={handleRotateSelected}
                      className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> Rotate 45°
                    </button>

                    <button
                      onClick={() => handleScaleSelected(0.2)}
                      className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Maximize className="w-3.5 h-3.5" /> Size Up
                    </button>

                    <button
                      onClick={() => handleScaleSelected(-0.2)}
                      className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Minimize className="w-3.5 h-3.5" /> Size Down
                    </button>

                    <button
                      onClick={handleDeleteSelected}
                      className="py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button Strip */}
        <div className="p-4 lg:p-6 border-t border-white/10 bg-black/95 lg:bg-black/40 backdrop-blur-md flex items-center justify-between gap-4 fixed bottom-0 left-0 right-0 z-[100] lg:static lg:z-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> RETAKE
          </button>

          <button
            onClick={onProceed}
            className="px-6 py-3 rounded-xl bg-razel-neon hover:bg-razel-neon/90 text-white font-display font-extrabold text-xs tracking-wide shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-1.5 flex-1 justify-center max-w-[280px]"
            id="btn-customize-generate"
          >
            GENERATE STRIP <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {retakeIndex !== null && (
        <RetakeModal
          index={retakeIndex}
          template={template}
          photos={photos}
          onClose={() => setRetakeIndex(null)}
          onCapture={(capturedDataUrl) => {
            const updatedPhotos = [...photos];
            updatedPhotos[retakeIndex] = capturedDataUrl;
            onUpdatePhotos(updatedPhotos);
            setRetakeIndex(null);
          }}
        />
      )}

      {/* Floating Action Button (FAB) for Mobile - Scroll to tools */}
      <div className="lg:hidden fixed bottom-24 right-4 z-[55]">
        <button
          onClick={() => {
            document.getElementById('customize-tabs')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-center justify-center p-4 rounded-full bg-razel-neon text-white shadow-[0_4px_20px_rgba(255,46,84,0.5)] active:scale-95 transition-transform"
          title="Open Customization Tools"
        >
          <Sliders className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
