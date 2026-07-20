/**
 * Razel Tech Photo Booth Pro - Modular Application Controller
 * Handles App UI tab switching, camera capture (Auto/Manual Shutter), live camera shaders, Native Web Share, GIF motion export & canvas stitching
 */
document.addEventListener('DOMContentLoaded', () => {
    const camera = new CameraController('preview-stream');
    let capturedFrames = [];
    let sessionStripsHistory = [];
    let activeStickers = [];
    let customBgImageObj = null;
    let selectedStickerIndex = -1;
    let captureMode = 'auto'; // 'auto' or 'manual'

    // DOM Elements
    const triggerBtn = document.getElementById('capture-trigger');
    const retakeAllBtn = document.getElementById('retake-all-btn');
    const camToggleBtn = document.getElementById('cam-toggle');
    const mirrorToggleBtn = document.getElementById('mirror-toggle');
    const exportBtn = document.getElementById('export-trigger');
    const shareBtn = document.getElementById('share-trigger');
    const gifBtn = document.getElementById('gif-trigger');
    const printBtn = document.getElementById('print-trigger');
    const countdownOverlay = document.getElementById('countdown');
    const flashOverlay = document.getElementById('flash');
    const stripContainer = document.getElementById('render-strip');
    const statusBadge = document.getElementById('status-badge');
    const liveVideoElem = document.getElementById('preview-stream');

    // Capture Mode Selector
    const modeSelect = document.getElementById('setting-mode');

    // Controls
    const filterSelect = document.getElementById('setting-filter');
    const grainSelect = document.getElementById('setting-grain');
    const leakSelect = document.getElementById('setting-leak');
    const borderSelect = document.getElementById('setting-border');
    const layoutSelect = document.getElementById('setting-layout');
    const fontSelect = document.getElementById('setting-font');
    const subfontSelect = document.getElementById('setting-subfont');

    // Custom Non-Hardcoded Text Inputs
    const captionInput = document.getElementById('setting-text');
    const taglineInput = document.getElementById('setting-tagline');
    const timestampSelect = document.getElementById('setting-timestamp-mode');
    const customTimestampInput = document.getElementById('setting-custom-timestamp');
    const timerSelect = document.getElementById('setting-timer');

    // Custom Filter Tuning Sliders
    const brightnessSlider = document.getElementById('filter-brightness');
    const contrastSlider = document.getElementById('filter-contrast');
    const warmthSlider = document.getElementById('filter-warmth');
    const saturationSlider = document.getElementById('filter-saturation');

    // Background & Sticker Controls
    const bgUploadGroup = document.getElementById('custom-bg-group');
    const bgFileInput = document.getElementById('bg-file-input');
    const bgScaleInput = document.getElementById('bg-scale-input');
    const bgOpacityInput = document.getElementById('bg-opacity-input');
    const bgBlendInput = document.getElementById('bg-blend-input');

    const stickersTray = document.getElementById('stickers-tray');
    const clearStickersBtn = document.getElementById('clear-stickers-btn');
    const stickerScaleSlider = document.getElementById('sticker-scale-slider');
    const stickerRotationSlider = document.getElementById('sticker-rotation-slider');

    const historyContainer = document.getElementById('history-container');

    // Hamburger Mobile Menu Elements
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });
    }

    // Dynamic Filename Generator (caption_photoboothpro_rt_timestamp.extension)
    function generateFormattedFilename(extension = 'jpg') {
        const rawCaption = (captionInput && captionInput.value.trim()) ? captionInput.value.trim() : 'memory';
        const cleanCaption = rawCaption.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
        const safeCaption = cleanCaption || 'photo';
        const timestamp = Date.now();
        return `${safeCaption}_photoboothpro_rt_${timestamp}.${extension}`;
    }

    // Studio Control Tabs Logic
    const studioTabBtns = document.querySelectorAll('.studio-tab-btn');
    const studioTabPanes = document.querySelectorAll('.studio-tab-pane');

    studioTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            studioTabBtns.forEach(b => b.classList.remove('active'));
            studioTabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetPane = document.getElementById(`tab-${btn.dataset.tab}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // Initialize Camera & Live Shaders
    camera.init().then(success => {
        if (success && camera.availableDevicesCount <= 1) {
            if (camToggleBtn) camToggleBtn.style.display = 'none';
        }
        updateLiveVideoFilter();
    });

    // Live Video Feed Filter Real-Time Renderer
    function updateLiveVideoFilter() {
        if (!liveVideoElem) return;

        const filterVal = filterSelect ? filterSelect.value : 'silver';
        const b = brightnessSlider ? parseInt(brightnessSlider.value) : 0;
        const c = contrastSlider ? parseInt(contrastSlider.value) : 0;
        const w = warmthSlider ? parseInt(warmthSlider.value) : 0;
        const s = saturationSlider ? parseInt(saturationSlider.value) : 100;

        let baseCss = "";
        switch (filterVal) {
            case 'silver': baseCss = "grayscale(100%) contrast(130%) brightness(105%)"; break;
            case 'bw': baseCss = "grayscale(100%) contrast(125%)"; break;
            case 'sepia': baseCss = "sepia(85%) contrast(105%)"; break;
            case 'warm': baseCss = "sepia(30%) saturate(130%) contrast(110%)"; break;
            case 'neon': baseCss = "hue-rotate(90deg) saturate(250%) contrast(110%)"; break;
            case 'cool': baseCss = "hue-rotate(180deg) saturate(120%) contrast(105%)"; break;
            case 'color': default: baseCss = "contrast(108%) saturate(115%)"; break;
        }

        let customCss = "";
        if (b !== 0) customCss += ` brightness(${100 + b}%)`;
        if (c !== 0) customCss += ` contrast(${100 + c}%)`;
        if (w > 0) customCss += ` sepia(${w}%)`;
        if (s !== 100) customCss += ` saturate(${s}%)`;

        liveVideoElem.style.filter = `${baseCss} ${customCss}`.trim();
    }

    if (modeSelect) {
        modeSelect.addEventListener('change', () => {
            captureMode = modeSelect.value;
            if (triggerBtn) {
                triggerBtn.querySelector('span').textContent = captureMode === 'manual' ? '📸 SHOT (CLICK EACH)' : '📸 START CAPTURE RUN';
            }
        });
    }

    if (timestampSelect) {
        timestampSelect.addEventListener('change', () => {
            if (customTimestampInput) {
                customTimestampInput.style.display = (timestampSelect.value === 'custom') ? 'block' : 'none';
            }
            refreshPreviewBlueprint();
        });
    }

    // Custom Background Upload Handler
    if (borderSelect) {
        borderSelect.addEventListener('change', () => {
            if (borderSelect.value === 'custom') {
                if (bgUploadGroup) bgUploadGroup.style.display = 'block';
            } else {
                if (bgUploadGroup) bgUploadGroup.style.display = 'none';
            }
            refreshPreviewBlueprint();
        });
    }

    if (bgFileInput) {
        bgFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        customBgImageObj = img;
                        refreshPreviewBlueprint();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (bgScaleInput) bgScaleInput.addEventListener('input', refreshPreviewBlueprint);
    if (bgOpacityInput) bgOpacityInput.addEventListener('input', refreshPreviewBlueprint);
    if (bgBlendInput) bgBlendInput.addEventListener('change', refreshPreviewBlueprint);

    // Filter Custom Sliders Input Events
    [brightnessSlider, contrastSlider, warmthSlider, saturationSlider].forEach(slider => {
        if (slider) {
            slider.addEventListener('input', () => {
                updateLiveVideoFilter();
                refreshPreviewBlueprint();
            });
        }
    });

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            updateLiveVideoFilter();
            document.querySelectorAll('.frame-slot img').forEach(img => img.className = `filter-${filterSelect.value}`);
            refreshPreviewBlueprint();
        });
    }

    function getCustomFilterParams() {
        return {
            brightness: brightnessSlider ? parseInt(brightnessSlider.value) : 0,
            contrast: contrastSlider ? parseInt(contrastSlider.value) : 0,
            warmth: warmthSlider ? parseInt(warmthSlider.value) : 0,
            saturation: saturationSlider ? parseInt(saturationSlider.value) : 100
        };
    }

    // Blueprint Layout Refresh Engine
    function refreshPreviewBlueprint() {
        if (!stripContainer || !layoutSelect) return;

        const layoutMode = layoutSelect.value;
        let targetCount = parseInt(layoutMode) || 4;
        if (layoutMode === 'grid') targetCount = 4;
        if (layoutMode === 'polaroid' || layoutMode === '1') targetCount = 1;

        const borderTheme = borderSelect ? borderSelect.value : 'vintage-card';
        const filterVal = filterSelect ? filterSelect.value : 'silver';
        const fontVal = fontSelect ? fontSelect.value : 'mono';

        stripContainer.className = `strip-wrapper border-${borderTheme} layout-${layoutMode}`;

        if (borderTheme === 'custom' && customBgImageObj) {
            const scale = parseFloat(bgScaleInput ? bgScaleInput.value : 1) || 1;
            const opacity = parseFloat(bgOpacityInput ? bgOpacityInput.value : 1) || 1;
            const blend = bgBlendInput ? bgBlendInput.value : 'normal';

            stripContainer.style.backgroundImage = `url("${customBgImageObj.src}")`;
            stripContainer.style.backgroundSize = `${100 * scale}%`;
            stripContainer.style.backgroundRepeat = 'repeat';
            stripContainer.style.opacity = opacity;
            stripContainer.style.backgroundBlendMode = blend;
        } else {
            stripContainer.style.backgroundImage = 'none';
            stripContainer.style.opacity = '1';
            stripContainer.style.backgroundBlendMode = 'normal';
        }

        stripContainer.innerHTML = '';

        for (let i = 0; i < targetCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'frame-slot';
            slot.id = `slot-${i}`;

            const img = document.createElement('img');
            img.className = `filter-${filterVal}`;
            slot.appendChild(img);

            const retakeBtn = document.createElement('button');
            retakeBtn.className = 'slot-retake-btn';
            retakeBtn.innerHTML = '🔄 Retake';
            retakeBtn.title = `Retake Photo #${i + 1}`;
            retakeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                runSingleFrameRetake(i);
            });
            slot.appendChild(retakeBtn);

            stripContainer.appendChild(slot);
        }

        const stickerLayer = document.createElement('div');
        stickerLayer.className = 'sticker-overlay-layer';
        stickerLayer.id = 'sticker-overlay-layer';

        activeStickers.forEach((stk, idx) => {
            const el = document.createElement('span');
            el.className = `placed-sticker ${selectedStickerIndex === idx ? 'selected' : ''}`;
            el.textContent = stk.emoji;
            el.style.left = `${stk.x * 100}%`;
            el.style.top = `${stk.y * 100}%`;
            el.style.fontSize = `${(stk.size || 48) * 0.5}px`;
            el.style.transform = `translate(-50%, -50%) rotate(${stk.rotation || 0}deg)`;

            el.addEventListener('mousedown', (e) => startDragSticker(e, idx));
            el.addEventListener('touchstart', (e) => startDragSticker(e, idx), { passive: false });

            stickerLayer.appendChild(el);
        });
        stripContainer.appendChild(stickerLayer);

        const footerNode = document.createElement('div');
        footerNode.className = `strip-caption font-${fontVal}`;
        footerNode.id = 'footer-caption-node';

        const captionVal = (captionInput && captionInput.value.trim()) ? captionInput.value.toUpperCase() : "";
        const taglineVal = (taglineInput && taglineInput.value.trim()) ? taglineInput.value.toUpperCase() : "";

        const mode = timestampSelect ? timestampSelect.value : 'date';
        let dateStr = "";
        if (mode === 'date') dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        else if (mode === 'datetime') dateStr = new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        else if (mode === 'custom' && customTimestampInput) dateStr = customTimestampInput.value;

        let subLine = "";
        if (dateStr && taglineVal) subLine = `${dateStr} // ${taglineVal}`;
        else if (dateStr) subLine = dateStr;
        else if (taglineVal) subLine = taglineVal;

        footerNode.innerHTML = `${captionVal ? captionVal : ''}<br><span class="brand-subtext">${subLine}</span>`;
        stripContainer.appendChild(footerNode);

        if (statusBadge) {
            if (capturedFrames.length === 0) {
                statusBadge.textContent = '📸 Ready to Shoot';
                statusBadge.className = 'status-badge ready';
            } else if (capturedFrames.length < targetCount) {
                statusBadge.textContent = `⚡ Shot ${capturedFrames.length}/${targetCount} Taken`;
                statusBadge.className = 'status-badge shooting';
            } else {
                statusBadge.textContent = '🎉 Strip Complete!';
                statusBadge.className = 'status-badge complete';
            }
        }

        capturedFrames.forEach((frameCanvas, idx) => {
            if (idx < targetCount) {
                const slot = document.getElementById(`slot-${idx}`);
                if (slot) {
                    const img = slot.querySelector('img');
                    img.src = frameCanvas.toDataURL('image/jpeg');
                    slot.classList.add('filled');
                }
            }
        });

        if (capturedFrames.length === targetCount) {
            if (exportBtn) exportBtn.style.display = 'block';
            if (shareBtn) shareBtn.style.display = 'block';
            if (gifBtn) gifBtn.style.display = 'block';
            if (printBtn) printBtn.style.display = 'block';
            if (retakeAllBtn) retakeAllBtn.style.display = 'inline-flex';
        } else {
            if (exportBtn) exportBtn.style.display = 'none';
            if (shareBtn) shareBtn.style.display = 'none';
            if (gifBtn) gifBtn.style.display = 'none';
            if (printBtn) printBtn.style.display = 'none';
            if (retakeAllBtn) retakeAllBtn.style.display = 'none';
        }
    }

    function startDragSticker(e, index) {
        e.preventDefault();
        selectedStickerIndex = index;
        const stk = activeStickers[index];
        const rect = stripContainer.getBoundingClientRect();

        const moveHandler = (moveEvent) => {
            const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            let relX = (clientX - rect.left) / rect.width;
            let relY = (clientY - rect.top) / rect.height;

            relX = Math.max(0.05, Math.min(0.95, relX));
            relY = Math.max(0.05, Math.min(0.95, relY));

            stk.x = relX;
            stk.y = relY;
            refreshPreviewBlueprint();
        };

        const stopHandler = () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', stopHandler);
            window.removeEventListener('touchmove', moveHandler);
            window.removeEventListener('touchend', stopHandler);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', stopHandler);
        window.addEventListener('touchmove', moveHandler, { passive: false });
        window.addEventListener('touchend', stopHandler);

        if (stickerScaleSlider) stickerScaleSlider.value = stk.size || 48;
        if (stickerRotationSlider) stickerRotationSlider.value = stk.rotation || 0;
        refreshPreviewBlueprint();
    }

    if (stickerScaleSlider) {
        stickerScaleSlider.addEventListener('input', () => {
            if (selectedStickerIndex >= 0 && selectedStickerIndex < activeStickers.length) {
                activeStickers[selectedStickerIndex].size = parseInt(stickerScaleSlider.value);
                refreshPreviewBlueprint();
            }
        });
    }

    if (stickerRotationSlider) {
        stickerRotationSlider.addEventListener('input', () => {
            if (selectedStickerIndex >= 0 && selectedStickerIndex < activeStickers.length) {
                activeStickers[selectedStickerIndex].rotation = parseInt(stickerRotationSlider.value);
                refreshPreviewBlueprint();
            }
        });
    }

    async function runSingleFrameRetake(frameIndex) {
        const timerDelay = parseInt(timerSelect ? timerSelect.value : 3) || 3;

        if (triggerBtn) triggerBtn.disabled = true;

        let countdown = timerDelay;
        if (countdownOverlay) {
            countdownOverlay.style.display = 'flex';
            countdownOverlay.textContent = countdown;
        }

        while (countdown > 0) {
            await new Promise(r => setTimeout(r, 1000));
            countdown--;
            if (countdown > 0 && countdownOverlay) countdownOverlay.textContent = countdown;
        }

        if (countdownOverlay) countdownOverlay.style.display = 'none';

        if (flashOverlay) flashOverlay.classList.add('active');
        window.shutterAudio.playShutterSound();
        if (flashOverlay) setTimeout(() => flashOverlay.classList.remove('active'), 120);

        const frameCanvas = camera.captureFrameToCanvas();
        capturedFrames[frameIndex] = frameCanvas;

        refreshPreviewBlueprint();

        if (triggerBtn) triggerBtn.disabled = false;
        saveToSessionHistory();
    }

    async function runCaptureSequence() {
        if (!layoutSelect || !triggerBtn) return;

        const layoutMode = layoutSelect.value;
        let targetCount = parseInt(layoutMode) || 4;
        if (layoutMode === 'grid') targetCount = 4;
        if (layoutMode === 'polaroid' || layoutMode === '1') targetCount = 1;

        const timerDelay = parseInt(timerSelect ? timerSelect.value : 3) || 3;

        if (captureMode === 'manual') {
            if (capturedFrames.length >= targetCount) {
                capturedFrames = [];
            }

            const step = capturedFrames.length;

            let countdown = timerDelay;
            if (countdownOverlay) {
                countdownOverlay.style.display = 'flex';
                countdownOverlay.textContent = countdown;
            }

            while (countdown > 0) {
                await new Promise(r => setTimeout(r, 1000));
                countdown--;
                if (countdown > 0 && countdownOverlay) countdownOverlay.textContent = countdown;
            }

            if (countdownOverlay) countdownOverlay.style.display = 'none';

            if (flashOverlay) flashOverlay.classList.add('active');
            window.shutterAudio.playShutterSound();
            if (flashOverlay) setTimeout(() => flashOverlay.classList.remove('active'), 120);

            const frameCanvas = camera.captureFrameToCanvas();
            capturedFrames[step] = frameCanvas;

            refreshPreviewBlueprint();

            if (capturedFrames.length === targetCount) {
                saveToSessionHistory();
            }
            return;
        }

        triggerBtn.disabled = true;
        layoutSelect.disabled = true;
        if (exportBtn) exportBtn.style.display = 'none';
        if (shareBtn) shareBtn.style.display = 'none';
        if (gifBtn) gifBtn.style.display = 'none';
        if (printBtn) printBtn.style.display = 'none';
        if (retakeAllBtn) retakeAllBtn.style.display = 'none';
        capturedFrames = [];

        refreshPreviewBlueprint();

        for (let step = 0; step < targetCount; step++) {
            let countdown = timerDelay;
            if (countdownOverlay) {
                countdownOverlay.style.display = 'flex';
                countdownOverlay.textContent = countdown;
            }

            while (countdown > 0) {
                await new Promise(r => setTimeout(r, 1000));
                countdown--;
                if (countdown > 0 && countdownOverlay) countdownOverlay.textContent = countdown;
            }

            if (countdownOverlay) countdownOverlay.style.display = 'none';

            if (flashOverlay) flashOverlay.classList.add('active');
            window.shutterAudio.playShutterSound();
            if (flashOverlay) setTimeout(() => flashOverlay.classList.remove('active'), 120);

            const frameCanvas = camera.captureFrameToCanvas();
            capturedFrames[step] = frameCanvas;

            const slot = document.getElementById(`slot-${step}`);
            if (slot) {
                const img = slot.querySelector('img');
                img.src = frameCanvas.toDataURL('image/jpeg');
                slot.classList.add('filled');
            }

            refreshPreviewBlueprint();

            await new Promise(r => setTimeout(r, 600));
        }

        triggerBtn.disabled = false;
        layoutSelect.disabled = false;
        if (exportBtn) exportBtn.style.display = 'block';
        if (shareBtn) shareBtn.style.display = 'block';
        if (gifBtn) gifBtn.style.display = 'block';
        if (printBtn) printBtn.style.display = 'block';
        if (retakeAllBtn) retakeAllBtn.style.display = 'inline-flex';

        saveToSessionHistory();
    }

    function saveToSessionHistory() {
        const finalCanvas = compileHighResCanvas();
        if (!finalCanvas) return;

        sessionStripsHistory.unshift(finalCanvas.toDataURL('image/jpeg', 0.8));
        if (sessionStripsHistory.length > 8) sessionStripsHistory.pop();

        renderHistoryGallery();
    }

    function renderHistoryGallery() {
        if (!historyContainer) return;
        historyContainer.innerHTML = '';
        if (sessionStripsHistory.length === 0) {
            historyContainer.innerHTML = '<span style="color:#777; font-size:0.8rem;">No strips taken yet.</span>';
            return;
        }

        sessionStripsHistory.forEach((dataUrl, idx) => {
            const thumb = document.createElement('img');
            thumb.className = 'history-thumb';
            thumb.src = dataUrl;
            thumb.title = `Strip #${idx + 1} - Click to download`;
            thumb.addEventListener('click', () => {
                downloadImage(dataUrl, generateFormattedFilename('jpg'));
            });
            historyContainer.appendChild(thumb);
        });
    }

    function compileHighResCanvas() {
        if (!layoutSelect) return null;
        return StripEngine.buildHighResCanvas(capturedFrames, {
            layout: layoutSelect.value,
            filterMode: filterSelect ? filterSelect.value : 'silver',
            grainLevel: grainSelect ? grainSelect.value : 'medium',
            leakMode: leakSelect ? leakSelect.value : 'none',
            borderTheme: borderSelect ? borderSelect.value : 'vintage-card',
            customBgImage: customBgImageObj,
            customBgScale: parseFloat(bgScaleInput ? bgScaleInput.value : 1.0) || 1.0,
            customBgOpacity: parseFloat(bgOpacityInput ? bgOpacityInput.value : 1.0) || 1.0,
            customBgBlendMode: bgBlendInput ? bgBlendInput.value : 'normal',
            customFilterParams: getCustomFilterParams(),
            captionText: captionInput ? captionInput.value : '',
            taglineText: taglineInput ? taglineInput.value : '',
            timestampMode: timestampSelect ? timestampSelect.value : 'date',
            customTimestamp: customTimestampInput ? customTimestampInput.value : '',
            stickers: activeStickers,
            footerFont: fontSelect ? fontSelect.value : 'mono',
            subtextFont: subfontSelect ? subfontSelect.value : 'mono'
        });
    }

    function downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }

    // Bind Event Triggers
    if (triggerBtn) triggerBtn.addEventListener('click', runCaptureSequence);
    if (retakeAllBtn) retakeAllBtn.addEventListener('click', runCaptureSequence);
    if (camToggleBtn) camToggleBtn.addEventListener('click', () => camera.toggleCameraFacingMode());
    if (mirrorToggleBtn) {
        mirrorToggleBtn.addEventListener('click', () => {
            const isMirrored = camera.toggleMirror();
            mirrorToggleBtn.classList.toggle('active', isMirrored);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const finalCanvas = compileHighResCanvas();
            const fname = generateFormattedFilename('jpg');
            if (finalCanvas) downloadImage(finalCanvas.toDataURL('image/jpeg', 0.98), fname);
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const finalCanvas = compileHighResCanvas();
            const fname = generateFormattedFilename('jpg');
            if (finalCanvas) {
                shareBtn.disabled = true;
                await ShareEngine.shareCanvasFile(finalCanvas, 'Photo Strip', fname);
                shareBtn.disabled = false;
            }
        });
    }

    if (gifBtn) {
        gifBtn.addEventListener('click', async () => {
            if (capturedFrames.length === 0) return;
            gifBtn.disabled = true;
            gifBtn.textContent = '⏳ GENERATING GIF...';
            const fname = generateFormattedFilename('webm');
            const gifUrl = await GifEngine.createAnimatedGif(capturedFrames, 500);
            if (gifUrl) {
                downloadImage(gifUrl, fname);
            }
            gifBtn.disabled = false;
            gifBtn.textContent = '🎞️ EXPORT ANIMATED GIF';
        });
    }

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            const finalCanvas = compileHighResCanvas();
            if (!finalCanvas) return;
            const printWin = window.open('', '_blank');
            printWin.document.write(`
                <html>
                    <head><title>Print Photo Strip - Razel Tech</title>
                    <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;} img{max-height:95vh;} @media print{body{background:none;}}</style>
                    </head>
                    <body><img src="${finalCanvas.toDataURL('image/jpeg', 0.98)}" onload="window.print();window.close();"></body>
                </html>
            `);
            printWin.document.close();
        });
    }

    if (layoutSelect) layoutSelect.addEventListener('change', refreshPreviewBlueprint);
    if (fontSelect) fontSelect.addEventListener('change', refreshPreviewBlueprint);
    if (subfontSelect) subfontSelect.addEventListener('change', refreshPreviewBlueprint);
    if (grainSelect) grainSelect.addEventListener('change', refreshPreviewBlueprint);
    if (leakSelect) leakSelect.addEventListener('change', refreshPreviewBlueprint);

    [captionInput, taglineInput, customTimestampInput].forEach(inp => {
        if (inp) inp.addEventListener('input', refreshPreviewBlueprint);
    });

    if (stickersTray) {
        stickersTray.querySelectorAll('.sticker-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.dataset.emoji;
                activeStickers.push({
                    emoji,
                    x: 0.35 + (Math.random() * 0.3),
                    y: 0.2 + (Math.random() * 0.5),
                    size: 48,
                    rotation: 0
                });
                selectedStickerIndex = activeStickers.length - 1;
                refreshPreviewBlueprint();
            });
        });
    }

    if (clearStickersBtn) {
        clearStickersBtn.addEventListener('click', () => {
            activeStickers = [];
            selectedStickerIndex = -1;
            refreshPreviewBlueprint();
        });
    }

    // Keyboard Accessibility & Kiosk UX Shortcuts
    document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA') return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (triggerBtn && !triggerBtn.disabled) triggerBtn.click();
        } else if ((e.code === 'Delete' || e.code === 'Backspace') && selectedStickerIndex >= 0) {
            e.preventDefault();
            activeStickers.splice(selectedStickerIndex, 1);
            selectedStickerIndex = -1;
            refreshPreviewBlueprint();
        } else if (e.code === 'Escape') {
            selectedStickerIndex = -1;
            refreshPreviewBlueprint();
        }
    });

    refreshPreviewBlueprint();
});
