/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TemplateType } from '../types';

interface RenderOptions {
  photos: string[];
  template: TemplateType;
  captionText?: string;
}

// Convert image URL to Image object helper (with fallback to red box on fail)
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    if (src && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Create a small blank image on error to prevent crashes
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(0, 0, 100, 100);
      }
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.src = canvas.toDataURL();
    };
    img.src = src;
  });
};

export async function renderTemplatePreview({
  photos,
  template,
  captionText
}: RenderOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Determine template properties
  let canvasW = 800;
  let canvasH = 1000;
  let borderBgColor = '#FFFFFF';
  let isDarkTheme = false;

  // Defaults based on template style
  if (template === 'strip' || template === 'vintage-silver') {
    canvasW = 600;
    canvasH = 1800;
    borderBgColor = template === 'vintage-silver' ? '#FBF9F3' : '#FFFFFF';
  } else if (template === 'double-strip') {
    canvasW = 1200;
    canvasH = 1800;
  } else if (template === 'polaroid' || template === 'golden-polaroid') {
    canvasW = 800;
    canvasH = 1000;
    borderBgColor = template === 'golden-polaroid' ? '#FAF6E9' : '#FBF9F3';
  } else if (template === 'polaroid-wide') {
    canvasW = 1000;
    canvasH = 800;
    borderBgColor = '#FBF9F3';
  } else if (template === 'grid' || template === 'purikura' || template === 'grunge-collage' || template === 'passport') {
    canvasW = 1000;
    canvasH = 1000;
    borderBgColor = template === 'purikura' ? '#FFF5F7' : template === 'grunge-collage' ? '#E8DCC4' : '#FFFFFF';
  } else if (template === 'duo' || template === 'gallery') {
    canvasW = 1000;
    canvasH = 800;
  } else if (template === 'cinematic' || template === 'directors-cut') {
    canvasW = 800;
    canvasH = 1500;
    borderBgColor = '#12141C';
    isDarkTheme = true;
  } else if (template === 'sprocket-roll') {
    canvasW = 1200;
    canvasH = 500;
    borderBgColor = '#151518';
    isDarkTheme = true;
  } else if (template === 'neo-noir') {
    canvasW = 700;
    canvasH = 1000;
    borderBgColor = '#12141C';
    isDarkTheme = true;
  } else if (template === 'magazine') {
    canvasW = 800;
    canvasH = 1100;
  } else if (template === 'comic') {
    canvasW = 1200;
    canvasH = 600;
    borderBgColor = '#E8DCC4';
  } else if (template === 'ticket') {
    canvasW = 550;
    canvasH = 1800;
    borderBgColor = '#FAF6E9';
  } else if (template === 'cyber-glitch') {
    canvasW = 1000;
    canvasH = 650;
    borderBgColor = '#090B11';
    isDarkTheme = true;
  } else if (template === 'wedding') {
    canvasW = 800;
    canvasH = 1300;
    borderBgColor = '#F5F2EB';
  } else if (template === 'neon-wave') {
    canvasW = 1000;
    canvasH = 1000;
    borderBgColor = '#090B11';
    isDarkTheme = true;
  } else if (template === 'editorial') {
    canvasW = 800;
    canvasH = 1100;
    borderBgColor = '#FFFFFF';
  } else if (template === 'marquee') {
    canvasW = 800;
    canvasH = 1400;
    borderBgColor = '#FAF6E9';
  }

  canvas.width = canvasW;
  canvas.height = canvasH;

  // Draw background color
  ctx.fillStyle = borderBgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Apply visual style presets for specific templates
  if (template === 'cyber-glitch') {
    // Draw neon lines
    ctx.strokeStyle = 'rgba(255, 46, 84, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvasW; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke();
    }
  } else if (template === 'sprocket-roll') {
    // Film perforations
    ctx.fillStyle = '#000000';
    const hW = 25; const hH = 45; const hR = 8;
    const drawHole = (cx: number, cy: number) => {
      ctx.beginPath();
      ctx.roundRect(cx, cy, hW, hH, hR);
      ctx.fill();
    };
    for (let x = 20; x < canvasW - 20; x += 70) {
      drawHole(x, 15);
      drawHole(x, canvasH - 60);
    }
  }

  // Load photos
  const loadedImages = await Promise.all(photos.map((src) => loadImage(src)));
  const getImg = (idx: number): HTMLImageElement => loadedImages[idx] || loadedImages[0];

  const padding = 40;
  const gap = 30;

  // Draw photo wrapper function
  const drawPhoto = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
    ctx.save();
    const imgAspect = img.width / img.height;
    const targetAspect = w / h;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgAspect > targetAspect) {
      sw = img.height * targetAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetAspect;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    
    // Add subtle shadow over photos
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  };

  // Render layouts
  if (template === 'strip' || template === 'vintage-silver') {
    const imgW = canvasW - padding * 2;
    const imgH = (canvasH * 0.85 - padding * 2 - gap * 3) / 4;
    for (let i = 0; i < 4; i++) {
      drawPhoto(getImg(i), padding, padding + i * (imgH + gap), imgW, imgH);
    }
  } else if (template === 'double-strip') {
    const halfW = canvasW / 2;
    const imgW = halfW - padding * 1.6;
    const imgH = (canvasH * 0.85 - padding * 2 - gap * 3) / 4;
    for (let i = 0; i < 4; i++) {
      const startY = padding + i * (imgH + gap);
      drawPhoto(getImg(i), padding, startY, imgW, imgH);
      drawPhoto(getImg(i), halfW + padding * 0.6, startY, imgW, imgH);
    }
    // Dash cut line
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(halfW, 20); ctx.lineTo(halfW, canvasH - 20);
    ctx.stroke();
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
      drawPhoto(getImg(i), coords[i][0], coords[i][1], imgW, imgH);
    }
  } else if (template === 'polaroid' || template === 'golden-polaroid') {
    const imgW = canvasW - padding * 2;
    drawPhoto(getImg(0), padding, padding, imgW, imgW);
  } else if (template === 'polaroid-wide') {
    const imgW = canvasW - padding * 2;
    const imgH = canvasH - padding * 2 - 120;
    drawPhoto(getImg(0), padding, padding, imgW, imgH);
  } else if (template === 'duo') {
    const imgW = (canvasW - padding * 2 - gap) / 2;
    const imgH = canvasH - padding * 2 - 120;
    for (let i = 0; i < 2; i++) {
      drawPhoto(getImg(i), padding + i * (imgW + gap), padding, imgW, imgH);
    }
  } else if (template === 'cinematic' || template === 'directors-cut') {
    const imgW = canvasW - padding * 2;
    const imgH = (canvasH * 0.82 - padding * 2 - gap * 2) / 3;
    for (let i = 0; i < 3; i++) {
      drawPhoto(getImg(i), padding, padding + i * (imgH + gap), imgW, imgH);
    }
  } else if (template === 'sprocket-roll') {
    const imgW = (canvasW - padding * 2 - gap * 2) / 3;
    const imgH = canvasH - padding * 2 - 40;
    for (let i = 0; i < 3; i++) {
      drawPhoto(getImg(i), padding + i * (imgW + gap), padding + 20, imgW, imgH);
    }
  } else if (template === 'neo-noir' || template === 'magazine') {
    const imgW = canvasW - padding * 2;
    const imgH = canvasH - padding * 2 - 120;
    drawPhoto(getImg(0), padding, padding, imgW, imgH);
  } else if (template === 'comic') {
    const imgW = (canvasW - padding * 2 - gap * 2) / 3;
    const imgH = canvasH - padding * 2;
    for (let i = 0; i < 3; i++) {
      drawPhoto(getImg(i), padding + i * (imgW + gap), padding, imgW, imgH);
    }
  } else if (template === 'ticket') {
    const imgW = canvasW - padding * 2;
    const imgH = (canvasH * 0.75 - padding * 2 - gap * 3) / 4;
    for (let i = 0; i < 4; i++) {
      drawPhoto(getImg(i), padding, padding + i * (imgH + gap), imgW, imgH);
    }
  } else if (template === 'cyber-glitch') {
    const imgW = (canvasW - padding * 2 - gap) / 2;
    const imgH = canvasH - padding * 2;
    for (let i = 0; i < 2; i++) {
      drawPhoto(getImg(i), padding + i * (imgW + gap), padding, imgW, imgH);
    }
  } else if (template === 'grunge-collage') {
    const positions = [
      { x: canvasW * 0.3, y: canvasH * 0.3, rot: -0.08 },
      { x: canvasW * 0.7, y: canvasH * 0.32, rot: 0.06 },
      { x: canvasW * 0.32, y: canvasH * 0.7, rot: 0.04 },
      { x: canvasW * 0.68, y: canvasH * 0.72, rot: -0.05 },
    ];
    const size = 360;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(positions[i].x, positions[i].y);
      ctx.rotate(positions[i].rot);
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-size / 2 - 8, -size / 2 - 8, size + 16, size + 40);
      drawPhoto(getImg(i), -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  } else if (template === 'gallery') {
    const imgW = (canvasW - padding * 2 - gap) / 2;
    const imgH = canvasH - padding * 2 - 100;
    for (let i = 0; i < 2; i++) {
      const startX = padding + i * (imgW + gap);
      const startY = padding;
      ctx.save();
      ctx.beginPath();
      ctx.arc(startX + imgW / 2, startY + imgW / 2, imgW / 2, Math.PI, 0, false);
      ctx.lineTo(startX + imgW, startY + imgH);
      ctx.lineTo(startX, startY + imgH);
      ctx.closePath();
      ctx.clip();
      drawPhoto(getImg(i), startX, startY, imgW, imgH);
      ctx.restore();
    }
  } else if (template === 'passport') {
    const imgW = (canvasW - padding * 2 - gap) / 2;
    const imgH = (canvasH - padding * 2 - gap) / 2;
    const coords = [
      [padding, padding],
      [padding + imgW + gap, padding],
      [padding, padding + imgH + gap],
      [padding + imgW + gap, padding + imgH + gap],
    ];
    for (let i = 0; i < 4; i++) {
      drawPhoto(getImg(0), coords[i][0], coords[i][1], imgW, imgH);
    }
  } else if (template === 'wedding') {
    const imgW = (canvasW - padding * 2 - gap * 2) / 3;
    const imgH = canvasH - padding * 2 - 100;
    for (let i = 0; i < 3; i++) {
      const startX = padding + i * (imgW + gap);
      drawPhoto(getImg(i), startX, padding, imgW, imgH);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.strokeRect(startX, padding, imgW, imgH);
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
      drawPhoto(getImg(i), coords[i][0], coords[i][1], imgW, imgH);
      ctx.strokeStyle = i % 2 === 0 ? '#00f0ff' : '#ff007f';
      ctx.lineWidth = 4;
      ctx.strokeRect(coords[i][0], coords[i][1], imgW, imgH);
    }
  } else if (template === 'editorial') {
    const imgW = canvasW - padding * 3;
    const imgH = canvasH - padding * 4 - 80;
    drawPhoto(getImg(0), padding * 1.5, padding * 1.5, imgW, imgH);
    ctx.strokeStyle = '#12141C';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding * 1.5, padding * 1.5, imgW, imgH);
  } else if (template === 'marquee') {
    const imgW = canvasW - padding * 2.5;
    const imgH = (canvasH * 0.82 - padding * 2 - gap * 2) / 3;
    for (let i = 0; i < 3; i++) {
      drawPhoto(getImg(i), padding * 1.25, padding * 1.25 + i * (imgH + gap), imgW, imgH);
      ctx.strokeStyle = '#C5A059';
      ctx.lineWidth = 3;
      ctx.strokeRect(padding * 1.25, padding * 1.25 + i * (imgH + gap), imgW, imgH);
    }
  }

  // Draw typography caption
  const labelText = captionText || (template.replace('-', ' ') + ' pose').toUpperCase();
  ctx.fillStyle = isDarkTheme ? '#FFFFFF' : '#12141C';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let textY = canvasH - 75;
  if (template === 'strip' || template === 'vintage-silver' || template === 'double-strip') {
    textY = canvasH - 100;
  } else if (template === 'polaroid' || template === 'golden-polaroid') {
    textY = canvasH - 95;
  }

  // Choose font family
  let fontStr = 'bold 32px sans-serif';
  if (['polaroid', 'golden-polaroid', 'purikura'].includes(template)) {
    fontStr = 'bold italic 36px sans-serif';
  } else if (['cinematic', 'directors-cut', 'wedding', 'editorial'].includes(template)) {
    fontStr = 'italic 34px serif';
  } else if (['sprocket-roll', 'ticket', 'cyber-glitch', 'marquee'].includes(template)) {
    fontStr = 'bold 26px monospace';
  }

  ctx.font = fontStr;
  
  if (['strip', 'vintage-silver', 'double-strip', 'polaroid', 'golden-polaroid', 'polaroid-wide', 'ticket', 'duo', 'cinematic', 'directors-cut', 'neo-noir', 'magazine', 'wedding', 'gallery', 'editorial', 'marquee', 'neon-wave'].includes(template)) {
    ctx.fillText(labelText, canvasW / 2, textY);
    // Add date stamp
    ctx.fillStyle = isDarkTheme ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    ctx.font = '14px monospace';
    ctx.fillText('07/21/2026', canvasW / 2, textY + 35);
  }

  // Draw cherry blossoms overlay on purikura
  if (template === 'purikura') {
    ctx.fillStyle = 'rgba(244, 143, 177, 0.4)';
    ctx.font = '24px sans-serif';
    ctx.fillText('🌸', canvasW * 0.1, canvasH * 0.1);
    ctx.fillText('💖', canvasW * 0.9, canvasH * 0.2);
    ctx.fillText('🌸', canvasW * 0.15, canvasH * 0.85);
    ctx.fillText('🎀', canvasW * 0.85, canvasH * 0.9);
  }

  // Grain noise effect
  ctx.save();
  const grainIntensity = 0.08;
  const grainImgData = ctx.createImageData(canvasW, canvasH);
  const data = grainImgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.random() * 255;
    data[i] = val; data[i+1] = val; data[i+2] = val;
    data[i+3] = Math.random() * 255 * grainIntensity;
  }
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = canvasW; grainCanvas.height = canvasH;
  grainCanvas.getContext('2d')?.putImageData(grainImgData, 0, 0);
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.restore();

  return canvas.toDataURL('image/png');
}
