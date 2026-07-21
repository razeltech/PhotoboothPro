/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Image, 
  Layers, 
  Film, 
  Smile, 
  Tv, 
  Gamepad, 
  Clapperboard, 
  Heart, 
  Camera, 
  Brush, 
  Scissors, 
  Award, 
  Compass,
  FileText,
  Bookmark,
  Calendar,
  Grid,
  Sun
} from 'lucide-react';
import { TemplateType } from '../types';

interface LayoutSelectorProps {
  selectedTemplate: TemplateType;
  onChangeTemplate: (template: TemplateType) => void;
  onProceed: () => void;
  generatedPreviews?: Record<string, string>;
}

interface LayoutItem {
  id: TemplateType;
  title: string;
  description: string;
  photoCount: number;
  icon: React.ReactNode;
  previewLayout: React.ReactNode;
}

export default function LayoutSelector({
  selectedTemplate,
  onChangeTemplate,
  onProceed,
  generatedPreviews,
}: LayoutSelectorProps) {
  const layouts: LayoutItem[] = [
    {
      id: 'strip',
      title: 'Classic Vertical Strip',
      description: 'Traditional 4-pose vertical ticket strip (2" x 6")',
      photoCount: 4,
      icon: <Layers className="w-5 h-5 text-razel-neon" />,
      previewLayout: (
        <div className="w-[52px] h-[120px] bg-white border border-zinc-200 rounded p-1 flex flex-col gap-[3px] shadow-sm relative overflow-hidden select-none">
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="flex-1 flex flex-col items-center justify-center gap-0.5 mt-0.5">
            <span className="text-[5px] font-display font-extrabold text-zinc-800 scale-90 leading-none">AERO</span>
            <span className="text-[3px] font-mono font-bold text-zinc-400 scale-75 leading-none">2026</span>
          </div>
        </div>
      ),
    },
    {
      id: 'double-strip',
      title: 'Classic Double Strip',
      description: 'Twin arcade print: Two identical vertical strips printed side-by-side with a dash cut line',
      photoCount: 4,
      icon: <Film className="w-5 h-5 text-indigo-400" />,
      previewLayout: (
        <div className="w-[100px] h-[120px] bg-white border border-zinc-200 rounded p-1 flex gap-1 shadow-sm justify-between relative overflow-hidden select-none">
          {/* Left strip */}
          <div className="w-[45%] h-full flex flex-col gap-[3px]">
            <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
            <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
            <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
            <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
            <div className="flex-1 flex items-center justify-center"><span className="text-[4px] font-display font-extrabold text-zinc-800 scale-75 leading-none">AERO</span></div>
          </div>
          {/* Perforation line */}
          <div className="w-[2px] border-l border-dashed border-zinc-300 h-full" />
          {/* Right strip */}
          <div className="w-[45%] h-full flex flex-col gap-[3px]">
            <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
            <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
            <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
            <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
            <div className="flex-1 flex items-center justify-center"><span className="text-[4px] font-display font-extrabold text-zinc-800 scale-75 leading-none">AERO</span></div>
          </div>
        </div>
      ),
    },
    {
      id: 'grid',
      title: '2x2 Postcard Grid',
      description: 'Chic 4-pose grid card layout (4" x 6" landscape postcard style)',
      photoCount: 4,
      icon: <LayoutGrid className="w-5 h-5 text-emerald-400" />,
      previewLayout: (
        <div className="w-[100px] h-[100px] bg-white border border-zinc-200 rounded p-1.5 grid grid-cols-2 grid-rows-2 gap-1.5 shadow-sm select-none">
          <div className="bg-zinc-900 border border-black/10 rounded-[2px] aspect-square" />
          <div className="bg-zinc-900 border border-black/10 rounded-[2px] aspect-square" />
          <div className="bg-zinc-900 border border-black/10 rounded-[2px] aspect-square" />
          <div className="bg-zinc-900 border border-black/10 rounded-[2px] aspect-square" />
        </div>
      ),
    },
    {
      id: 'polaroid',
      title: 'Nostalgic Polaroid',
      description: 'Single square polaroid with classic signature handwritten bottom margin',
      photoCount: 1,
      icon: <Image className="w-5 h-5 text-amber-400" />,
      previewLayout: (
        <div className="w-[90px] h-[108px] bg-[#FBF9F3] border border-zinc-200/50 rounded-sm p-1.5 flex flex-col gap-2 shadow-sm select-none">
          <div className="w-full aspect-square bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[7px] font-handwriting font-bold text-zinc-600 tracking-wide rotate-[-2deg] leading-none">polaroid</span>
          </div>
        </div>
      ),
    },
    {
      id: 'polaroid-wide',
      title: 'Nostalgic Wide Polaroid',
      description: 'Widescreen landscape retro instant polaroid format (4" x 3")',
      photoCount: 1,
      icon: <Image className="w-5 h-5 text-yellow-500" />,
      previewLayout: (
        <div className="w-[110px] h-[92px] bg-[#FBF9F3] border border-zinc-200/50 rounded-sm p-1.5 flex flex-col gap-1.5 shadow-sm select-none">
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[7px] font-handwriting font-bold text-zinc-600 tracking-wide leading-none">wide shot</span>
          </div>
        </div>
      ),
    },
    {
      id: 'duo',
      title: 'Double Portrait Duo',
      description: 'Clean side-by-side vertical pair layout with aesthetic negative space',
      photoCount: 2,
      icon: <Layers className="w-5 h-5 text-sky-400" />,
      previewLayout: (
        <div className="w-[110px] h-[88px] bg-white border border-zinc-200 rounded p-1.5 flex gap-1.5 shadow-sm justify-between select-none">
          <div className="w-[48%] h-full bg-zinc-900 border border-black/10 rounded-sm" />
          <div className="w-[48%] h-full bg-zinc-900 border border-black/10 rounded-sm" />
        </div>
      ),
    },
    {
      id: 'cinematic',
      title: 'Cinematic Wide Stack',
      description: 'Three widescreen 16:9 cinematic movie panels in a tall dark column',
      photoCount: 3,
      icon: <Film className="w-5 h-5 text-purple-400" />,
      previewLayout: (
        <div className="w-[85px] h-[115px] bg-zinc-950 border border-white/5 rounded p-1 flex flex-col gap-1.5 shadow-md select-none">
          <div className="w-full aspect-[16/7] bg-zinc-900 border border-white/5 rounded-sm" />
          <div className="w-full aspect-[16/7] bg-zinc-900 border border-white/5 rounded-sm" />
          <div className="w-full aspect-[16/7] bg-zinc-900 border border-white/5 rounded-sm" />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[4px] font-serif italic text-zinc-400 leading-none">Cinematic</span>
          </div>
        </div>
      ),
    },
    {
      id: 'purikura',
      title: 'Sticker Club Purikura',
      description: 'Cute Japanese high-school inspired 4-pose stickers with a thick border',
      photoCount: 4,
      icon: <Smile className="w-5 h-5 text-pink-400" />,
      previewLayout: (
        <div className="w-[95px] h-[95px] bg-[#FFF5F7] border border-pink-200 rounded-md p-1.5 grid grid-cols-2 grid-rows-2 gap-1 shadow-md relative overflow-hidden select-none">
          <div className="bg-zinc-900 border border-black/10 rounded-[3px] aspect-square" />
          <div className="bg-zinc-900 border border-black/10 rounded-[3px] aspect-square" />
          <div className="bg-zinc-900 border border-black/10 rounded-[3px] aspect-square" />
          <div className="bg-zinc-900 border border-black/10 rounded-[3px] aspect-square" />
          <span className="absolute top-[2px] right-[2px] text-[4px]">🌸</span>
          <span className="absolute bottom-[2px] left-[2px] text-[4px]">🎀</span>
        </div>
      ),
    },
    {
      id: 'vintage-silver',
      title: '1950s Silver Halide',
      description: 'Authentic high-contrast analog photobooth column of four portraits',
      photoCount: 4,
      icon: <Camera className="w-5 h-5 text-zinc-400" />,
      previewLayout: (
        <div className="w-[52px] h-[120px] bg-[#FBF9F3] border border-amber-900/5 rounded p-1 flex flex-col gap-[3px] shadow-sm relative overflow-hidden select-none">
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="flex-1 flex flex-col items-center justify-center gap-0.5 mt-0.5">
            <span className="text-[4px] font-serif italic text-zinc-700 font-bold scale-95 leading-none">SILVER</span>
          </div>
        </div>
      ),
    },
    {
      id: 'sprocket-roll',
      title: '35mm Film Sprocket',
      description: '3 horizontal analog poses framed by physical sprocket holes on dark canister film',
      photoCount: 3,
      icon: <Tv className="w-5 h-5 text-orange-400" />,
      previewLayout: (
        <div className="w-[125px] h-[55px] bg-[#151518] rounded border border-zinc-800 p-1 flex items-center justify-between gap-1 shadow-md relative overflow-hidden select-none">
          <div className="absolute top-0.5 left-0 right-0 h-1 flex justify-around text-[3px] text-white/40 tracking-[1px] font-mono leading-none">▫▫▫▫▫▫▫▫▫▫▫</div>
          <div className="w-[30%] aspect-[9/16] bg-zinc-900 border border-zinc-800 rounded-[1px]" />
          <div className="w-[30%] aspect-[9/16] bg-zinc-900 border border-zinc-800 rounded-[1px]" />
          <div className="w-[30%] aspect-[9/16] bg-zinc-900 border border-zinc-800 rounded-[1px]" />
          <div className="absolute bottom-0.5 left-0 right-0 h-1 flex justify-around text-[3px] text-white/40 tracking-[1px] font-mono leading-none">▫▫▫▫▫▫▫▫▫▫▫</div>
        </div>
      ),
    },
    {
      id: 'directors-cut',
      title: "Director's Cut Wide",
      description: '3 high-contrast panoramic cinema blocks with viewfinder HUD frames',
      photoCount: 3,
      icon: <Clapperboard className="w-5 h-5 text-red-400" />,
      previewLayout: (
        <div className="w-[85px] h-[115px] bg-zinc-950 border border-white/5 rounded p-1 flex flex-col gap-1 shadow-md select-none">
          <div className="w-full aspect-[16/7] bg-zinc-900 border border-red-500/20 rounded-sm relative flex items-center justify-center">
            <span className="text-[3px] font-mono text-red-500/40 absolute top-[1px] left-[1px] leading-none">REC</span>
          </div>
          <div className="w-full aspect-[16/7] bg-zinc-900 border border-red-500/20 rounded-sm relative" />
          <div className="w-full aspect-[16/7] bg-zinc-900 border border-red-500/20 rounded-sm relative" />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[4px] font-mono font-bold tracking-widest text-zinc-400 leading-none">CUT-03</span>
          </div>
        </div>
      ),
    },
    {
      id: 'neo-noir',
      title: 'Neo-Noir Detective',
      description: '1 high-contrast tall cinematic pose styled with case file stamp text',
      photoCount: 1,
      icon: <Gamepad className="w-5 h-5 text-emerald-500" />,
      previewLayout: (
        <div className="w-[78px] h-[110px] bg-zinc-950 border border-white/5 rounded p-1.5 flex flex-col justify-between shadow-md select-none">
          <div className="w-full aspect-[3/4] bg-zinc-900 rounded border border-white/5" />
          <div className="text-[4px] font-mono font-bold text-red-500 text-center uppercase tracking-widest mt-1 scale-90 leading-none">CONFIDENTIAL</div>
        </div>
      ),
    },
    {
      id: 'comic',
      title: 'Pop Art Comic Strip',
      description: '3-pose horizontal narrative blocks mimicking a classic retro printed comic',
      photoCount: 3,
      icon: <Smile className="w-5 h-5 text-yellow-400" />,
      previewLayout: (
        <div className="w-[110px] h-[60px] bg-[#FAF6E9] border-2 border-zinc-900 rounded p-1 flex gap-1 shadow-sm select-none">
          <div className="w-1/3 h-full border-2 border-zinc-900 bg-zinc-900" />
          <div className="w-1/3 h-full border-2 border-zinc-900 bg-zinc-900" />
          <div className="w-1/3 h-full border-2 border-zinc-900 bg-zinc-900" />
        </div>
      ),
    },
    {
      id: 'magazine',
      title: 'Fashion Magazine',
      description: '1 giant stunning high-key snapshot with custom brand typography overlay',
      photoCount: 1,
      icon: <Compass className="w-5 h-5 text-sky-400" />,
      previewLayout: (
        <div className="w-[80px] h-[110px] bg-white border border-zinc-200 rounded p-1 flex flex-col justify-between shadow-md relative overflow-hidden select-none">
          <div className="absolute top-1.5 left-0 right-0 text-center text-[7px] font-extrabold tracking-tighter text-zinc-900 z-10 leading-none">AERO BOOTH</div>
          <div className="w-full h-[88px] bg-zinc-900 border border-zinc-100 rounded-sm mt-3" />
        </div>
      ),
    },
    {
      id: 'ticket',
      title: 'Gig Concert Ticket',
      description: '4 vertical column poses with a stub barcode and perforated coupon detail',
      photoCount: 4,
      icon: <Bookmark className="w-5 h-5 text-blue-400" />,
      previewLayout: (
        <div className="w-[52px] h-[120px] bg-[#FAF6E9] border border-amber-900/10 rounded p-1 flex flex-col gap-[2px] shadow-sm relative overflow-hidden select-none">
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/5 rounded-[1px]" />
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/5 rounded-[1px]" />
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/5 rounded-[1px]" />
          <div className="w-full aspect-[4/3] bg-zinc-900 border border-black/5 rounded-[1px]" />
          <div className="border-t border-dashed border-amber-900/20 my-0.5 w-full" />
          <div className="w-6 h-1 bg-zinc-900/35 mx-auto rounded-[1px]" />
          <div className="text-[3px] font-mono text-center text-amber-900 scale-90 leading-none">TICKET-0721</div>
        </div>
      ),
    },
    {
      id: 'golden-polaroid',
      title: 'Golden Hour Polaroid',
      description: '1 high-fidelity warm snapshot optimized for golden sunset filters',
      photoCount: 1,
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      previewLayout: (
        <div className="w-[90px] h-[108px] bg-[#FAF6E9] border border-amber-900/10 rounded-sm p-1.5 flex flex-col gap-2 shadow-sm select-none">
          <div className="w-full aspect-square bg-zinc-900 border border-amber-500/20 rounded-[1px]" />
          <div className="flex-1 flex items-center justify-center gap-0.5">
            <span className="text-[7px] font-handwriting font-bold text-amber-800 leading-none">golden hour</span>
            <span className="text-[5px] leading-none">☀️</span>
          </div>
        </div>
      ),
    },
    {
      id: 'cyber-glitch',
      title: 'Cyber Neon Duo',
      description: '2 cinematic landscape panels side-by-side with scanlines and glitch overlays',
      photoCount: 2,
      icon: <Tv className="w-5 h-5 text-fuchsia-400" />,
      previewLayout: (
        <div className="w-[100px] h-[72px] bg-zinc-950 border border-razel-neon/30 rounded p-1.5 flex gap-1 shadow-md select-none">
          <div className="w-1/2 h-full bg-zinc-900 border border-razel-neon/25 rounded-sm" />
          <div className="w-1/2 h-full bg-zinc-900 border border-razel-neon/25 rounded-sm" />
        </div>
      ),
    },
    {
      id: 'grunge-collage',
      title: '90s Grunge Collage',
      description: '4 organic overlapping snapshot crops in a creative scrapbook canvas',
      photoCount: 4,
      icon: <Scissors className="w-5 h-5 text-orange-500" />,
      previewLayout: (
        <div className="w-[100px] h-[100px] bg-[#E8DCC4] border border-zinc-800/20 rounded p-1 relative shadow-md overflow-hidden select-none">
          <div className="absolute w-[40px] aspect-square bg-white border border-black/10 rotate-[6deg] left-2 top-2 p-0.5 shadow-sm">
            <div className="w-full h-full bg-zinc-900" />
          </div>
          <div className="absolute w-[40px] aspect-square bg-white border border-black/10 rotate-[-12deg] right-2 top-3 p-0.5 shadow-sm">
            <div className="w-full h-full bg-zinc-900" />
          </div>
          <div className="absolute w-[40px] aspect-square bg-white border border-black/10 rotate-[3deg] left-3 bottom-2 p-0.5 shadow-sm">
            <div className="w-full h-full bg-zinc-900" />
          </div>
          <div className="absolute w-[40px] aspect-square bg-white border border-black/10 rotate-[-5deg] right-3 bottom-3 p-0.5 shadow-sm">
            <div className="w-full h-full bg-zinc-900" />
          </div>
        </div>
      ),
    },
    {
      id: 'gallery',
      title: 'Minimal Gallery Arch',
      description: '2 side-by-side snapshots cropped into beautiful high-contrast arches',
      photoCount: 2,
      icon: <Brush className="w-5 h-5 text-teal-400" />,
      previewLayout: (
        <div className="w-[100px] h-[80px] bg-white border border-zinc-200 rounded p-1.5 flex gap-1.5 shadow-sm justify-center select-none">
          <div className="w-8 h-full bg-zinc-900 rounded-t-full border border-black/10" />
          <div className="w-8 h-full bg-zinc-900 rounded-t-full border border-black/10" />
        </div>
      ),
    },
    {
      id: 'passport',
      title: 'ID Passport Quad',
      description: '4 identical high-fidelity passport sized prints of your very first pose',
      photoCount: 1,
      icon: <FileText className="w-5 h-5 text-zinc-500" />,
      previewLayout: (
        <div className="w-[95px] h-[95px] bg-white border border-zinc-200 rounded p-1.5 grid grid-cols-2 grid-rows-2 gap-1.5 shadow-sm select-none">
          <div className="bg-zinc-900 border border-black/10 rounded-[1px] aspect-square" />
          <div className="bg-zinc-900 border border-black/10 rounded-[1px] aspect-square" />
          <div className="bg-zinc-900 border border-black/10 rounded-[1px] aspect-square" />
          <div className="bg-zinc-900 border border-black/10 rounded-[1px] aspect-square" />
        </div>
      ),
    },
    {
      id: 'wedding',
      title: 'Wedding Keepsake',
      description: '3 elegant portrait frames with delicate gold-leaf dividers',
      photoCount: 3,
      icon: <Heart className="w-5 h-5 text-rose-400" />,
      previewLayout: (
        <div className="w-[85px] h-[115px] bg-stone-50 border border-amber-200 rounded p-1.5 flex flex-col gap-1.5 shadow-md relative select-none">
          <div className="w-full aspect-[3/2] bg-zinc-900 rounded-[1px] border border-[#D4AF37]/50" />
          <div className="w-full aspect-[3/2] bg-zinc-900 rounded-[1px] border border-[#D4AF37]/50" />
          <div className="w-full aspect-[3/2] bg-zinc-900 rounded-[1px] border border-[#D4AF37]/50" />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[4px] font-serif text-amber-800 tracking-wider leading-none">FOREVER</span>
          </div>
        </div>
      ),
    },
    {
      id: 'neon-wave',
      title: 'Vapor Neon Wave',
      description: '4-pose hyper-saturated retro grid framed by an electric neon border',
      photoCount: 4,
      icon: <Tv className="w-5 h-5 text-fuchsia-400" />,
      previewLayout: (
        <div className="w-[95px] h-[95px] bg-[#090B11] border border-fuchsia-500 rounded p-1.5 grid grid-cols-2 grid-rows-2 gap-1 shadow-md select-none">
          <div className="bg-zinc-900 border border-cyan-400 rounded-[1px] aspect-square" />
          <div className="bg-zinc-900 border border-fuchsia-400 rounded-[1px] aspect-square" />
          <div className="bg-zinc-900 border border-fuchsia-400 rounded-[1px] aspect-square" />
          <div className="bg-zinc-900 border border-cyan-400 rounded-[1px] aspect-square" />
        </div>
      ),
    },
    {
      id: 'editorial',
      title: 'Editorial Vogue',
      description: 'A single high-fashion portrait crop surrounded by premium negative space and clean typography',
      photoCount: 1,
      icon: <Award className="w-5 h-5 text-amber-400" />,
      previewLayout: (
        <div className="w-[85px] h-[115px] bg-white border border-zinc-200 rounded p-3 flex flex-col justify-between shadow-md select-none">
          <div className="w-full aspect-[3/4] bg-zinc-900 border border-black/10 rounded-[1px]" />
          <div className="text-center">
            <span className="text-[5px] font-serif font-bold text-zinc-900 tracking-widest leading-none">VOGUE</span>
          </div>
        </div>
      ),
    },
    {
      id: 'marquee',
      title: 'Marquee Broadway',
      description: '3 golden vintage movie stub layouts with tickets-style notches',
      photoCount: 3,
      icon: <Clapperboard className="w-5 h-5 text-yellow-500" />,
      previewLayout: (
        <div className="w-[80px] h-[115px] bg-amber-50 border border-amber-300 rounded p-1.5 flex flex-col gap-1 shadow-md relative select-none">
          <div className="w-full aspect-[2/1] bg-zinc-900 rounded-[1px]" />
          <div className="w-full aspect-[2/1] bg-zinc-900 rounded-[1px]" />
          <div className="w-full aspect-[2/1] bg-zinc-900 rounded-[1px]" />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[3.5px] font-mono text-amber-700 tracking-widest leading-none">ADMIT ONE</span>
          </div>
        </div>
      ),
    }
  ];

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'strip' | 'polaroid' | 'grid' | 'cinematic'>('all');

  const filteredLayouts = layouts.filter((layout) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'strip') {
      return ['strip', 'double-strip', 'vintage-silver', 'ticket'].includes(layout.id);
    }
    if (selectedCategory === 'polaroid') {
      return ['polaroid', 'polaroid-wide', 'golden-polaroid', 'editorial'].includes(layout.id);
    }
    if (selectedCategory === 'grid') {
      return ['grid', 'purikura', 'duo', 'gallery', 'grunge-collage', 'passport', 'neon-wave'].includes(layout.id);
    }
    if (selectedCategory === 'cinematic') {
      return ['cinematic', 'sprocket-roll', 'directors-cut', 'neo-noir', 'comic', 'magazine', 'cyber-glitch', 'wedding', 'marquee'].includes(layout.id);
    }
    return true;
  });

  const selectedLayout = layouts.find((l) => l.id === selectedTemplate);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 flex flex-col items-center pb-24">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white mb-2 tracking-tight">
          Choose Your Layout Frame
        </h2>
        <p className="text-white/60 text-sm max-w-md mx-auto">
          Choose from 24 highly-realistic analog photobooth templates, organized for easy browsing.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-8 w-full max-w-2xl bg-white/5 border border-white/10 rounded-xl p-1 md:p-1.5">
        {[
          { id: 'all', label: 'All (24)' },
          { id: 'strip', label: 'Classic Strips' },
          { id: 'polaroid', label: 'Polaroids' },
          { id: 'grid', label: 'Grids & Arches' },
          { id: 'cinematic', label: 'Cinematic' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as any)}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs font-semibold font-display tracking-wide transition-all ${
              selectedCategory === tab.id
                ? 'bg-razel-neon text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full mb-8">
        {filteredLayouts.map((layout) => {
          const isSelected = selectedTemplate === layout.id;

          return (
            <div
              key={layout.id}
              onClick={() => onChangeTemplate(layout.id)}
              className={`group flex flex-col justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 bg-razel-card ${
                isSelected
                  ? 'border-razel-neon shadow-[0_0_20px_rgba(255,46,84,0.15)] scale-[1.02]'
                  : 'border-white/10 hover:border-white/20 hover:scale-[1.01]'
              }`}
              id={`layout-card-${layout.id}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                      {layout.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {layout.title}
                      </h3>
                      <span className="text-[10px] bg-white/10 font-mono text-white/80 font-bold px-1.5 py-0.5 rounded">
                        {layout.photoCount} {layout.photoCount === 1 ? 'POSE' : 'POSES'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/50 leading-relaxed mb-4">
                  {layout.description}
                </p>
              </div>

              <div className="w-full flex items-center justify-center py-4 bg-zinc-950/40 border border-white/5 rounded-xl h-48 group-hover:bg-zinc-950/60 transition-all overflow-hidden relative shadow-inner">
                {generatedPreviews && generatedPreviews[layout.id] ? (
                  <div className="relative h-full w-full flex items-center justify-center">
                    {/* Soft ambient glow behind the preview strip */}
                    <div 
                      className="absolute inset-0 w-full h-full scale-125 opacity-15 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150"
                      style={{
                        backgroundImage: `url(${generatedPreviews[layout.id]})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                    <img
                      src={generatedPreviews[layout.id]}
                      referrerPolicy="no-referrer"
                      alt={`${layout.title} Live Preview`}
                      className="h-full object-contain max-h-[160px] z-10 drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)] group-hover:scale-[1.06] transition-all duration-300 rounded"
                    />
                  </div>
                ) : (
                  <div className="scale-110 transform transition-all duration-300 group-hover:scale-[1.12]">
                    {layout.previewLayout}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Sticky Bottom Action Bar */}
      {selectedLayout && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl bg-zinc-950/90 backdrop-blur-md border border-razel-neon/40 shadow-[0_8px_30px_rgba(255,46,84,0.25)] rounded-2xl p-4 flex items-center justify-between z-50 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-[9px] text-white/40 font-mono uppercase tracking-wider">Currently Selected</p>
              <p className="text-xs md:text-sm font-bold text-white leading-tight">{selectedLayout.title}</p>
              <p className="text-[10px] text-white/50">Requires {selectedLayout.photoCount} separate poses</p>
            </div>
          </div>
          <button
            onClick={onProceed}
            className="px-5 py-2.5 rounded-xl bg-razel-neon hover:bg-razel-neon/90 text-white font-display font-bold text-xs md:text-sm tracking-wide shadow-md transition-all shrink-0 hover:-translate-y-0.5 active:translate-y-0"
            id="btn-layout-proceed"
          >
            CONFIRM & START →
          </button>
        </div>
      )}
    </div>
  );
}
