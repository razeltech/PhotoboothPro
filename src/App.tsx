/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Camera, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import Header from './components/Header';
import WelcomeView from './components/WelcomeView';
import LayoutSelector from './components/LayoutSelector';
import CameraView from './components/CameraView';
import CustomizePanel from './components/CustomizePanel';
import ExportPanel from './components/ExportPanel';
import TestCasesPanel from './components/TestCasesPanel';
import { TemplateType, FilterType, FilterSettings, Sticker } from './types';
import { renderTemplatePreview } from './utils/previewRenderer';

export default function App() {
  // Navigation Steps: 
  // 0: Welcome, 1: Layout Selection, 2: Camera Capture, 3: Stylize/Customize, 4: Share/Export
  const [step, setStep] = useState<number>(0);
  const [isNavigationLocked, setIsNavigationLocked] = useState<boolean>(false);

  // Photo Sessions State
  const [photos, setPhotos] = useState<string[]>([]);
  const [btsVideoBlobUrl, setBtsVideoBlobUrl] = useState<string | null>(null);

  // Layout Properties
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('strip');
  const [generatedPreviews, setGeneratedPreviews] = useState<Record<string, string>>({});

  // Auto pre-render all templates with clean placeholder/mock backdrops on mount
  useEffect(() => {
    const preRenderAll = async () => {
      try {
        const colors = [
          { bg: '#3b82f6', text: '#eff6ff', accent: '#60a5fa', title: 'Studio Blue' },
          { bg: '#db2777', text: '#fdf2f8', accent: '#f472b6', title: 'Sakura Pink' },
          { bg: '#059669', text: '#ecfdf5', accent: '#34d399', title: 'Chroma Green' },
          { bg: '#d97706', text: '#fffbeb', accent: '#fbbf24', title: 'Warm Amber' }
        ];

        const mockPhotoDataUrls = colors.map((theme, index) => {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          if (!ctx) return '';
          const grad = ctx.createRadialGradient(320, 240, 50, 320, 240, 350);
          grad.addColorStop(0, theme.accent);
          grad.addColorStop(1, theme.bg);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.beginPath(); ctx.arc(320, 240, 160, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath(); ctx.arc(320, 240, 90, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = theme.text;
          ctx.beginPath(); ctx.arc(320, 210, 55, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(320, 340, 110, 75, 0, 0, Math.PI, true); ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(420, 140, 15, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(0, 420, 640, 60);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 18px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`MOCK PHOTO #${index + 1} - ${theme.title.toUpperCase()}`, 320, 455);
          return canvas.toDataURL('image/png');
        });

        const templatesToRender: TemplateType[] = [
          'strip', 'double-strip', 'polaroid', 'polaroid-wide', 'grid', 'duo', 'cinematic', 'purikura',
          'vintage-silver', 'sprocket-roll', 'directors-cut', 'neo-noir', 'comic', 'magazine', 'ticket',
          'golden-polaroid', 'cyber-glitch', 'grunge-collage', 'gallery', 'passport', 'wedding',
          'neon-wave', 'editorial', 'marquee'
        ];

        const previewCache: Record<string, string> = {};

        // Render in background chunked to avoid long synchronous frame locks
        for (const temp of templatesToRender) {
          try {
            const previewUrl = await renderTemplatePreview({
              photos: mockPhotoDataUrls,
              template: temp,
              captionText: `${temp.replace('-', ' ').toUpperCase()}`
            });
            previewCache[temp] = previewUrl;
          } catch (err) {
            console.warn(`Mount render warning [${temp}]:`, err);
          }
        }
        setGeneratedPreviews(previewCache);
      } catch (err) {
        console.error('Mount pre-render pipeline error:', err);
      }
    };
    
    // Defer slightly for smooth load
    const timeout = setTimeout(preRenderAll, 200);
    return () => clearTimeout(timeout);
  }, []);
  
  // Custom Filters & Effects Settings
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    vignette: 15,
    grain: 10,
    lightLeak: 'none',
  });

  // Borders, Captions & Font Customizations
  const [borderId, setBorderId] = useState<string>('white');
  const [caption, setCaption] = useState<string>('');
  const [captionFont, setCaptionFont] = useState<string>('display');
  const [captionColor, setCaptionColor] = useState<string>('#12141C');

  // Custom Background and Theme customizer
  const [frameThemeId, setFrameThemeId] = useState<string>('none');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [customBgOpacity, setCustomBgOpacity] = useState<number>(100);
  const [customBgScale, setCustomBgScale] = useState<number>(100);
  const [customBgTiling, setCustomBgTiling] = useState<'cover' | 'contain' | 'repeat'>('cover');

  // Interactive Stamp Stickers State
  const [stickers, setStickers] = useState<Sticker[]>([]);

  // Picture Holder Frame Strokes State
  const [pictureFrameStroke, setPictureFrameStroke] = useState<string>('none');

  // PWA & Service Worker Update States
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [showPwaInstallBanner, setShowPwaInstallBanner] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('');

  // Service Worker registration & PWA Install Prompt Handler
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          setSwRegistration(registration);

          // Periodically check for updates
          setInterval(() => {
            registration.update();
          }, 60 * 1000); // Check every minute silently

          // Listen for update events
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaInstallBanner(true);
    });
  }, []);

  const handleCheckUpdate = () => {
    if (swRegistration) {
      setUpdateStatus('Checking for updates...');
      swRegistration.update()
        .then((reg) => {
          if (reg && reg.installing === null && reg.waiting === null && reg.active) {
            setUpdateStatus('App is up to date!');
          } else {
            setUpdateStatus('Checking complete.');
          }
          setTimeout(() => setUpdateStatus(''), 3000);
        })
        .catch((err) => {
          setUpdateStatus('Check failed.');
          setTimeout(() => setUpdateStatus(''), 3000);
          console.error('Error checking for update:', err);
        });
    } else {
      setUpdateStatus('Service Worker inactive.');
      setTimeout(() => setUpdateStatus(''), 3000);
    }
  };

  const handleForceRefresh = async () => {
    setUpdateStatus('Performing force recovery...');
    // Stop SW
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    // Clear caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }
    setUpdateStatus('Caches wiped. Reloading!');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const triggerPwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the PWA install prompt');
        }
        setDeferredPrompt(null);
        setShowPwaInstallBanner(false);
      });
    }
  };

  const acceptNormalUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ action: 'skipWaiting' });
    } else {
      window.location.reload();
    }
  };

  // Derived settings
  const getRequiredPhotosCount = (): number => {
    switch (selectedTemplate) {
      case 'polaroid':
      case 'polaroid-wide':
      case 'neo-noir':
      case 'magazine':
      case 'golden-polaroid':
      case 'passport':
      case 'editorial':
        return 1;
      case 'duo':
      case 'cyber-glitch':
      case 'gallery':
        return 2;
      case 'cinematic':
      case 'sprocket-roll':
      case 'directors-cut':
      case 'comic':
      case 'wedding':
      case 'marquee':
        return 3;
      case 'strip':
      case 'double-strip':
      case 'grid':
      case 'purikura':
      case 'vintage-silver':
      case 'ticket':
      case 'grunge-collage':
      default:
        return 4;
    }
  };

  // State Resets
  const handleFullReset = () => {
    setPhotos([]);
    setBtsVideoBlobUrl(null);
    setSelectedFilter('none');
    setFilterSettings({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      vignette: 15,
      grain: 10,
      lightLeak: 'none',
    });
    setStickers([]);
    setCaption('');
    setCaptionFont('display');
    setCaptionColor('#12141C');
    setBorderId('white');
    setFrameThemeId('none');
    setCustomBgImage(null);
    setCustomBgOpacity(100);
    setCustomBgScale(100);
    setCustomBgTiling('cover');
    setStep(0);
  };

  const handlePhotosCaptured = (capturedPhotos: string[], videoUrl: string | null) => {
    setPhotos(capturedPhotos);
    setBtsVideoBlobUrl(videoUrl);
    
    // Automatically match appropriate contrast/caption colors based on layout choice
    if (borderId === 'black' || borderId === 'neon') {
      setCaptionColor('#FFFFFF');
    } else {
      setCaptionColor('#12141C');
    }
    
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-razel-dark text-white font-sans flex flex-col justify-between">
      
      {/* Header element */}
      {step > 0 && (
        <Header 
          currentStep={step} 
          onReset={handleFullReset} 
          onSetStep={setStep}
          hasPhotos={photos.length > 0}
          isLocked={isNavigationLocked}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-6">
        
        {step === 0 && (
          <WelcomeView 
            onStart={() => setStep(1)} 
            generatedPreviews={generatedPreviews} 
            deferredPrompt={deferredPrompt}
            onInstall={triggerPwaInstall}
          />
        )}

        {step === 1 && (
          <LayoutSelector
            selectedTemplate={selectedTemplate}
            generatedPreviews={generatedPreviews}
            onChangeTemplate={(t) => {
              setSelectedTemplate(t);
              // Setup custom defaults based on layout type
              if (t === 'polaroid') {
                setCaptionFont('handwriting');
                setBorderId('aged-polaroid');
                setCaptionColor('#52525b');
              } else if (t === 'purikura') {
                setCaptionFont('handwriting');
                setBorderId('pink');
                setCaptionColor('#db2777'); // deep cherry pink
              } else if (t === 'neo-noir' || t === 'directors-cut') {
                setCaptionFont('mono');
                setBorderId('black');
                setCaptionColor('#ffffff');
              } else if (t === 'vintage-silver') {
                setCaptionFont('serif');
                setBorderId('aged-polaroid');
                setCaptionColor('#27272a');
              } else if (t === 'sprocket-roll') {
                setCaptionFont('mono');
                setBorderId('sprocket');
                setCaptionColor('#ffffff');
              } else if (t === 'cinematic') {
                setCaptionFont('serif');
                setBorderId('black');
                setCaptionColor('#ffffff');
              } else if (t === 'neon-wave') {
                setCaptionFont('display');
                setBorderId('neon');
                setCaptionColor('#FF2E54');
              } else if (t === 'editorial') {
                setCaptionFont('serif');
                setBorderId('white');
                setCaptionColor('#12141C');
              } else if (t === 'marquee') {
                setCaptionFont('mono');
                setBorderId('gilded-museum');
                setCaptionColor('#C5A059');
              } else {
                setCaptionFont('display');
                setBorderId('white');
                setCaptionColor('#12141C');
              }
            }}
            onProceed={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <CameraView
            requiredPhotosCount={getRequiredPhotosCount()}
            selectedTemplate={selectedTemplate}
            onPhotosCaptured={handlePhotosCaptured}
            onBack={() => setStep(1)}
            onLockChange={setIsNavigationLocked}
          />
        )}

        {step === 3 && (
          <CustomizePanel
            photos={photos}
            onUpdatePhotos={setPhotos}
            template={selectedTemplate}
            filter={selectedFilter}
            onChangeFilter={setSelectedFilter}
            filterSettings={filterSettings}
            onChangeFilterSettings={setFilterSettings}
            stickers={stickers}
            onUpdateStickers={setStickers}
            caption={caption}
            onChangeCaption={setCaption}
            captionFont={captionFont}
            onChangeCaptionFont={setCaptionFont}
            captionColor={captionColor}
            onChangeCaptionColor={setCaptionColor}
            borderId={borderId}
            onChangeBorderId={(id) => {
              setBorderId(id);
              // Smart theme color adjustment: auto change text color
              if (id === 'black' || id === 'neon') {
                setCaptionColor('#FFFFFF');
              } else if (id === 'cream') {
                setCaptionColor('#451A03'); // deep brown
              } else {
                setCaptionColor('#12141C');
              }
            }}
            frameThemeId={frameThemeId}
            onChangeFrameThemeId={setFrameThemeId}
            customBgImage={customBgImage}
            onChangeCustomBgImage={setCustomBgImage}
            customBgOpacity={customBgOpacity}
            onChangeCustomBgOpacity={setCustomBgOpacity}
            customBgScale={customBgScale}
            onChangeCustomBgScale={setCustomBgScale}
            customBgTiling={customBgTiling}
            onChangeCustomBgTiling={setCustomBgTiling}
            pictureFrameStroke={pictureFrameStroke}
            onChangePictureFrameStroke={setPictureFrameStroke}
            onProceed={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <ExportPanel
            photos={photos}
            template={selectedTemplate}
            filter={selectedFilter}
            filterSettings={filterSettings}
            stickers={stickers}
            caption={caption}
            captionFont={captionFont}
            captionColor={captionColor}
            borderId={borderId}
            videoBlobUrl={btsVideoBlobUrl}
            frameThemeId={frameThemeId}
            customBgImage={customBgImage}
            customBgOpacity={customBgOpacity}
            customBgScale={customBgScale}
            customBgTiling={customBgTiling}
            pictureFrameStroke={pictureFrameStroke}
            onReset={handleFullReset}
          />
        )}

      </main>

      {/* Diagnostics & Test Cases Panel (Hidden as requested) */}
      {false && (
        <TestCasesPanel
          currentStep={step}
          selectedTemplate={selectedTemplate}
          onInjectMockPhotos={(mockPhotos) => {
            setPhotos(mockPhotos);
            // Auto generate a dummy BTS URL for custom background loop tests
            setBtsVideoBlobUrl('mock-bts-loop-video-url');
          }}
          onSetStep={setStep}
          onSetTemplate={setSelectedTemplate}
          onReset={handleFullReset}
          onSaveAllPreviews={setGeneratedPreviews}
        />
      )}

      {/* PWA Floating Update Available Notification */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-razel-card border border-razel-neon/40 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-razel-neon/15 flex items-center justify-center text-razel-neon shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-snug">New Update Available!</h4>
              <p className="text-[10px] text-white/50 leading-relaxed mt-0.5">A fresh version of DigiSmile is ready for your capture studio.</p>
            </div>
          </div>
          <button 
            onClick={acceptNormalUpdate}
            className="px-3.5 py-1.5 rounded-lg bg-razel-neon hover:bg-razel-neon/90 text-white font-display font-extrabold text-xs tracking-wider uppercase shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            Update App
          </button>
        </div>
      )}

      {/* PWA Floating Install Banner */}
      {showPwaInstallBanner && deferredPrompt && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-razel-card border border-white/10 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white leading-snug">Install DigiSmile App</h4>
              <p className="text-[10px] text-white/50 leading-normal mt-0.5">Add to your home screen for rapid offline photo sessions.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setShowPwaInstallBanner(false)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold cursor-pointer transition-colors"
            >
              Dismiss
            </button>
            <button 
              onClick={triggerPwaInstall}
              className="px-3 py-1.5 rounded-lg bg-razel-neon hover:bg-razel-neon/90 text-white font-display font-extrabold text-[10px] tracking-wider uppercase transition-transform hover:scale-105 cursor-pointer"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* Footer Branding element */}
      <footer className="w-full max-w-5xl mx-auto mt-12 py-6 px-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[11px] text-white/30 gap-4">
        <div className="text-center md:text-left">
          <p>© 2026 DigiSmile Photobooth Studio. All rights reserved.</p>
          <p className="mt-0.5">Custom layout rendering engine licensed under Apache-2.0.</p>
        </div>

        {/* PWA Separation controls in footer */}
        <div className="flex flex-col items-center gap-1.5 font-mono">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCheckUpdate}
              className="hover:text-razel-neon transition-colors cursor-pointer border border-white/5 bg-white/5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              title="Query the Service Worker to fetch files and check for a new version"
            >
              Check Update
            </button>
            <span className="text-white/10">|</span>
            <button 
              onClick={handleForceRefresh}
              className="hover:text-red-400 transition-colors cursor-pointer border border-white/5 bg-white/5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              title="Wipe service workers, delete caches, and force reload"
            >
              Force Refresh
            </button>
          </div>
          {updateStatus && (
            <span className="text-[10px] text-razel-neon/80 font-bold tracking-wide animate-pulse">
              ● {updateStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span>Engineered with precision by</span>
          <a 
            href="#" 
            className="font-bold text-white/50 hover:text-razel-neon transition-colors tracking-widest uppercase"
          >
            Razel Tech
          </a>
        </div>
      </footer>

    </div>
  );
}
