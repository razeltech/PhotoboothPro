/**
 * DigiSmile Photobooth Studio — Master Application Controller
 * Powered by Razel Tech
 */
document.addEventListener('DOMContentLoaded', () => {
    /**
     * DigiSmile Centralized Session State Factory
     */
    function createInitialSession() {
        return {
            currentStep: 1, // 1: Start, 2: Capture, 3: Customize, 4: Finish
            layout: '4', // '1', '2', '3', '4', '5', 'grid', 'polaroid'
            capturedFrames: [],
            selectedPreset: 'silver',
            adjustments: {
                brightness: 0,
                contrast: 0,
                warmth: 0,
                saturation: 100,
                grain: 'medium',
                leak: 'none'
            },
            autoEnhanced: false,
            captionTop: 'DIGISMILE STUDIO',
            captionBottom: '',
            captionFont: 'mono',
            subtextFont: 'mono',
            timestampMode: 'date',
            customTimestamp: '',
            stickers: [],
            paperColor: '#e2d9cc',
            borderColor: '#b8ac9c',
            borderTheme: 'vintage-card',
            customBgImage: null,
            bgOpacity: 1.0,
            bgScale: 1.0,
            bgBlendMode: 'normal',

            // Derived Export Canvas & Media Artifacts
            export: {
                dirty: true,
                canvas: null,
                previewUrl: null
            },
            media: {
                btsBlob: null,
                recorder: null,
                chunks: [],
                mimeType: null,
                recording: false,
                objectUrl: null
            }
        };
    }

    let DigiSmileSession = createInitialSession();

    /**
     * Behind-the-Scenes (BTS) Video Recording Engine
     */
    function getSupportedBTSRecorderMimeType() {
        if (typeof MediaRecorder === 'undefined') return null;
        const candidateTypes = [
            'video/mp4',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
        ];
        for (let type of candidateTypes) {
            if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return '';
    }

    function startBTSRecording() {
        if (!camera || !camera.stream) return;
        const mimeType = getSupportedBTSRecorderMimeType();
        if (mimeType === null) return;

        try {
            DigiSmileSession.media.chunks = [];
            DigiSmileSession.media.mimeType = mimeType;

            const options = mimeType ? { mimeType } : undefined;
            const recorder = new MediaRecorder(camera.stream, options);

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    DigiSmileSession.media.chunks.push(e.data);
                }
            };

            recorder.onstop = () => {
                if (DigiSmileSession.media.chunks.length > 0) {
                    const blobType = DigiSmileSession.media.mimeType || 'video/webm';
                    const blob = new Blob(DigiSmileSession.media.chunks, { type: blobType });
                    DigiSmileSession.media.btsBlob = blob;
                    if (DigiSmileSession.media.objectUrl) {
                        URL.revokeObjectURL(DigiSmileSession.media.objectUrl);
                    }
                    DigiSmileSession.media.objectUrl = URL.createObjectURL(blob);
                }
                const btsBadge = document.getElementById('bts-recording-badge');
                if (btsBadge) btsBadge.style.display = 'none';
            };

            DigiSmileSession.media.recorder = recorder;
            DigiSmileSession.media.recording = true;
            recorder.start(500);

            const btsBadge = document.getElementById('bts-recording-badge');
            if (btsBadge) btsBadge.style.display = 'block';
        } catch (err) {
            console.warn('BTS MediaRecorder failed to start gracefully:', err);
        }
    }

    function stopBTSRecording() {
        if (DigiSmileSession.media.recorder && DigiSmileSession.media.recording) {
            try {
                DigiSmileSession.media.recording = false;
                if (DigiSmileSession.media.recorder.state !== 'inactive') {
                    DigiSmileSession.media.recorder.stop();
                }
            } catch (err) {
                console.warn('Error stopping BTS recorder:', err);
            }
        }
    }

    /**
     * DigiSmile Wizard Navigation Engine (Task 2 Framework API)
     */
    const STEP_NAMES = {
        1: 'start',
        2: 'capture',
        3: 'customize',
        4: 'finish'
    };

    const STEP_NUMBERS = {
        'start': 1,
        'capture': 2,
        'customize': 3,
        'finish': 4
    };

    function getRequiredPhotosCount(layoutVal) {
        const l = layoutVal || DigiSmileSession.layout || '4';
        if (l === 'polaroid' || l === '1') return 1;
        if (l === '2') return 2;
        if (l === '3') return 3;
        if (l === '5') return 5;
        return 4; // '4' and 'grid'
    }

    function canTransitionToStep(targetStep) {
        if (targetStep < 1 || targetStep > 4) return false;
        if (targetStep === 3 || targetStep === 4) {
            const required = getRequiredPhotosCount(DigiSmileSession.layout);
            if (capturedFrames.length < required) {
                alert(`Please take all ${required} photos before proceeding to Customize!`);
                return false;
            }
        }
        return true;
    }

    function updatePoseTrackerUI(currentIdx, totalCount) {
        const trackerEl = document.getElementById('pose-tracker');
        if (!trackerEl) return;
        trackerEl.innerHTML = '';

        for (let i = 0; i < totalCount; i++) {
            const dot = document.createElement('div');
            if (i < currentIdx) {
                dot.className = 'pose-dot done';
                dot.textContent = '✓';
            } else if (i === currentIdx) {
                dot.className = 'pose-dot active';
                dot.textContent = (i + 1);
            } else {
                dot.className = 'pose-dot';
                dot.textContent = (i + 1);
            }
            trackerEl.appendChild(dot);
        }
    }

    function updateStepperUI(activeStep) {
        const stepItems = document.querySelectorAll('.step-item');
        stepItems.forEach(item => {
            const stepNum = parseInt(item.getAttribute('data-step')) || 1;
            item.classList.remove('active', 'completed', 'upcoming');
            if (stepNum === activeStep) {
                item.classList.add('active');
            } else if (stepNum < activeStep) {
                item.classList.add('completed');
            } else {
                item.classList.add('upcoming');
            }
        });
    }

    function renderCurrentStepView(activeStep) {
        const stepViews = document.querySelectorAll('.step-view');
        stepViews.forEach(view => {
            view.classList.remove('active');
        });

        const targetViewId = `step-${STEP_NAMES[activeStep] || 'start'}`;
        const activeView = document.getElementById(targetViewId);
        if (activeView) {
            activeView.classList.add('active');
        }

        if (activeStep === 2) {
            if (camera && typeof camera.startStream === 'function') {
                camera.startStream();
            }
            const reqCount = getRequiredPhotosCount(DigiSmileSession.layout);
            updatePoseTrackerUI(capturedFrames.length, reqCount);
        }

        if (activeStep === 3) {
            renderCustomizePreview();
        }

        if (activeStep === 4) {
            renderFinishExportView();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function goToStep(targetStep, updateHash = true) {
        let targetNum = typeof targetStep === 'number' ? targetStep : (STEP_NUMBERS[targetStep] || 1);
        if (!canTransitionToStep(targetNum)) return false;

        DigiSmileSession.currentStep = targetNum;
        updateStepperUI(targetNum);
        renderCurrentStepView(targetNum);

        if (updateHash) {
            const hashName = STEP_NAMES[targetNum] || 'start';
            if (window.location.hash !== `#${hashName}`) {
                history.pushState(null, '', `#${hashName}`);
            }
        }
        return true;
    }

    function nextStep() {
        return goToStep(DigiSmileSession.currentStep + 1);
    }

    function previousStep() {
        return goToStep(DigiSmileSession.currentStep - 1);
    }

    function syncStepFromHash() {
        const hash = window.location.hash.replace('#', '');
        const stepNum = STEP_NUMBERS[hash] || 1;
        goToStep(stepNum, false);
    }

    window.addEventListener('hashchange', syncStepFromHash);

    document.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', () => {
            const stepNum = parseInt(item.getAttribute('data-step')) || 1;
            goToStep(stepNum);
        });
    });

    window.DigiSmileNav = {
        goToStep,
        nextStep,
        previousStep,
        canTransitionToStep,
        getCurrentStep: () => DigiSmileSession.currentStep
    };

    /**
     * Step 1: Configure Session Handlers
     */
    const layoutCards = document.querySelectorAll('.layout-card');
    const step1PaperSelect = document.getElementById('step1-paper-select');
    const startSessionBtn = document.getElementById('btn-start-session');

    function selectLayoutTemplate(layoutVal) {
        DigiSmileSession.layout = layoutVal;

        layoutCards.forEach(card => {
            const isSelected = card.getAttribute('data-layout') === layoutVal;
            card.classList.toggle('selected', isSelected);
            card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        });

        if (layoutSelect) {
            layoutSelect.value = layoutVal;
        }

        refreshPreviewBlueprint();
    }

    layoutCards.forEach(card => {
        const handleCardSelect = () => {
            const layoutVal = card.getAttribute('data-layout') || '4';
            selectLayoutTemplate(layoutVal);
        };

        card.addEventListener('click', handleCardSelect);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardSelect();
            }
        });
    });

    if (step1PaperSelect) {
        step1PaperSelect.addEventListener('change', (e) => {
            DigiSmileSession.borderTheme = e.target.value;
            if (borderSelect) {
                borderSelect.value = e.target.value;
            }
            refreshPreviewBlueprint();
        });
    }

    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', () => {
            goToStep(2);
        });
    }

    /**
     * Step 3: Customize Studio Handlers (60 FPS RAF Sliders, Auto Enhance, Presets & Preview)
     */
    const customizeFilterChips = document.querySelectorAll('#customize-filter-bar .filter-chip');
    const autoEnhanceBtn = document.getElementById('btn-auto-enhance');
    const btnBackToCapture = document.getElementById('btn-back-to-capture');
    const btnProceedToFinish = document.getElementById('btn-proceed-to-finish');
    const previewContainerElem = document.getElementById('render-strip-preview');

    let rafId = null;

    function renderCustomizePreview() {
        const targetContainer = document.getElementById('render-strip-preview') || stripContainer;
        if (targetContainer) {
            refreshPreviewBlueprint();
        }
    }

    function scheduleRAFUpdate() {
        DigiSmileSession.export.dirty = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            refreshPreviewBlueprint();
        });
    }

    customizeFilterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filterVal = chip.getAttribute('data-filter') || 'silver';
            DigiSmileSession.selectedPreset = filterVal;
            DigiSmileSession.export.dirty = true;

            customizeFilterChips.forEach(c => c.classList.toggle('active', c === chip));

            // Sync capture step filter bar active state
            document.querySelectorAll('#capture-filter-bar .filter-chip').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-filter') === filterVal);
            });

            if (filterSelect) filterSelect.value = filterVal;
            refreshPreviewBlueprint();
        });
    });

    // Capture Step Quick Filter chips (Step 2 accordion)
    const captureFilterChips = document.querySelectorAll('#capture-filter-bar .filter-chip');
    captureFilterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filterVal = chip.getAttribute('data-filter') || 'silver';
            DigiSmileSession.selectedPreset = filterVal;
            DigiSmileSession.export.dirty = true;

            captureFilterChips.forEach(c => c.classList.toggle('active', c === chip));

            // Sync customize step filter bar active state
            document.querySelectorAll('#customize-filter-bar .filter-chip').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-filter') === filterVal);
            });

            if (filterSelect) filterSelect.value = filterVal;
        });
    });

    if (autoEnhanceBtn) {
        autoEnhanceBtn.addEventListener('click', () => {
            DigiSmileSession.adjustments.brightness = 10;
            DigiSmileSession.adjustments.contrast = 15;
            DigiSmileSession.adjustments.warmth = 5;
            DigiSmileSession.adjustments.saturation = 115;
            DigiSmileSession.autoEnhanced = true;

            if (brightnessSlider) brightnessSlider.value = 10;
            if (contrastSlider) contrastSlider.value = 15;
            if (warmthSlider) warmthSlider.value = 5;
            if (saturationSlider) saturationSlider.value = 115;

            const valB = document.getElementById('val-brightness');
            const valC = document.getElementById('val-contrast');
            const valW = document.getElementById('val-warmth');
            const valS = document.getElementById('val-saturation');
            if (valB) valB.textContent = '+10';
            if (valC) valC.textContent = '+15';
            if (valW) valW.textContent = '+5';
            if (valS) valS.textContent = '115%';

            scheduleRAFUpdate();
        });
    }

    if (btnBackToCapture) {
        btnBackToCapture.addEventListener('click', () => {
            goToStep(2);
        });
    }

    if (btnProceedToFinish) {
        btnProceedToFinish.addEventListener('click', () => {
            goToStep(4);
        });
    }

    /**
     * Step 4: Finish & Export Handlers (Lazy Export Pipeline, Branded Filenames, Share & Reset)
     */
    const btnDownloadPng = document.getElementById('btn-download-png');
    const btnDownloadJpg = document.getElementById('btn-download-jpg');
    const btnShareFinish = document.getElementById('btn-share-finish');
    const btnPrintFinish = document.getElementById('btn-print-finish');
    const btnBackToCustomize = document.getElementById('btn-back-to-customize');
    const btnStartNewSession = document.getElementById('btn-start-new-session');

    function generateDigiSmileFilename(extension = 'png') {
        const rawCaption = (captionInput && captionInput.value.trim()) ? captionInput.value.trim() : 'memory';
        const cleanCaption = rawCaption.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
        const safeCaption = cleanCaption || 'photo';

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const sec = String(now.getSeconds()).padStart(2, '0');

        return `DigiSmile_${safeCaption}_${yyyy}-${mm}-${dd}_${hh}${min}${sec}.${extension}`;
    }

    const btnDownloadBts = document.getElementById('btn-download-bts');

    async function renderFinishExportView() {
        const finishContainer = document.getElementById('render-strip-finish');
        if (!finishContainer) return;

        if (DigiSmileSession.export.dirty || !DigiSmileSession.export.canvas) {
            if (window.StripEngine && typeof window.StripEngine.buildHighResCanvas === 'function') {
                const highResCanvas = await window.StripEngine.buildHighResCanvas(DigiSmileSession);
                DigiSmileSession.export.canvas = highResCanvas;
                DigiSmileSession.export.dirty = false;
            }
        }

        if (DigiSmileSession.export.canvas) {
            finishContainer.innerHTML = '';
            const imgPreview = new Image();
            imgPreview.src = DigiSmileSession.export.canvas.toDataURL('image/png');
            imgPreview.style.maxWidth = '100%';
            imgPreview.style.borderRadius = '12px';
            imgPreview.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
            finishContainer.appendChild(imgPreview);
        }

        if (btnDownloadBts) {
            if (DigiSmileSession.media.btsBlob && DigiSmileSession.media.objectUrl) {
                btnDownloadBts.style.display = 'flex';
            } else {
                btnDownloadBts.style.display = 'none';
            }
        }
    }

    function downloadCanvasFile(canvas, filename, mimeType) {
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL(mimeType, 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function resetDigiSmileSession() {
        stopBTSRecording();
        if (DigiSmileSession.media.objectUrl) {
            URL.revokeObjectURL(DigiSmileSession.media.objectUrl);
        }
        Object.assign(DigiSmileSession, createInitialSession());
        capturedFrames = [];
        const reqCount = getRequiredPhotosCount('4');
        updatePoseTrackerUI(0, reqCount);

        layoutCards.forEach(card => {
            const isSelected = card.getAttribute('data-layout') === '4';
            card.classList.toggle('selected', isSelected);
            card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        });

        goToStep(1);
    }

    if (btnDownloadBts) {
        btnDownloadBts.addEventListener('click', () => {
            if (DigiSmileSession.media.objectUrl) {
                const ext = DigiSmileSession.media.mimeType && DigiSmileSession.media.mimeType.includes('mp4') ? 'mp4' : 'webm';
                const filename = generateDigiSmileFilename(ext).replace('DigiSmile_', 'DigiSmile_BTS_');
                const link = document.createElement('a');
                link.download = filename;
                link.href = DigiSmileSession.media.objectUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }

    if (btnDownloadPng) {
        btnDownloadPng.addEventListener('click', () => {
            if (DigiSmileSession.export.canvas) {
                const filename = generateDigiSmileFilename('png');
                downloadCanvasFile(DigiSmileSession.export.canvas, filename, 'image/png');
            }
        });
    }

    if (btnDownloadJpg) {
        btnDownloadJpg.addEventListener('click', () => {
            if (DigiSmileSession.export.canvas) {
                const filename = generateDigiSmileFilename('jpg');
                downloadCanvasFile(DigiSmileSession.export.canvas, filename, 'image/jpeg');
            }
        });
    }

    if (btnShareFinish) {
        btnShareFinish.addEventListener('click', async () => {
            if (!DigiSmileSession.export.canvas) return;
            const filename = generateDigiSmileFilename('png');
            if (window.ShareEngine && typeof window.ShareEngine.shareCanvasFile === 'function') {
                const shared = await window.ShareEngine.shareCanvasFile(DigiSmileSession.export.canvas, filename);
                if (!shared) {
                    downloadCanvasFile(DigiSmileSession.export.canvas, filename, 'image/png');
                    alert('Web Share API not supported on this browser. Your photo strip has been downloaded!');
                }
            } else {
                downloadCanvasFile(DigiSmileSession.export.canvas, filename, 'image/png');
            }
        });
    }

    if (btnPrintFinish) {
        btnPrintFinish.addEventListener('click', () => {
            window.print();
        });
    }

    if (btnBackToCustomize) {
        btnBackToCustomize.addEventListener('click', () => {
            goToStep(3);
        });
    }

    if (btnStartNewSession) {
        btnStartNewSession.addEventListener('click', () => {
            resetDigiSmileSession();
        });
    }

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

    const customColorGroup = document.getElementById('custom-color-picker-group');
    const customPaperColorInput = document.getElementById('custom-paper-color');
    const customBorderColorInput = document.getElementById('custom-border-color');

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
            case 'polaroid': baseCss = "sepia(25%) saturate(125%) contrast(110%) brightness(105%)"; break;
            case 'fuji': baseCss = "saturate(135%) contrast(112%) hue-rotate(-5deg)"; break;
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

    // Custom Background Upload & Custom Color Picker Handlers
    if (borderSelect) {
        borderSelect.addEventListener('change', () => {
            if (bgUploadGroup) bgUploadGroup.style.display = (borderSelect.value === 'custom') ? 'block' : 'none';
            if (customColorGroup) customColorGroup.style.display = (borderSelect.value === 'custom-color') ? 'block' : 'none';
            refreshPreviewBlueprint();
        });
    }

    if (customPaperColorInput) customPaperColorInput.addEventListener('input', refreshPreviewBlueprint);
    if (customBorderColorInput) customBorderColorInput.addEventListener('input', refreshPreviewBlueprint);

    if (leakSelect) leakSelect.addEventListener('change', refreshPreviewBlueprint);
    if (grainSelect) grainSelect.addEventListener('change', refreshPreviewBlueprint);
    if (fontSelect) fontSelect.addEventListener('change', refreshPreviewBlueprint);
    if (subfontSelect) subfontSelect.addEventListener('change', refreshPreviewBlueprint);

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

    // Filter Custom Sliders Input Events (60 FPS RAF Throttling)
    [brightnessSlider, contrastSlider, warmthSlider, saturationSlider].forEach(slider => {
        if (slider) {
            slider.addEventListener('input', () => {
                const b = brightnessSlider ? parseInt(brightnessSlider.value) : 0;
                const c = contrastSlider ? parseInt(contrastSlider.value) : 0;
                const w = warmthSlider ? parseInt(warmthSlider.value) : 0;
                const s = saturationSlider ? parseInt(saturationSlider.value) : 100;

                DigiSmileSession.adjustments.brightness = b;
                DigiSmileSession.adjustments.contrast = c;
                DigiSmileSession.adjustments.warmth = w;
                DigiSmileSession.adjustments.saturation = s;

                const valB = document.getElementById('val-brightness');
                const valC = document.getElementById('val-contrast');
                const valW = document.getElementById('val-warmth');
                const valS = document.getElementById('val-saturation');
                if (valB) valB.textContent = b > 0 ? `+${b}` : b;
                if (valC) valC.textContent = c > 0 ? `+${c}` : c;
                if (valW) valW.textContent = w > 0 ? `+${w}` : w;
                if (valS) valS.textContent = `${s}%`;

                updateLiveVideoFilter();
                scheduleRAFUpdate();
            });
        }
    });

    // Quick Filter Chips Bar Handlers
    const quickFilterChips = document.querySelectorAll('.filter-chip');
    quickFilterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filterVal = chip.dataset.filter;
            if (filterSelect) filterSelect.value = filterVal;
            quickFilterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            updateLiveVideoFilter();
            document.querySelectorAll('.frame-slot img').forEach(img => img.className = `filter-${filterVal}`);
            refreshPreviewBlueprint();
        });
    });

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const val = filterSelect.value;
            quickFilterChips.forEach(c => c.classList.toggle('active', c.dataset.filter === val));
            updateLiveVideoFilter();
            document.querySelectorAll('.frame-slot img').forEach(img => img.className = `filter-${val}`);
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

    function getStripSettings() {
        return {
            layout: layoutSelect ? layoutSelect.value : '4',
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
            subtextFont: subfontSelect ? subfontSelect.value : 'mono',
            customPaperColor: customPaperColorInput ? customPaperColorInput.value : '#e2d9cc',
            customBorderColor: customBorderColorInput ? customBorderColorInput.value : '#b8ac9c'
        };
    }

    const mobileJumpBtn = document.getElementById('mobile-jump-btn');
    const newStripBtn = document.getElementById('new-strip-btn');
    const newStripPaneBtn = document.getElementById('new-strip-pane-btn');

    function resetPhotoboothSession() {
        capturedFrames = [];
        if (triggerBtn) {
            triggerBtn.style.display = 'inline-flex';
            triggerBtn.disabled = false;
        }
        if (newStripBtn) newStripBtn.style.display = 'none';
        if (newStripPaneBtn) newStripPaneBtn.style.display = 'none';
        if (exportBtn) exportBtn.style.display = 'none';
        if (shareBtn) shareBtn.style.display = 'none';
        if (printBtn) printBtn.style.display = 'none';
        if (retakeAllBtn) retakeAllBtn.style.display = 'none';

        refreshPreviewBlueprint();

        const videoViewport = document.querySelector('.video-viewport');
        if (videoViewport) {
            videoViewport.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    if (newStripBtn) newStripBtn.addEventListener('click', resetPhotoboothSession);
    if (newStripPaneBtn) newStripPaneBtn.addEventListener('click', resetPhotoboothSession);

    if (mobileJumpBtn) {
        mobileJumpBtn.addEventListener('click', () => {
            if (stripContainer) {
                stripContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Blueprint Layout Refresh Engine — Always canvas-rendered via StripEngine
    // Reads from DigiSmileSession (source of truth), never bails on missing DOM selects
    function refreshPreviewBlueprint() {
        const stripContainer = document.getElementById('render-strip-preview') || document.getElementById('render-strip-finish') || document.getElementById('render-strip');
        if (!stripContainer) return;

        // Always sync local capturedFrames into session before rendering
        DigiSmileSession.capturedFrames = capturedFrames;

        // Derive layout and theme from Session (source of truth) with DOM fallback
        const layoutMode = DigiSmileSession.layout || '4';
        const borderTheme = DigiSmileSession.borderTheme || 'vintage-card';
        const leakVal = (DigiSmileSession.adjustments && DigiSmileSession.adjustments.leak) || 'none';

        let targetCount = parseInt(layoutMode) || 4;
        if (layoutMode === 'grid') targetCount = 4;
        if (layoutMode === 'polaroid' || layoutMode === '1') targetCount = 1;
        if (layoutMode === '2') targetCount = 2;
        if (layoutMode === '5') targetCount = 5;

        // Sync Light Leak overlay on live camera video viewport
        const leakOverlayElem = document.getElementById('leak-overlay');
        if (leakOverlayElem) {
            leakOverlayElem.className = 'light-leak-overlay ' + (leakVal !== 'none' ? 'leak-' + leakVal : '');
        }

        // Always render the full canvas strip (placeholder slots if no photos yet)
        if (window.StripEngine) {
            const liveCanvas = StripEngine.buildHighResCanvas(DigiSmileSession);
            if (liveCanvas) {
                stripContainer.innerHTML = '';
                stripContainer.className = `strip-wrapper border-${borderTheme} layout-${layoutMode}`;
                stripContainer.style.cssText = 'background:none; opacity:1;';

                const liveImg = document.createElement('img');
                liveImg.src = liveCanvas.toDataURL('image/jpeg', 0.92);
                liveImg.style.cssText = 'max-width:100%; height:auto; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.6); display:block; margin:0 auto;';
                stripContainer.appendChild(liveImg);

                // Status badge update
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

                // Show/hide export buttons based on completion
                const isComplete = capturedFrames.length >= targetCount;
                if (exportBtn) exportBtn.style.display = isComplete ? 'block' : 'none';
                if (shareBtn) shareBtn.style.display = isComplete ? 'block' : 'none';
                if (gifBtn) gifBtn.style.display = isComplete ? 'block' : 'none';
                if (printBtn) printBtn.style.display = isComplete ? 'block' : 'none';
                if (retakeAllBtn) retakeAllBtn.style.display = isComplete ? 'inline-flex' : 'none';

                return;
            }
        }

        // Fallback: StripEngine not loaded — render minimal placeholder text
        stripContainer.innerHTML = '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:40px 20px;">📸 Loading preview engine...</p>';
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

    const retakeLastBtn = document.getElementById('retake-last-btn');
    const btnBackToStart = document.getElementById('btn-back-to-start');

    if (btnBackToStart) {
        btnBackToStart.addEventListener('click', () => {
            goToStep(1);
        });
    }

    if (retakeLastBtn) {
        retakeLastBtn.addEventListener('click', () => {
            if (capturedFrames.length > 0) {
                capturedFrames.pop();
                DigiSmileSession.capturedFrames = capturedFrames;
                DigiSmileSession.export.dirty = true;
                const reqCount = getRequiredPhotosCount(DigiSmileSession.layout);
                updatePoseTrackerUI(capturedFrames.length, reqCount);
                if (statusBadge) {
                    statusBadge.textContent = `⚡ Shot ${capturedFrames.length}/${reqCount} Taken`;
                    statusBadge.className = 'status-badge shooting';
                }
                if (capturedFrames.length === 0) {
                    if (retakeLastBtn) retakeLastBtn.style.display = 'none';
                    if (retakeAllBtn) retakeAllBtn.style.display = 'none';
                    if (statusBadge) {
                        statusBadge.textContent = '📸 Ready to Shoot';
                        statusBadge.className = 'status-badge ready';
                    }
                }
            }
        });
    }

    if (retakeAllBtn) {
        retakeAllBtn.addEventListener('click', () => {
            capturedFrames = [];
            DigiSmileSession.capturedFrames = [];
            DigiSmileSession.export.dirty = true;
            const reqCount = getRequiredPhotosCount(DigiSmileSession.layout);
            updatePoseTrackerUI(0, reqCount);
            if (retakeLastBtn) retakeLastBtn.style.display = 'none';
            if (retakeAllBtn) retakeAllBtn.style.display = 'none';
            if (triggerBtn) {
                triggerBtn.style.display = 'inline-flex';
                triggerBtn.disabled = false;
            }
            if (statusBadge) {
                statusBadge.textContent = '📸 Ready to Shoot';
                statusBadge.className = 'status-badge ready';
            }
        });
    }

    // Pill Selectors for Timer Delay (3s, 5s, 10s)
    const pillTimerBtns = document.querySelectorAll('#pill-timer-group .pill-btn');
    pillTimerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            pillTimerBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const val = btn.getAttribute('data-val');
            if (timerSelect) timerSelect.value = val;
        });
    });

    // Pill Selectors for Aspect Ratio (4:3, 16:9, 1:1)
    const pillAspectBtns = document.querySelectorAll('#pill-aspect-group .pill-btn');
    const formatBadgeText = document.querySelector('#viewfinder-format-badge span');
    const captureViewportElem = document.querySelector('.capture-viewport');
    pillAspectBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            pillAspectBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const val = btn.getAttribute('data-val');
            if (formatBadgeText) {
                formatBadgeText.textContent = `FORMAT: STANDARD ${val}`;
            }
            if (captureViewportElem) {
                if (val === '16:9') {
                    captureViewportElem.style.aspectRatio = '16/9';
                    captureViewportElem.style.maxHeight = '420px';
                } else if (val === '1:1') {
                    captureViewportElem.style.aspectRatio = '1/1';
                    captureViewportElem.style.maxHeight = '420px';
                } else {
                    captureViewportElem.style.aspectRatio = '4/3';
                    captureViewportElem.style.maxHeight = '480px';
                }
            }
        });
    });

    // Audio Shutter Toggle Switch
    const toggleAudioBtn = document.getElementById('toggle-audio-btn');
    if (toggleAudioBtn) {
        toggleAudioBtn.addEventListener('click', () => {
            toggleAudioBtn.classList.toggle('active');
            window.audioEnabled = toggleAudioBtn.classList.contains('active');
        });
    }

    // Toggle Mirror Switch
    const toggleMirrorSwitch = document.getElementById('toggle-mirror-switch');
    if (toggleMirrorSwitch) {
        toggleMirrorSwitch.addEventListener('change', () => {
            if (camera && typeof camera.toggleMirror === 'function') {
                camera.toggleMirror();
            }
        });
    }

    async function runCaptureSequence() {
        if (!triggerBtn) return;

        const targetCount = getRequiredPhotosCount(DigiSmileSession.layout);
        const timerDelay = parseInt(timerSelect ? timerSelect.value : 3) || 3;

        triggerBtn.disabled = true;
        if (retakeLastBtn) retakeLastBtn.style.display = 'none';
        if (retakeAllBtn) retakeAllBtn.style.display = 'none';

        const startIdx = capturedFrames.length;

        // Start BTS Motion Video Recording silently in background
        if (startIdx === 0) {
            startBTSRecording();
        }

        for (let step = startIdx; step < targetCount; step++) {
            updatePoseTrackerUI(step, targetCount);

            if (statusBadge) {
                statusBadge.textContent = `📸 Get Ready for Shot ${step + 1}/${targetCount}`;
                statusBadge.className = 'status-badge shooting';
            }

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

            if (countdownOverlay) countdownOverlay.textContent = 'SMILE! 📸';
            await new Promise(r => setTimeout(r, 300));
            if (countdownOverlay) countdownOverlay.style.display = 'none';

            if (flashOverlay) flashOverlay.classList.add('active');
            if (window.shutterAudio) window.shutterAudio.playShutterSound();
            if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
            if (flashOverlay) setTimeout(() => flashOverlay.classList.remove('active'), 120);

            const frameCanvas = camera.captureFrameToCanvas();
            capturedFrames[step] = frameCanvas;

            updatePoseTrackerUI(step + 1, targetCount);

            if (retakeLastBtn) retakeLastBtn.style.display = 'inline-flex';
            if (retakeAllBtn) retakeAllBtn.style.display = 'inline-flex';

            // Brief 1.2s pause between shots for comfortable pose reset
            if (step < targetCount - 1) {
                if (statusBadge) {
                    statusBadge.textContent = `✓ Shot ${step + 1} Taken! Reset Pose...`;
                    statusBadge.className = 'status-badge shooting';
                }
                await new Promise(r => setTimeout(r, 1200));
            }
        }

        // Stop BTS Video Recording upon final shot
        stopBTSRecording();

        triggerBtn.disabled = false;
        DigiSmileSession.capturedFrames = capturedFrames;
        DigiSmileSession.export.dirty = true;

        if (statusBadge) {
            statusBadge.textContent = '🎉 All Photos Captured!';
            statusBadge.className = 'status-badge complete';
        }

        await new Promise(r => setTimeout(r, 800));

        // Auto-advance to Step 3: Customize!
        goToStep(3);
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
            subtextFont: subfontSelect ? subfontSelect.value : 'mono',
            customPaperColor: customPaperColorInput ? customPaperColorInput.value : '#e2d9cc',
            customBorderColor: customBorderColorInput ? customBorderColorInput.value : '#b8ac9c'
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
            // Sync pill button state
            const mirrorPill = document.getElementById('mirror-toggle-pill');
            if (mirrorPill) {
                mirrorPill.classList.toggle('active', isMirrored);
                mirrorPill.textContent = '';
                mirrorPill.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M16 7l4 4-4 4"/><path d="M8 7L4 11l4 4"/></svg> Mirror ${isMirrored ? 'On' : 'Off'}`;
            }
        });
    }

    // Pill buttons in the accordion settings card (delegate to same actions)
    const camTogglePill = document.getElementById('cam-toggle-pill');
    const mirrorTogglePill = document.getElementById('mirror-toggle-pill');

    if (camTogglePill) {
        camTogglePill.addEventListener('click', () => {
            camera.toggleCameraFacingMode();
            // Show brief flash text
            const orig = camTogglePill.textContent;
            camTogglePill.textContent = '↩ Switching...';
            setTimeout(() => { camTogglePill.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8h-3l4 4 4-4h-3c0-3.3 2.7-6 6-6s6 2.7 6 6h-3l4 4 4-4h-3z"/></svg> Flip Camera`; }, 1200);
        });
    }

    if (mirrorTogglePill) {
        mirrorTogglePill.addEventListener('click', () => {
            const isMirrored = camera.toggleMirror();
            mirrorTogglePill.classList.toggle('active', isMirrored);
            mirrorTogglePill.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M16 7l4 4-4 4"/><path d="M8 7L4 11l4 4"/></svg> Mirror ${isMirrored ? 'On' : 'Off'}`;
            // Sync circle button state
            if (mirrorToggleBtn) mirrorToggleBtn.classList.toggle('active', isMirrored);
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
            const gifUrl = await GifEngine.createAnimatedGif(capturedFrames, getStripSettings(), 600);
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

    /**
     * Task 8: Safe PWA Hard-Refresh & ServiceWorker Purge Recovery Engine
     */
    async function hardRefreshApp() {
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }

            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
        } catch (err) {
            console.warn('Cache purge error during hardRefreshApp:', err);
        } finally {
            window.location.reload(true);
        }
    }

    window.hardRefreshApp = hardRefreshApp;

    const btnPwaUpdate = document.getElementById('btn-pwa-update');
    const mobileBtnPwaUpdate = document.getElementById('mobile-btn-pwa-update');

    if (btnPwaUpdate) btnPwaUpdate.addEventListener('click', hardRefreshApp);
    if (mobileBtnPwaUpdate) mobileBtnPwaUpdate.addEventListener('click', hardRefreshApp);

    // Automatic ServiceWorker Update Detection on App Load
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
            registration.addEventListener('updatefound', () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (btnPwaUpdate) {
                                btnPwaUpdate.innerHTML = '⚡ Update Available!';
                                btnPwaUpdate.style.background = 'rgba(245, 158, 11, 0.25)';
                                btnPwaUpdate.style.color = '#f59e0b';
                            }
                        }
                    };
                }
            });
        }).catch(err => {
            console.log('SW registration ready check bypass:', err);
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
