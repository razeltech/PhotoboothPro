/**
 * Analogue Emulsion & Photo Filter Shader Engine
 * Handles default photobooth filters, custom filter tuning (brightness, contrast, warmth, saturation), grain, and light leaks
 */
class FilterEngine {
    static applyFilterToImageData(imageData, filterMode, grainLevel = 'none', customParams = {}) {
        const data = imageData.data;
        const len = data.length;

        const brightnessOffset = customParams.brightness || 0; // -50 to +50
        const contrastFactor = ((customParams.contrast || 0) + 100) / 100; // 0.5 to 1.5
        const warmthValue = (customParams.warmth || 0) / 100; // 0 to 1
        const saturationFactor = (customParams.saturation !== undefined ? customParams.saturation : 100) / 100; // 0 to 2

        let grainWeight = 0;
        if (grainLevel === 'light') grainWeight = 10;
        else if (grainLevel === 'medium') grainWeight = 22;
        else if (grainLevel === 'heavy') grainWeight = 36;

        for (let i = 0; i < len; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // 1. Base Preset Filter Transformation
            switch (filterMode) {
                case 'silver': // Real Silver Gelatin Photobooth B&W (Matching authentic photobooth print)
                    let silverLuma = 0.299 * r + 0.587 * g + 0.114 * b;
                    // High silver contrast S-curve with warm silver tone
                    silverLuma = ((silverLuma - 128) * 1.3) + 128;
                    r = Math.min(255, Math.max(0, silverLuma + 8));
                    g = Math.min(255, Math.max(0, silverLuma + 4));
                    b = Math.min(255, Math.max(0, silverLuma - 4));
                    break;

                case 'bw': // Classic B&W
                    let bwLuma = 0.299 * r + 0.587 * g + 0.114 * b;
                    bwLuma = ((bwLuma - 128) * 1.2) + 128;
                    r = g = b = Math.min(255, Math.max(0, bwLuma));
                    break;

                case 'sepia': // 1970s Sepia Warm Tone
                    let tr = (r * 0.393) + (g * 0.769) + (b * 0.189);
                    let tg = (r * 0.349) + (g * 0.686) + (b * 0.168);
                    let tb = (r * 0.272) + (g * 0.534) + (b * 0.131);
                    r = Math.min(255, tr);
                    g = Math.min(255, tg);
                    b = Math.min(255, tb);
                    break;

                case 'warm': // 35mm Warm Kodachrome
                    r = Math.min(255, (r * 1.08) + 12);
                    g = Math.min(255, (g * 0.96) + 4);
                    b = Math.min(255, (b * 0.84));
                    break;

                case 'neon': // Cyberpunk Neon
                    let nr = r, ng = g, nb = b;
                    r = Math.min(255, ng * 1.4);
                    g = Math.min(255, nb * 1.3);
                    b = Math.min(255, nr * 2.1);
                    break;

                case 'cool': // Emerald Cool Film
                    r = Math.min(255, r * 0.85);
                    g = Math.min(255, (g * 1.05) + 8);
                    b = Math.min(255, (b * 1.15) + 14);
                    break;

                case 'color': // Vibrant Film Color
                default:
                    r = Math.min(255, Math.max(0, ((r - 128) * 1.08) + 128));
                    g = Math.min(255, Math.max(0, ((g - 128) * 1.08) + 128));
                    b = Math.min(255, Math.max(0, ((b - 128) * 1.08) + 128));
                    break;
            }

            // 2. Apply Custom User Filter Tuning (Brightness, Contrast, Warmth, Saturation)
            // Brightness
            r = Math.min(255, Math.max(0, r + brightnessOffset));
            g = Math.min(255, Math.max(0, g + brightnessOffset));
            b = Math.min(255, Math.max(0, b + brightnessOffset));

            // Contrast
            r = Math.min(255, Math.max(0, ((r - 128) * contrastFactor) + 128));
            g = Math.min(255, Math.max(0, ((g - 128) * contrastFactor) + 128));
            b = Math.min(255, Math.max(0, ((b - 128) * contrastFactor) + 128));

            // Warmth (Tint towards warm amber)
            if (warmthValue > 0) {
                r = Math.min(255, r + (warmthValue * 20));
                g = Math.min(255, g + (warmthValue * 10));
                b = Math.max(0, b - (warmthValue * 15));
            }

            // Saturation
            if (saturationFactor !== 1.0) {
                let gray = 0.299 * r + 0.587 * g + 0.114 * b;
                r = Math.min(255, Math.max(0, gray + (r - gray) * saturationFactor));
                g = Math.min(255, Math.max(0, gray + (g - gray) * saturationFactor));
                b = Math.min(255, Math.max(0, gray + (b - gray) * saturationFactor));
            }

            // 3. Procedural Film Grain Noise Injection
            if (grainWeight > 0) {
                let noise = (Math.random() - 0.5) * grainWeight;
                r = Math.min(255, Math.max(0, r + noise));
                g = Math.min(255, Math.max(0, g + noise));
                b = Math.min(255, Math.max(0, b + noise));
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }

        return imageData;
    }

    static applyLightLeakToContext(ctx, width, height, leakMode) {
        if (!leakMode || leakMode === 'none') return;

        let radius = leakMode === 'subtle' ? width * 0.5 : width * 0.85;
        let gradient = ctx.createRadialGradient(
            width, height * 0.25, 10,
            width, height * 0.15, radius
        );

        if (leakMode === 'subtle') {
            gradient.addColorStop(0, 'rgba(255, 120, 50, 0.45)');
            gradient.addColorStop(0.5, 'rgba(255, 180, 80, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 60, 0, 0.85)');
            gradient.addColorStop(0.3, 'rgba(255, 140, 0, 0.5)');
            gradient.addColorStop(0.7, 'rgba(255, 200, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
}

window.FilterEngine = FilterEngine;
