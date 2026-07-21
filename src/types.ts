/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Photo {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export type TemplateType = 
  | 'strip' 
  | 'double-strip' 
  | 'polaroid' 
  | 'polaroid-wide' 
  | 'grid' 
  | 'duo' 
  | 'cinematic' 
  | 'purikura' 
  | 'vintage-silver' 
  | 'sprocket-roll' 
  | 'directors-cut' 
  | 'neo-noir' 
  | 'comic' 
  | 'magazine' 
  | 'ticket' 
  | 'golden-polaroid' 
  | 'cyber-glitch' 
  | 'grunge-collage' 
  | 'gallery' 
  | 'passport' 
  | 'wedding'
  | 'neon-wave'
  | 'editorial'
  | 'marquee';

export type FilterType =
  | 'none'
  | 'mono'
  | 'vintage'
  | 'cyberpunk'
  | 'golden'
  | 'ice'
  | 'vhs'
  | 'creamy'
  | 'polaroid'
  | 'fuji-superia'
  | 'kodachrome-74'
  | 'tri-x-grain'
  | 'teal-orange'
  | 'golden-hour'
  | 'ethereal-pastel'
  | 'lomo-vivid';

export interface FilterSettings {
  brightness: number; // 50 to 150 (100 is default)
  contrast: number;   // 50 to 150 (100 is default)
  saturation: number; // 0 to 200 (100 is default)
  vignette: number;   // 0 to 100 (0 is none)
  grain: number;      // 0 to 100 (0 is none)
  lightLeak?: 'none' | 'sunflare' | 'neonspill' | 'warmfog' | 'prismflare' | 'lensflare' | 'disco-glimmer';
}

export interface Sticker {
  id: string;
  emoji?: string;
  src?: string;
  x: number;       // percentage from left (0 to 100)
  y: number;       // percentage from top (0 to 100)
  scale: number;   // scale factor (default 1.0)
  rotation: number; // in degrees (0 to 360)
}

export interface FontOption {
  id: string;
  name: string;
  className: string;
}

export interface BorderOption {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  textClass: string;
}
