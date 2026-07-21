/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Layers, 
  Share2, 
  Shield, 
  Heart, 
  Sliders, 
  ChevronRight, 
  Smartphone, 
  Sparkles, 
  Smile, 
  Star, 
  Gift, 
  Flame, 
  Menu, 
  X, 
  HelpCircle,
  Clock
} from 'lucide-react';

interface WelcomeViewProps {
  onStart: () => void;
  generatedPreviews?: Record<string, string>;
  deferredPrompt?: any;
  onInstall?: () => void;
}

const SHOWCASE_TEMPLATES = [
  { id: 'strip', name: 'Vintage Photo Strip', ratio: '2:6 Aspect', desc: 'The nostalgic arcade photobooth strip with quad snapshots.' },
  { id: 'polaroid', name: 'Aged Polaroid Classic', ratio: '4:5 Aspect', desc: 'Timeless square format with distressed paper textures.' },
  { id: 'sprocket-roll', name: 'Retro 35mm Sprocket', ratio: '3:8 Aspect', desc: 'Physical analog sprocket holes with a rich film-negative edge.' },
  { id: 'purikura', name: 'Kawaii Purikura', ratio: '1:1 Aspect', desc: 'Decorated cherry blossoms, neon decals, and custom border stamps.' },
  { id: 'ticket', name: 'Cinema Ticket Stub', ratio: '4:10 Aspect', desc: 'A ticket-stub outline layout complete with vintage barcode stamps.' },
  { id: 'cinematic', name: 'Directors Cut', ratio: '16:9 Aspect', desc: 'Widescreen cinematic format with physical burn lines.' },
];

export default function WelcomeView({ onStart, generatedPreviews, deferredPrompt, onInstall }: WelcomeViewProps) {
  const [index, setIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-play interval for the showcase carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SHOWCASE_TEMPLATES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInstallClick = () => {
    if (onInstall) {
      onInstall();
    } else {
      alert("To install, click your browser's share icon or 'Install' option, or tap 'Add to Home Screen' in your browser menu!");
    }
  };

  const handleForceUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }
    window.location.reload();
  };

  return (
    <div className="w-full select-none" id="welcome-view-container">
      
      {/* 1. App Header Navbar inside Welcome Page */}
      <header className="w-full border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,51,75,0.25)]">
              <img src="logo.png" alt="DigiSmile Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <h1 className="text-xl font-display font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-none">
                DIGISMILE<span className="text-razel-neon">STUDIO</span>
              </h1>
              <p className="text-[8px] uppercase tracking-widest text-white/40 font-mono font-bold">Razel Tech India</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer">🏠 Home</button>
            <button onClick={() => scrollToSection('why-us')} className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer">✨ Features</button>
            <button onClick={() => scrollToSection('choose-version')} className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer">🎛️ Compare Versions</button>
            <button onClick={() => scrollToSection('privacy')} className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer">🔒 Privacy</button>
            <button onClick={() => scrollToSection('themes')} className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer">🎨 Themes</button>
            <button 
              onClick={handleForceUpdate}
              className="text-xs font-semibold text-white/60 hover:text-razel-neon transition-colors cursor-pointer flex items-center gap-1"
              title="Purge local cache and force refresh application update"
            >
              🔄 Update
            </button>
            
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-lg border border-razel-neon/40 text-razel-neon hover:bg-razel-neon/10 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                📲 Install App
              </button>
            )}
            
            <button
              onClick={onStart}
              className="px-4 py-2 rounded-xl bg-razel-neon hover:bg-razel-neon/90 text-white font-display font-extrabold text-xs tracking-wider uppercase transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-razel-neon/25"
            >
              Launch Studio Pro 📸
            </button>
          </nav>

          {/* Mobile hamburger button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full bg-[#0d0f17] border-b border-white/10 px-6 py-5 flex flex-col gap-4 animate-fade-in">
            <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }} className="text-sm font-semibold text-white/70 hover:text-white text-left py-1 cursor-pointer">🏠 Home Page</button>
            <button onClick={() => scrollToSection('why-us')} className="text-sm font-semibold text-white/70 hover:text-white text-left py-1 cursor-pointer">✨ Features</button>
            <button onClick={() => scrollToSection('choose-version')} className="text-sm font-semibold text-white/70 hover:text-white text-left py-1 cursor-pointer">🎛️ Compare Versions</button>
            <button onClick={() => scrollToSection('privacy')} className="text-sm font-semibold text-white/70 hover:text-white text-left py-1 cursor-pointer">🔒 Data Privacy</button>
            <button onClick={() => scrollToSection('themes')} className="text-sm font-semibold text-white/70 hover:text-white text-left py-1 cursor-pointer">🎨 Themes Preview</button>
            <button 
              onClick={handleForceUpdate}
              className="text-sm font-semibold text-white/70 hover:text-razel-neon text-left py-1 cursor-pointer flex items-center gap-1"
            >
              🔄 Update App
            </button>
            
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="w-full py-2.5 rounded-lg border border-razel-neon/30 text-razel-neon font-bold text-xs uppercase tracking-wider text-center cursor-pointer"
              >
                📲 Install App on Phone
              </button>
            )}
            
            <button
              onClick={() => { setMobileMenuOpen(false); onStart(); }}
              className="w-full py-3 rounded-xl bg-razel-neon text-white font-display font-extrabold text-sm uppercase tracking-wider text-center cursor-pointer shadow-md"
            >
              Launch Studio V3 Pro 📸
            </button>
          </div>
        )}
      </header>

      {/* 2. Hero Section (Combined Title and Interactive Carousel) */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Hero Left Column: Brand Statement & Quick Launches */}
        <div className="lg:col-span-7 flex flex-col text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-razel-neon/10 border border-razel-neon/20 text-razel-neon text-xs font-semibold tracking-wider uppercase mb-5 self-start">
            <Heart className="w-3.5 h-3.5 fill-razel-neon animate-pulse" /> ⚡ POWERED BY RAZEL TECH 🇮🇳
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-white leading-tight mb-4">
            Capture Every Smile,<br />Print Every Memory
          </h1>
          
          <p className="text-white/60 text-sm md:text-lg leading-relaxed max-w-xl mb-8">
            Welcome to <strong>DigiSmile Photobooth Studio</strong>! Your high-performance browser digital photobooth app. Shoot HD camera photos, apply realistic analog filters, customize borders, place draggable stickers, and export looping GIFs & Behind-The-Scenes timelapses instantly!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={onStart}
              className="px-6 py-4 rounded-xl bg-razel-neon hover:bg-razel-neon/90 text-white font-display font-extrabold text-sm tracking-wider uppercase transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xl shadow-razel-neon/20 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" /> Launch V3 React Pro
            </button>
            <a
              href="booth.html"
              className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-display font-extrabold text-sm tracking-wider uppercase transition-transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-emerald-400" /> Launch V2 Wizard
            </a>
            <a
              href="booth_v1.html"
              className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-display font-extrabold text-sm tracking-wider uppercase transition-transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2"
            >
              <Sliders className="w-4 h-4 text-sky-400" /> Classic Studio V1
            </a>
          </div>

          <p className="text-[11px] text-white/40 font-mono">
            💡 Not sure which interface fits? <button onClick={() => scrollToSection('choose-version')} className="text-razel-neon hover:underline cursor-pointer">Compare versions below ↓</button>
          </p>
        </div>

        {/* Hero Right Column: Dynamic Live Previews Carousel */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center mt-6 lg:mt-0">
          <div className="w-full max-w-[340px] md:max-w-[370px] bg-black/40 border border-white/10 rounded-2xl p-4 shadow-2xl relative flex flex-col">
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-t-2xl" />
            
            <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-zinc-950/60 flex items-center justify-center shadow-inner min-h-[300px]">
              <div className="absolute w-44 h-44 bg-razel-neon/15 blur-3xl rounded-full animate-pulse pointer-events-none" />
              
              <div className="relative w-full h-full p-4 flex items-center justify-center">
                {SHOWCASE_TEMPLATES.map((item, idx) => {
                  const isActive = idx === index;
                  const imgUrl = generatedPreviews?.[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-1000 ease-out ${
                        isActive 
                          ? 'opacity-100 scale-100 rotate-0 translate-y-0 z-10' 
                          : 'opacity-0 scale-95 translate-y-4 pointer-events-none z-0'
                      }`}
                    >
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          referrerPolicy="no-referrer"
                          alt={item.name}
                          className="max-h-[290px] md:max-h-[330px] w-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] rounded"
                        />
                      ) : (
                        <div className="w-36 h-72 rounded-xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center p-6 text-zinc-600 animate-pulse">
                          <Camera className="w-8 h-8 mb-4 animate-bounce text-zinc-800" />
                          <span className="font-mono text-[9px] tracking-widest uppercase">Rendering...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 bg-zinc-900/80 backdrop-blur-sm border border-white/5 rounded-xl p-3.5 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-razel-neon uppercase tracking-wide">
                  {SHOWCASE_TEMPLATES[index].name}
                </span>
                <span className="font-mono text-[8px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  {SHOWCASE_TEMPLATES[index].ratio}
                </span>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">
                {SHOWCASE_TEMPLATES[index].desc}
              </p>
              
              <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5">
                {SHOWCASE_TEMPLATES.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setIndex(idx)}
                    className="flex-1 h-1 rounded-full overflow-hidden bg-white/10 transition-colors relative cursor-pointer"
                    title={`Showcase ${item.name}`}
                  >
                    <div 
                      className={`h-full bg-razel-neon rounded-full ${
                        idx === index ? 'w-full' : 'w-0'
                      }`}
                      style={{
                        transitionProperty: 'width',
                        transitionDuration: idx === index ? '4500ms' : '0ms',
                        transitionTimingFunction: 'linear'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why Our Photobooth Is Best Section */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20 border-t border-white/10" id="why-us">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-extrabold text-white">Why Our Photobooth is Best</h2>
          <p className="text-sm text-white/50 mt-2 max-w-lg mx-auto">
            Loaded with premium features designed for birthdays, weddings, events, and everyday aesthetic snapshots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/[0.01] border border-white/5 hover:border-white/15 p-6 rounded-2xl transition-all hover:bg-white/[0.02]">
            <span className="text-3xl block mb-4">📸</span>
            <h3 className="text-lg font-bold text-white mb-2">Instant HD Studio Feed</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Seamless webcam stream with front/rear camera flip, mirror toggle, 1-5 photo strip counts, 2x2 quad box grids, and single Polaroid cards.
            </p>
          </div>
          <div className="bg-white/[0.01] border border-white/5 hover:border-white/15 p-6 rounded-2xl transition-all hover:bg-white/[0.02]">
            <span className="text-3xl block mb-4">🎬</span>
            <h3 className="text-lg font-bold text-white mb-2">Analog Film Shaders & Tones</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Silver Gelatin B&W, Polaroid SX-70 Instant, Fujifilm Instax, 1970s Kodachrome, Sepia, ISO film grain, light leak flares, and 1-tap quick filters.
            </p>
          </div>
          <div className="bg-white/[0.01] border border-white/5 hover:border-white/15 p-6 rounded-2xl transition-all hover:bg-white/[0.02]">
            <span className="text-3xl block mb-4">🎨</span>
            <h3 className="text-lg font-bold text-white mb-2">Color Palettes & Paper Finishes</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Pick custom background colors, frame border margins, uploaded custom background images, custom typography fonts, and paper textures.
            </p>
          </div>
          <div className="bg-white/[0.01] border border-white/5 hover:border-white/15 p-6 rounded-2xl transition-all hover:bg-white/[0.02]">
            <span className="text-3xl block mb-4">📱</span>
            <h3 className="text-lg font-bold text-white mb-2">Direct WhatsApp & App Sharing</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              One-tap native Web Share API file integration to send your finished photo strip directly to WhatsApp, Instagram Stories, or Telegram.
            </p>
          </div>
          <div className="bg-white/[0.01] border border-white/5 hover:border-white/15 p-6 rounded-2xl transition-all hover:bg-white/[0.02]">
            <span className="text-3xl block mb-4">📲</span>
            <h3 className="text-lg font-bold text-white mb-2">Installable PWA App</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Works natively on iPhone, Android, and Desktop! Tap 'Add to Home Screen' to launch full-screen like a native app with zero store installs.
            </p>
          </div>
          <div className="bg-white/[0.01] border border-white/5 hover:border-white/15 p-6 rounded-2xl transition-all hover:bg-white/[0.02]">
            <span className="text-3xl block mb-4">👑</span>
            <h3 className="text-lg font-bold text-white mb-2">Draggable Sticker Stamps</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Place cute party crowns, sunglasses, hearts, sparkles, and stars directly onto your photos. Drag, scale, position, and rotate stickers freely.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Choose Your Version Section */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20 border-t border-white/10" id="choose-version">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-extrabold text-white">Choose Your Studio Experience</h2>
          <p className="text-sm text-white/50 mt-2 max-w-lg mx-auto">
            Three interfaces, same powerful engine. Pick the one that fits your capture style.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* V1: Classic Card */}
          <div className="group bg-white/[0.01] border border-white/10 hover:border-white/20 p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between relative">
            <div>
              <span className="absolute top-4 right-4 text-[8px] font-mono font-bold bg-white/10 text-white/60 px-2 py-0.5 rounded uppercase">V1 Classic</span>
              <span className="text-3xl block mb-4">🎛️</span>
              <h3 className="text-xl font-bold text-white mb-2">Classic Studio</h3>
              <p className="text-xs text-white/50 leading-relaxed mb-6">
                All controls visible at once. Camera + settings + preview in a single-screen layout. Familiar, fast, and direct — great for experienced users and desktop setups.
              </p>
              <ul className="text-xs text-white/60 space-y-2 mb-8">
                <li className="flex items-center gap-2">✓ Single-page all-in-one workspace</li>
                <li className="flex items-center gap-2">✓ Tabbed control panel</li>
                <li className="flex items-center gap-2">✓ Full filter & paper stock library</li>
                <li className="flex items-center gap-2">✓ Session history thumbnails</li>
                <li className="flex items-center gap-2">✓ 100% offline-ready</li>
              </ul>
            </div>
            <a
              href="booth_v1.html"
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-xs tracking-wider uppercase text-center transition-colors cursor-pointer"
            >
              Launch Classic V1 →
            </a>
          </div>

          {/* V2: Wizard Card */}
          <div className="group bg-white/[0.01] border border-white/10 hover:border-white/20 p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between relative">
            <div>
              <span className="absolute top-4 right-4 text-[8px] font-mono font-bold bg-white/10 text-white/60 px-2 py-0.5 rounded uppercase">V2 Wizard</span>
              <span className="text-3xl block mb-4">📸</span>
              <h3 className="text-xl font-bold text-white mb-2">DigiSmile Wizard</h3>
              <p className="text-xs text-white/50 leading-relaxed mb-6">
                Step-by-step guided photobooth experience. Choose layout → Capture → Customize → Finish. Optimized for mobile, touch-first, and beginner-friendly events.
              </p>
              <ul className="text-xs text-white/60 space-y-2 mb-8">
                <li className="flex items-center gap-2">✓ 4-step guided wizard flow</li>
                <li className="flex items-center gap-2">✓ Mobile-first touch layout</li>
                <li className="flex items-center gap-2">✓ Live strip preview at every step</li>
                <li className="flex items-center gap-2">✓ Interactive filters & grain controls</li>
                <li className="flex items-center gap-2">✓ Direct social sharing shortcuts</li>
              </ul>
            </div>
            <a
              href="booth.html"
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-xs tracking-wider uppercase text-center transition-colors cursor-pointer"
            >
              Launch Wizard V2 →
            </a>
          </div>

          {/* V3: React Pro Card */}
          <div className="group bg-gradient-to-br from-razel-neon/10 to-transparent border border-razel-neon/30 hover:border-razel-neon/50 p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between relative shadow-[0_4px_30px_rgba(255,51,75,0.05)] hover:shadow-[0_4px_30px_rgba(255,51,75,0.12)]">
            <div>
              <span className="absolute top-4 right-4 text-[8px] font-mono font-bold bg-razel-neon text-black px-2 py-0.5 rounded uppercase tracking-wide">V3 Recommended</span>
              <span className="text-3xl block mb-4">⚡</span>
              <h3 className="text-xl font-bold text-white mb-2">React Studio Pro</h3>
              <p className="text-xs text-white/50 leading-relaxed mb-6">
                Our flagship modern photobooth. Step-by-step React 19 interface. Professional DPI layouts, custom background patterns, behind-the-scenes recording, and PWA capabilities.
              </p>
              <ul className="text-xs text-white/70 space-y-2 mb-8">
                <li className="flex items-center gap-2">✓ React 19 + TypeScript Engine</li>
                <li className="flex items-center gap-2">✓ Ultra-high 400 DPI print output</li>
                <li className="flex items-center gap-2">✓ Upload your own transparent PNG stamps</li>
                <li className="flex items-center gap-2">✓ Behind-the-scenes Timelapse MP4</li>
                <li className="flex items-center gap-2">✓ Installable Offline App (PWA)</li>
              </ul>
            </div>
            <button
              onClick={onStart}
              className="w-full py-3 rounded-xl bg-razel-neon hover:bg-razel-neon/90 text-white font-semibold text-xs tracking-wider uppercase text-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-razel-neon/20"
            >
              Launch React V3 Pro →
            </button>
          </div>

        </div>
      </section>

      {/* 5. 100% Data Privacy Guarantee Card */}
      <section className="max-w-6xl mx-auto px-4 py-8" id="privacy">
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/2 border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
              100% Data Privacy & Security Guarantee
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Your photos are strictly private! All camera feeds, image transformations, custom background uploads, and canvas rendering occur <strong>100% locally inside your web browser</strong>. No photos or camera video streams are ever uploaded, recorded, or saved to any cloud server.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Happy to Make Memories Section */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16 border-t border-white/10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-extrabold text-white">Happy to Make Memories</h2>
          <p className="text-sm text-white/50 mt-2 max-w-lg mx-auto">
            Perfect for birthday parties, weddings, reunions, and social media aesthetic collages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
            <span className="text-4xl block mb-3">🎉</span>
            <h3 className="text-lg font-bold text-white mb-2">Birthday Parties</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Capture fun group shots with party hats, crowns, and custom date stamps to cherish special celebration moments.
            </p>
          </div>
          <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
            <span className="text-4xl block mb-3">💍</span>
            <h3 className="text-lg font-bold text-white mb-2">Weddings</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Elegant Polaroid-style frames and warm vintage film shaders to create timeless souvenir strips for your guests.
            </p>
          </div>
          <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
            <span className="text-4xl block mb-3">✨</span>
            <h3 className="text-lg font-bold text-white mb-2">Social Media</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Generate aesthetic Y2K and Cyberpunk neon photo strips ready to share on Instagram, WhatsApp, and TikTok.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Upcoming Themes Preview Section */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20 border-t border-white/10" id="themes">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-extrabold text-white">Upcoming Themes Preview</h2>
          <p className="text-sm text-white/50 mt-2 max-w-lg mx-auto">
            We are constantly crafting new visual styles and paper stock themes for you.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl relative overflow-hidden group">
            <span className="absolute top-2 right-2 text-[8px] font-mono bg-razel-neon/15 text-razel-neon border border-razel-neon/20 px-1.5 py-0.5 rounded font-bold uppercase">Soon</span>
            <div className="aspect-square bg-gradient-to-br from-amber-500/20 to-amber-700/5 border border-white/5 rounded-lg flex items-center justify-center text-3xl mb-3 group-hover:scale-105 transition-transform duration-300">🎞️</div>
            <h4 className="text-sm font-bold text-white">1970s Kodachrome</h4>
            <p className="text-[10px] text-white/40 mt-1">Warm vintage analog warm tone</p>
          </div>

          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl relative overflow-hidden group">
            <span className="absolute top-2 right-2 text-[8px] font-mono bg-razel-neon/15 text-razel-neon border border-razel-neon/20 px-1.5 py-0.5 rounded font-bold uppercase">Soon</span>
            <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/5 border border-white/5 rounded-lg flex items-center justify-center text-3xl mb-3 group-hover:scale-105 transition-transform duration-300">⚡</div>
            <h4 className="text-sm font-bold text-white">Cyberpunk Neon Glow</h4>
            <p className="text-[10px] text-white/40 mt-1">Cyan & neon purple flares</p>
          </div>

          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl relative overflow-hidden group">
            <span className="absolute top-2 right-2 text-[8px] font-mono bg-razel-neon/15 text-razel-neon border border-razel-neon/20 px-1.5 py-0.5 rounded font-bold uppercase">Soon</span>
            <div className="aspect-square bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-white/5 rounded-lg flex items-center justify-center text-3xl mb-3 group-hover:scale-105 transition-transform duration-300">✨</div>
            <h4 className="text-sm font-bold text-white">Wedding Gold Foil</h4>
            <p className="text-[10px] text-white/40 mt-1">Luxurious golden borders</p>
          </div>

          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl relative overflow-hidden group">
            <span className="absolute top-2 right-2 text-[8px] font-mono bg-razel-neon/15 text-razel-neon border border-razel-neon/20 px-1.5 py-0.5 rounded font-bold uppercase">Soon</span>
            <div className="aspect-square bg-gradient-to-br from-zinc-500/20 to-zinc-700/5 border border-white/5 rounded-lg flex items-center justify-center text-3xl mb-3 group-hover:scale-105 transition-transform duration-300">📽️</div>
            <h4 className="text-sm font-bold text-white">Classic Silver Mono</h4>
            <p className="text-[10px] text-white/40 mt-1">High-contrast retro B&W</p>
          </div>
        </div>
      </section>

    </div>
  );
}
