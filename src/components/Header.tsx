/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Camera, Layers, Zap } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  onReset: () => void;
  onSetStep?: (step: number) => void;
  hasPhotos?: boolean;
  isLocked?: boolean;
}

export default function Header({ currentStep, onReset, onSetStep, hasPhotos = false, isLocked = false }: HeaderProps) {
  return (
    <header className="w-full max-w-5xl mx-auto mb-6 px-4 py-4 flex flex-col md:flex-row items-center justify-between border-b border-white/10 gap-4">
      <div 
        className={`flex items-center gap-3 group ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        onClick={() => !isLocked && onReset()}
        id="btn-header-home"
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.35)] border border-white/10 transition-transform duration-300 group-hover:rotate-12">
          <img src="logo.png" alt="DigiSmile Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-white flex items-center gap-2">
            Digi<span className="text-razel-neon">Smile</span>
            <span className="text-[10px] font-mono font-bold bg-razel-neon/10 border border-razel-neon/20 text-razel-neon px-1.5 py-0.5 rounded uppercase tracking-wider">V3 Pro</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono font-semibold">
            by Razel Tech
          </p>
        </div>
      </div>

      {/* Stepper display */}
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-none">
        {[
          { step: 1, label: 'Layout', enabled: true },
          { step: 2, label: 'Capture', enabled: true },
          { step: 3, label: 'Customize', enabled: hasPhotos },
          { step: 4, label: 'Share', enabled: hasPhotos },
        ].map((item) => {
          const isActive = currentStep === item.step;
          const isCompleted = currentStep > item.step;
          const isClickable = onSetStep && item.enabled && !isActive && !isLocked;

          return (
            <div 
              key={item.step} 
              className={`flex items-center gap-2 shrink-0 ${isClickable ? 'cursor-pointer hover:opacity-85 group/step' : isLocked ? 'cursor-not-allowed opacity-50' : 'opacity-70'}`}
              onClick={() => isClickable && onSetStep(item.step)}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-razel-neon text-white shadow-[0_0_10px_var(--color-razel-neon-glow)] scale-110'
                    : isCompleted
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/40 border border-white/5'
                } ${isClickable ? 'group-hover/step:border-razel-neon/40' : ''}`}
              >
                {item.step}
              </div>
              <span
                className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-white/40'
                } ${isClickable ? 'group-hover/step:text-white/80' : ''}`}
              >
                {item.label}
              </span>
              {item.step < 4 && <div className="w-4 h-[1px] bg-white/10" />}
            </div>
          );
        })}
      </div>

      <div className="hidden md:flex items-center gap-2 text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-mono text-white/70">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>V4.2 • ULTRA_LATENCY_OFFLINE</span>
      </div>
    </header>
  );
}
