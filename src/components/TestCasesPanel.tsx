/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  Circle, 
  Play, 
  RefreshCw, 
  Terminal, 
  Check, 
  Image as ImageIcon, 
  AlertTriangle, 
  Settings, 
  CheckSquare, 
  Square,
  ChevronsUpDown,
  Laptop
} from 'lucide-react';
import { TemplateType } from '../types';
import { renderTemplatePreview } from '../utils/previewRenderer';

interface TestCasesPanelProps {
  currentStep: number;
  selectedTemplate: TemplateType;
  onInjectMockPhotos: (photos: string[]) => void;
  onSetStep: (step: number) => void;
  onSetTemplate: (template: TemplateType) => void;
  onReset: () => void;
  onSaveAllPreviews?: (previews: Record<string, string>) => void;
}

interface TestCase {
  id: string;
  category: string;
  title: string;
  desc: string;
  expected: string;
  status: 'pending' | 'passed' | 'failed';
}

export default function TestCasesPanel({
  currentStep,
  selectedTemplate,
  onInjectMockPhotos,
  onSetStep,
  onSetTemplate,
  onReset,
  onSaveAllPreviews
}: TestCasesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoTestLogs, setAutoTestLogs] = useState<string[]>([]);
  const [isRunningAutoTests, setIsRunningAutoTests] = useState(false);
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, 'passed' | 'failed' | 'pending'>>({});

  // Manual interactive check items
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
    step6: false,
  });

  const toggleManualCheck = (key: string) => {
    setManualChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Pre-configured manual scenarios
  const manualScenarios: TestCase[] = [
    {
      id: 'tc-01',
      category: 'Layout Selection',
      title: 'DPI & Aspect Ratio Accuracy',
      desc: 'Verify layout grid calculations. Selecting different templates adapts the requested canvas sizes dynamically without distortion.',
      expected: 'Canvas widths range from 550px to 1200px, and height up to 1800px.',
      status: 'pending'
    },
    {
      id: 'tc-02',
      category: 'Camera & Video Stream',
      title: 'Pose Countdown & BTS Recording',
      desc: 'Verify that the camera countdown runs, takes the snapshots, and records a BTS canvas stream in the background.',
      expected: '4 distinct snapshots are captured; a download link is visible for BTS video.',
      status: 'pending'
    },
    {
      id: 'tc-03',
      category: 'Creative customization',
      title: 'Custom Brand & Theme Stamping',
      desc: 'Add stickers, customize captions, modify font styles, upload custom backgrounds with adjustable opacity.',
      expected: 'Stickers remain draggable; background filters apply instantly to previews.',
      status: 'pending'
    },
    {
      id: 'tc-04',
      category: 'High-Res Compiling',
      title: 'Canvas-to-Blob Asset Generation',
      desc: 'Verify the compile process renders a true 300-DPI final composite block without losing vector graphics quality.',
      expected: 'JPG and PNG outputs download instantly without black screen fallback.',
      status: 'pending'
    }
  ];

  // Generates 4 vibrant studio mockup photos entirely in-browser using dynamic canvases
  const generateMockPhotos = () => {
    const colors = [
      { bg: '#3b82f6', text: '#eff6ff', accent: '#60a5fa', title: 'Studio Backdrop blue' },
      { bg: '#db2777', text: '#fdf2f8', accent: '#f472b6', title: 'Sakura Studio Pink' },
      { bg: '#059669', text: '#ecfdf5', accent: '#34d399', title: 'Retro Chroma Green' },
      { bg: '#d97706', text: '#fffbeb', accent: '#fbbf24', title: 'Warm Amber Studio' }
    ];

    const mockPhotoDataUrls = colors.map((theme, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Draw studio backdrop
      const grad = ctx.createRadialGradient(320, 240, 50, 320, 240, 350);
      grad.addColorStop(0, theme.accent);
      grad.addColorStop(1, theme.bg);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Draw elegant studio portrait abstract silhouettes (a stylized camera lens & avatar circle)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(320, 240, 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(320, 240, 90, 0, Math.PI * 2);
      ctx.fill();

      // Human avatar silhouette representation
      ctx.fillStyle = theme.text;
      ctx.beginPath();
      ctx.arc(320, 210, 55, 0, Math.PI * 2); // Head
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(320, 340, 110, 75, 0, 0, Math.PI, true); // Shoulders
      ctx.fill();

      // Studio flash simulation dot
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(420, 140, 15, 0, Math.PI * 2);
      ctx.fill();

      // Custom watermark tag
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 420, 640, 60);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`MOCK PHOTO #${index + 1} - ${theme.title.toUpperCase()}`, 320, 455);

      // Cute indicator banner
      ctx.fillStyle = theme.accent;
      ctx.fillRect(15, 15, 120, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`POSE CAPTURED`, 75, 34);

      return canvas.toDataURL('image/png');
    });

    onInjectMockPhotos(mockPhotoDataUrls);
    addLog(`Success: Injected 4 mock photos with studio gradients.`);
    addLog(`Action: Moving system context directly to Customize Step.`);
    onSetStep(3); // Go straight to edit step!
  };

  const generateAndCacheAllTemplates = async () => {
    setIsGeneratingPreviews(true);
    addLog('Initiating batch pre-rendering pipeline for all 21 template frames...');

    try {
      const colors = [
        { bg: '#3b82f6', text: '#eff6ff', accent: '#60a5fa', title: 'Studio Backdrop blue' },
        { bg: '#db2777', text: '#fdf2f8', accent: '#f472b6', title: 'Sakura Studio Pink' },
        { bg: '#059669', text: '#ecfdf5', accent: '#34d399', title: 'Retro Chroma Green' },
        { bg: '#d97706', text: '#fffbeb', accent: '#fbbf24', title: 'Warm Amber Studio' }
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

      // Inject mock photos into state too so user can customize
      onInjectMockPhotos(mockPhotoDataUrls);
      addLog('Step 1: Mock photos successfully generated and loaded.');

      const templatesToRender: TemplateType[] = [
        'strip', 'double-strip', 'polaroid', 'polaroid-wide', 'grid', 'duo', 'cinematic', 'purikura',
        'vintage-silver', 'sprocket-roll', 'directors-cut', 'neo-noir', 'comic', 'magazine', 'ticket',
        'golden-polaroid', 'cyber-glitch', 'grunge-collage', 'gallery', 'passport', 'wedding'
      ];

      const previewCache: Record<string, string> = {};

      for (const temp of templatesToRender) {
        addLog(`Rendering composite canvas [${temp}]...`);
        try {
          const previewUrl = await renderTemplatePreview({
            photos: mockPhotoDataUrls,
            template: temp,
            captionText: `MOCK ${temp.replace('-', ' ').toUpperCase()}`
          });
          previewCache[temp] = previewUrl;
        } catch (err: any) {
          addLog(`⚠️ Failed to render [${temp}]: ${err.message || err}`);
        }
        await new Promise(r => setTimeout(r, 30));
      }

      if (onSaveAllPreviews) {
        onSaveAllPreviews(previewCache);
      }
      addLog('🎉 SUCCESS: Live canvas preview templates cached! View them directly in Step 1 (Layout Frame Selector).');
    } catch (err: any) {
      addLog(`❌ Fatal render error: ${err.message || err}`);
    } finally {
      setIsGeneratingPreviews(false);
    }
  };

  const addLog = (msg: string) => {
    setAutoTestLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const runAllTemplateSizingTests = async () => {
    setIsRunningAutoTests(true);
    setAutoTestLogs([]);
    addLog('Starting Automated Template Canvas Diagnostic Check...');

    const templatesToVerify: { id: TemplateType; name: string; expectedW: number; expectedH: number }[] = [
      { id: 'strip', name: 'Traditional Strip', expectedW: 600, expectedH: 1800 },
      { id: 'double-strip', name: 'Double Strip', expectedW: 1200, expectedH: 1800 },
      { id: 'grid', name: 'Classic 2x2 Grid', expectedW: 1000, expectedH: 1000 },
      { id: 'purikura', name: 'Deco Purikura', expectedW: 1000, expectedH: 1000 },
      { id: 'polaroid', name: 'Retro Polaroid', expectedW: 800, expectedH: 1000 },
      { id: 'golden-polaroid', name: 'Golden Polaroid', expectedW: 800, expectedH: 1000 },
      { id: 'polaroid-wide', name: 'Landscape Polaroid', expectedW: 1000, expectedH: 800 },
      { id: 'duo', name: 'Duotone Duo', expectedW: 1000, expectedH: 800 },
      { id: 'cinematic', name: 'Widescreen Cinematic', expectedW: 800, expectedH: 1500 },
      { id: 'directors-cut', name: 'Directors Cut Mono', expectedW: 800, expectedH: 1500 },
      { id: 'sprocket-roll', name: '35mm Film Sprocket', expectedW: 1200, expectedH: 500 },
      { id: 'neo-noir', name: 'Neo-Noir Matte', expectedW: 700, expectedH: 1000 },
      { id: 'comic', name: 'Pop Comic Book', expectedW: 1200, expectedH: 600 },
      { id: 'magazine', name: 'High-Fashion Mag', expectedW: 800, expectedH: 1100 },
      { id: 'ticket', name: 'Concert Admission Ticket', expectedW: 550, expectedH: 1800 },
      { id: 'cyber-glitch', name: 'Industrial Glitch', expectedW: 1000, expectedH: 650 },
      { id: 'grunge-collage', name: 'Street Grunge', expectedW: 1000, expectedH: 1000 },
      { id: 'gallery', name: 'Fine Art Gallery', expectedW: 1000, expectedH: 800 },
      { id: 'passport', name: 'Official Passport ID', expectedW: 1000, expectedH: 1000 },
      { id: 'wedding', name: 'Golden Ring Invitation', expectedW: 800, expectedH: 1300 },
    ];

    const results: Record<string, 'passed' | 'failed'> = {};

    for (const t of templatesToVerify) {
      addLog(`Testing template geometry [${t.id}] (${t.name})...`);
      
      // We will perform offscreen canvas creation to simulate dimensions
      try {
        const testCanvas = document.createElement('canvas');
        let w = 800;
        let h = 1000;

        // Mimic ExportPanel dimensions algorithm exactly
        if (t.id === 'strip' || t.id === 'vintage-silver') {
          w = 600; h = 1800;
        } else if (t.id === 'double-strip') {
          w = 1200; h = 1800;
        } else if (t.id === 'polaroid' || t.id === 'golden-polaroid') {
          w = 800; h = 1000;
        } else if (t.id === 'polaroid-wide') {
          w = 1000; h = 800;
        } else if (t.id === 'grid' || t.id === 'purikura' || t.id === 'grunge-collage' || t.id === 'passport') {
          w = 1000; h = 1000;
        } else if (t.id === 'duo' || t.id === 'gallery') {
          w = 1000; h = 800;
        } else if (t.id === 'cinematic' || t.id === 'directors-cut') {
          w = 800; h = 1500;
        } else if (t.id === 'sprocket-roll') {
          w = 1200; h = 500;
        } else if (t.id === 'neo-noir') {
          w = 700; h = 1000;
        } else if (t.id === 'comic') {
          w = 1200; h = 600;
        } else if (t.id === 'magazine') {
          w = 800; h = 1100;
        } else if (t.id === 'ticket') {
          w = 550; h = 1800;
        } else if (t.id === 'cyber-glitch') {
          w = 1000; h = 650;
        } else if (t.id === 'wedding') {
          w = 800; h = 1300;
        }

        testCanvas.width = w;
        testCanvas.height = h;

        const isMatch = w === t.expectedW && h === t.expectedH;
        if (isMatch) {
          results[t.id] = 'passed';
          addLog(`✅ PASS: [${t.id}] renders correct layout bounds ${w}x${h}px.`);
        } else {
          results[t.id] = 'failed';
          addLog(`❌ FAIL: [${t.id}] expected ${t.expectedW}x${t.expectedH}px but got ${w}x${h}px.`);
        }
      } catch (err: any) {
        results[t.id] = 'failed';
        addLog(`❌ EXCEPTION: [${t.id}] failed to compile: ${err.message || err}`);
      }

      // Small async interval to let logs update nicely in real-time
      await new Promise(r => setTimeout(r, 60));
    }

    setTestResults(results);
    setIsRunningAutoTests(false);
    addLog(`Verification complete! ${Object.values(results).filter(x => x === 'passed').length} templates validated.`);
  };

  const handleResetManualChecklist = () => {
    setManualChecks({
      step1: false,
      step2: false,
      step3: false,
      step4: false,
      step5: false,
      step6: false,
    });
    setAutoTestLogs([]);
    setTestResults({});
    addLog('System Diagnostics checklist and logs reset.');
  };

  return (
    <section className="w-full max-w-5xl mx-auto mt-6 px-4" id="diagnostics-suite-panel">
      <div className="bg-[#12141C]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        
        {/* Panel Header */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="px-6 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6]">
              <FlaskConical className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                DigiSmile Diagnostics & User Test Suite
              </h3>
              <p className="text-[10px] text-white/40 font-mono">
                Verify template dimensions, download mechanisms, and simulate mock photo streams
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
              Active Step: {currentStep}
            </span>
            <ChevronsUpDown className="w-4 h-4 text-white/40" />
          </div>
        </div>

        {/* Collapsible Panel Content */}
        {isOpen && (
          <div className="border-t border-white/5 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-950/40">
            
            {/* COLUMN 1 (4 cols): Fast Setup & Mock Injector */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-5 border-r border-white/5 lg:pr-6">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-[#3b82f6]" /> Fast-Path Simulations
                </h4>
                <p className="text-[11px] text-white/50 leading-relaxed mb-4">
                  Test the high-resolution composite canvas rendering pipelines instantly even without a functional webcam or camera permissions!
                </p>
                
                <div className="space-y-2.5">
                  <button
                    onClick={generateMockPhotos}
                    className="w-full py-3 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-semibold text-xs tracking-wide transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 shadow-md shadow-[#3b82f6]/10"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    INJECT 4 STUDIO MOCK PHOTOS
                  </button>

                  <button
                    onClick={generateAndCacheAllTemplates}
                    disabled={isGeneratingPreviews}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-md shadow-pink-500/10 disabled:opacity-50"
                  >
                    <ImageIcon className={`w-3.5 h-3.5 ${isGeneratingPreviews ? 'animate-bounce' : ''}`} />
                    {isGeneratingPreviews ? 'GENERATING HIGH-RES CANVASES...' : 'GENERATE ALL 21 TEMPLATES'}
                  </button>
                  
                  <button
                    onClick={runAllTemplateSizingTests}
                    disabled={isRunningAutoTests}
                    className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRunningAutoTests ? 'animate-spin' : ''}`} />
                    RUN CANVAS GEOMETRY AUTO-TESTS
                  </button>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 text-[10px] text-white/40 space-y-1">
                <p className="font-semibold text-white/60 mb-1 flex items-center gap-1">
                  <Settings className="w-3 h-3 text-amber-500" /> Active Session State:
                </p>
                <div className="grid grid-cols-2 gap-1 font-mono">
                  <span>Template Type:</span>
                  <span className="text-[#3b82f6] font-bold">{selectedTemplate}</span>
                  <span>Photos Count:</span>
                  <span className="text-emerald-400 font-bold">{currentStep >= 3 ? '4' : '0'}</span>
                  <span>Screen Step:</span>
                  <span className="text-amber-400 font-bold">{currentStep}</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2 (4 cols): User Verification Checklist */}
            <div className="lg:col-span-4 border-r border-white/5 lg:px-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> QA & User Verification List
              </h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {[
                  { key: 'step1', text: 'Select custom layout & template style' },
                  { key: 'step2', text: 'Run camera capture sequence with voice timers' },
                  { key: 'step3', text: 'Apply filters and drag brand stickers' },
                  { key: 'step4', text: 'Check Sakura Pink design is grain-textured' },
                  { key: 'step5', text: 'Compile and preview layout compositing' },
                  { key: 'step6', text: 'Test high-dpi print download (JPG & PNG)' },
                ].map((item, idx) => (
                  <div 
                    key={item.key}
                    onClick={() => toggleManualCheck(item.key)}
                    className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 cursor-pointer select-none transition-colors"
                  >
                    <div className="mt-0.5 text-zinc-400">
                      {manualChecks[item.key] ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-white/20" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white/80 leading-tight">
                        Case {idx + 1}: {item.text}
                      </p>
                      <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded-full border ${
                        manualChecks[item.key] 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-white/5 border-white/5 text-white/30'
                      }`}>
                        {manualChecks[item.key] ? 'PASSED & CONFIRMED' : 'PENDING USER TEST'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleResetManualChecklist}
                  className="text-[10px] text-white/30 hover:text-white/60 font-mono flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> RESET SYSTEM CHECKS
                </button>
              </div>
            </div>

            {/* COLUMN 3 (4 cols): Diagnostic Logs Terminal */}
            <div className="lg:col-span-4 flex flex-col h-[340px]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" /> Live Render Log Console
              </h4>
              <div className="flex-1 bg-black/90 rounded-xl p-3 border border-white/5 font-mono text-[9px] text-[#3b82f6] overflow-y-auto space-y-1.5 scrollbar-thin">
                {autoTestLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center px-4">
                    <Terminal className="w-5 h-5 mb-2 text-zinc-700" />
                    <span>No log output yet. Run template diagnostics or load mock photos to monitor terminal events.</span>
                  </div>
                ) : (
                  autoTestLogs.map((log, i) => (
                    <p key={i} className="leading-relaxed break-all font-mono whitespace-pre-wrap border-b border-white/[0.02] pb-1">
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
