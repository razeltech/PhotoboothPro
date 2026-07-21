/**
 * Dynamic Photo Strip Layout, Themes, Blend Modes, Stickers & Export Engine
 * Supports 100% custom non-hardcoded captions, taglines, timestamp formatting, and typography fonts
 */
class StripEngine {
    static getBorderColor(borderKey, customPaperHex, customBorderHex) {
        if (borderKey === 'custom-color') {
            return {
                bg: customPaperHex || '#e2d9cc',
                text: '#ffffff',
                border: customBorderHex || '#b8ac9c',
                subtext: 'rgba(255,255,255,0.8)'
            };
        }
        switch (borderKey) {
            case 'vintage-card': return { bg: '#e2d9cc', text: '#2a2421', border: '#b8ac9c', subtext: 'rgba(42,36,33,0.7)' };
            case 'dark': return { bg: '#18181b', text: '#ffffff', border: '#3f3f46', subtext: 'rgba(255,255,255,0.6)' };
            case 'retro': return { bg: '#f59e0b', text: '#18181b', border: '#b45309', subtext: 'rgba(0,0,0,0.6)' };
            case 'pink': return { bg: '#fda4af', text: '#881337', border: '#f43f5e', subtext: 'rgba(136,19,55,0.8)' };
            case 'neon': return { bg: '#0284c7', text: '#38bdf8', border: '#0ea5e9', subtext: 'rgba(56,189,248,0.8)' };
            case 'birthday': return { bg: '#fef08a', text: '#854d0e', border: '#eab308', subtext: 'rgba(133,77,14,0.7)' };
            case 'valentine': return { bg: '#ffe4e6', text: '#9f1239', border: '#f43f5e', subtext: 'rgba(159,18,57,0.7)' };
            case 'teared': return { bg: '#f1f5f9', text: '#0f172a', border: '#94a3b8', subtext: 'rgba(15,23,42,0.6)' };
            case 'filmstrip': return { bg: '#090a0f', text: '#f8fafc', border: '#27272a', subtext: 'rgba(248,250,252,0.6)' };
            case 'custom': return { bg: '#18181b', text: '#ffffff', border: 'rgba(255,255,255,0.3)', subtext: 'rgba(255,255,255,0.7)' };
            case 'classic':
            default: return { bg: '#f8fafc', text: '#0f172a', border: '#cbd5e1', subtext: 'rgba(15,23,42,0.5)' };
        }
    }

    static getFontStack(fontKey) {
        switch (fontKey) {
            case 'cursive': return "'Dancing Script', 'Pacifico', cursive";
            case 'serif': return "Georgia, serif";
            case 'sans': return "'Inter', sans-serif";
            case 'bold-sans': return "'Outfit', sans-serif";
            case 'mono':
            default: return "'JetBrains Mono', monospace";
        }
    }

    /**
     * Build High-DPI Canvas Bitmap for Download & Print
     */
    static buildHighResCanvas(framesArrayOrSession, settingsParam) {
        let framesArray = [];
        let settings = {};

        if (Array.isArray(framesArrayOrSession)) {
            framesArray = framesArrayOrSession;
            settings = settingsParam || {};
        } else if (framesArrayOrSession && typeof framesArrayOrSession === 'object') {
            const session = framesArrayOrSession;
            framesArray = session.capturedFrames || [];
            settings = {
                layout: session.layout || '4',
                filterMode: session.selectedPreset || 'silver',
                grainLevel: session.adjustments ? session.adjustments.grain : 'medium',
                leakMode: session.adjustments ? session.adjustments.leak : 'none',
                borderTheme: session.borderTheme || 'vintage-card',
                customFilterParams: session.adjustments || {},
                captionText: session.captionTop || 'DIGISMILE STUDIO',
                taglineText: session.captionBottom || '',
                timestampMode: session.timestampMode || 'date',
                customTimestamp: session.customTimestamp || '',
                stickers: session.stickers || [],
                footerFont: session.captionFont || 'mono',
                subtextFont: session.subtextFont || 'mono',
                customPaperColor: session.paperColor || '#e2d9cc',
                customBorderColor: session.borderColor || '#b8ac9c'
            };
        }

        const {
            layout = '4',
            filterMode = 'silver',
            grainLevel = 'medium',
            leakMode = 'none',
            borderTheme = 'vintage-card',
            customBgImage = null,
            customBgScale = 1.0,
            customBgOpacity = 1.0,
            customBgBlendMode = 'normal',
            customFilterParams = {},
            captionText = 'DIGISMILE STUDIO',
            taglineText = '',
            timestampMode = 'date',
            customTimestamp = '',
            stickers = [],
            footerFont = 'mono',
            subtextFont = 'mono',
            customPaperColor = '#e2d9cc',
            customBorderColor = '#b8ac9c'
        } = settings;

        const count = framesArray.length;
        if (count === 0) return null;

        const colors = this.getBorderColor(borderTheme, customPaperColor, customBorderColor);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const isFilmstrip = borderTheme === 'filmstrip';

        // Standard high-res target photo slot dimensions (4:3 for strips/grid, 1:1 square for Polaroid)
        const imgW = layout === 'polaroid' ? 620 : 600;
        const imgH = layout === 'polaroid' ? 620 : 450;
        const paddingTop = layout === 'polaroid' ? 40 : (borderTheme === 'vintage-card' ? 32 : 40);
        const sideMargin = layout === 'polaroid' ? 40 : (isFilmstrip ? 70 : (borderTheme === 'vintage-card' ? 28 : 36));
        const gap = borderTheme === 'vintage-card' ? 18 : 24;
        const footerH = (captionText || taglineText || timestampMode !== 'none') ? (layout === 'polaroid' ? 180 : 130) : 40;

        let totalW = 0;
        let totalH = 0;
        let positions = [];

        if (layout === 'grid') {
            totalW = (sideMargin * 2) + (imgW * 2) + gap;
            totalH = (paddingTop * 2) + (imgH * 2) + gap + footerH;
            positions = [
                { x: sideMargin, y: paddingTop },
                { x: sideMargin + imgW + gap, y: paddingTop },
                { x: sideMargin, y: paddingTop + imgH + gap },
                { x: sideMargin + imgW + gap, y: paddingTop + imgH + gap }
            ];
        } else if (layout === 'polaroid') {
            totalW = (sideMargin * 2) + imgW;
            totalH = paddingTop + imgH + footerH;
            positions = [{ x: sideMargin, y: paddingTop }];
        } else {
            totalW = (sideMargin * 2) + imgW;
            totalH = (paddingTop * 2) + (imgH * count) + (gap * (count - 1)) + footerH;
            for (let i = 0; i < count; i++) {
                positions.push({ x: sideMargin, y: paddingTop + (i * (imgH + gap)) });
            }
        }

        canvas.width = totalW;
        canvas.height = totalH;

        // 1. Render Base Background Color
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, totalW, totalH);

        // 2. Render Custom Uploaded Image or Preset Decorative Textures
        ctx.save();
        ctx.globalAlpha = customBgOpacity;
        ctx.globalCompositeOperation = customBgBlendMode;

        if (borderTheme === 'custom' && customBgImage) {
            const bgW = customBgImage.width * customBgScale;
            const bgH = customBgImage.height * customBgScale;
            for (let bx = 0; bx < totalW; bx += bgW) {
                for (let by = 0; by < totalH; by += bgH) {
                    ctx.drawImage(customBgImage, bx, by, bgW, bgH);
                }
            }
        } else if (borderTheme === 'birthday') {
            ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
            for (let i = 0; i < 40; i++) {
                ctx.beginPath();
                ctx.arc((i * 67) % totalW, (i * 97) % totalH, 8 + (i % 5), 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (borderTheme === 'valentine') {
            ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
            ctx.font = '24px sans-serif';
            for (let i = 0; i < 25; i++) {
                ctx.fillText('💖', (i * 83) % totalW, (i * 113) % totalH);
            }
        }
        ctx.restore();

        // 3. Render 35mm Film Strip Perforations
        if (isFilmstrip) {
            ctx.fillStyle = '#f8fafc';
            const holeW = 22;
            const holeH = 32;
            const holeRadius = 6;
            const stepY = 56;

            for (let y = 30; y < totalH - 30; y += stepY) {
                ctx.beginPath();
                ctx.roundRect(24, y, holeW, holeH, holeRadius);
                ctx.fill();

                ctx.beginPath();
                ctx.roundRect(totalW - 24 - holeW, y, holeW, holeH, holeRadius);
                ctx.fill();
            }
        }

        // 4. Render Photo Frames with aspect ratio preserving cover crop (prevents stretching)
        framesArray.forEach((sourceCanvas, idx) => {
            if (idx >= positions.length) return;
            const pos = positions[idx];

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imgW;
            tempCanvas.height = imgH;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';

            // Calculate smart center-crop to prevent image stretching (object-fit: cover)
            const srcW = sourceCanvas.width;
            const srcH = sourceCanvas.height;
            const srcAspect = srcW / srcH;
            const targetAspect = imgW / imgH;

            let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;
            if (srcAspect > targetAspect) {
                cropW = srcH * targetAspect;
                cropX = (srcW - cropW) / 2;
            } else {
                cropH = srcW / targetAspect;
                cropY = (srcH - cropH) / 2;
            }

            tempCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, imgW, imgH);

            let imgData = tempCtx.getImageData(0, 0, imgW, imgH);
            imgData = FilterEngine.applyFilterToImageData(imgData, filterMode, grainLevel, customFilterParams);
            tempCtx.putImageData(imgData, 0, 0);

            FilterEngine.applyLightLeakToContext(tempCtx, imgW, imgH, leakMode);

            ctx.drawImage(tempCanvas, pos.x, pos.y);

            if (borderTheme === 'teared') {
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 3;
                ctx.strokeRect(pos.x - 2, pos.y - 2, imgW + 4, imgH + 4);
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let tx = pos.x; tx <= pos.x + imgW; tx += 12) {
                    ctx.lineTo(tx, pos.y + (Math.sin(tx) * 3));
                }
                ctx.stroke();
            } else {
                ctx.strokeStyle = colors.border;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(pos.x, pos.y, imgW, imgH);
            }
        });

        // 5. Render Stickers with Size & Rotation
        stickers.forEach(stk => {
            ctx.save();
            const fontSize = stk.size || 48;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const realX = stk.x * totalW;
            const realY = stk.y * totalH;
            ctx.translate(realX, realY);
            if (stk.rotation) ctx.rotate((stk.rotation * Math.PI) / 180);
            
            ctx.fillText(stk.emoji, 0, 0);
            ctx.restore();
        });

        // 6. Render 100% Pure Custom Non-Hardcoded Caption (Zero stardust emojis)
        ctx.save();
        ctx.fillStyle = colors.text;

        const mainFontStack = this.getFontStack(footerFont);
        const subFontStack = this.getFontStack(subtextFont);

        ctx.textAlign = 'center';

        const captionY = totalH - 72;

        if (captionText.trim()) {
            ctx.font = `bold ${footerFont === 'cursive' ? '34px' : '24px'} ${mainFontStack}`;
            // Render PURE user text without stardust or extra emojis
            ctx.fillText(captionText.toUpperCase(), totalW / 2, captionY);
        }

        // Build Timestamp String
        let timeStr = "";
        if (timestampMode === 'date') {
            timeStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } else if (timestampMode === 'datetime') {
            timeStr = new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } else if (timestampMode === 'custom') {
            timeStr = customTimestamp;
        }

        let fullSubLine = "";
        if (timeStr && taglineText.trim()) fullSubLine = `${timeStr} // ${taglineText.toUpperCase()}`;
        else if (timeStr) fullSubLine = timeStr;
        else if (taglineText.trim()) fullSubLine = taglineText.toUpperCase();

        if (fullSubLine) {
            ctx.fillStyle = colors.subtext;
            ctx.font = `14px ${subFontStack}`;
            ctx.fillText(fullSubLine, totalW / 2, captionY + 32);
        }

        ctx.restore();

        return canvas;
    }
}

window.StripEngine = StripEngine;
