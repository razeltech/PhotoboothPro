/**
 * Camera Stream Hardware Interface
 */
class CameraController {
    constructor(videoElementId) {
        this.videoElementId = videoElementId;
        this.activeStream = null;
        this.facingMode = "user"; // "user" or "environment"
        this.isMirrored = true;
        this.availableDevicesCount = 0;
    }

    getVideoElement() {
        return document.getElementById(this.videoElementId);
    }

    async init() {
        await this.inspectHardwareDevices();
        return await this.startFeed();
    }

    async inspectHardwareDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            this.availableDevicesCount = videoDevices.length;
        } catch (e) {
            console.warn("Camera device enumeration failed", e);
        }
    }

    async startFeed() {
        const videoElement = this.getVideoElement();
        if (!videoElement) {
            console.warn("Video element not found on page:", this.videoElementId);
            return false;
        }

        if (this.activeStream) {
            this.activeStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            audio: false,
            video: {
                width: { ideal: 1920, min: 1280 },
                height: { ideal: 1080, min: 720 },
                facingMode: this.facingMode
            }
        };

        try {
            this.activeStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = this.activeStream;
            
            this.updateMirrorStyle();
            return true;
        } catch (err) {
            console.error("Camera access error:", err);
            return false;
        }
    }

    toggleCameraFacingMode() {
        this.facingMode = (this.facingMode === "user") ? "environment" : "user";
        this.isMirrored = (this.facingMode === "user");
        return this.startFeed();
    }

    toggleMirror() {
        this.isMirrored = !this.isMirrored;
        this.updateMirrorStyle();
        return this.isMirrored;
    }

    updateMirrorStyle() {
        const videoElement = this.getVideoElement();
        if (!videoElement) return;

        if (this.isMirrored) {
            videoElement.classList.add('mirrored');
        } else {
            videoElement.classList.remove('mirrored');
        }
    }

    captureFrameToCanvas() {
        const videoElement = this.getVideoElement();
        const width = (videoElement && videoElement.videoWidth) ? videoElement.videoWidth : 640;
        const height = (videoElement && videoElement.videoHeight) ? videoElement.videoHeight : 480;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (this.isMirrored) {
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
        }

        if (videoElement) {
            ctx.drawImage(videoElement, 0, 0, width, height);
        }
        return canvas;
    }
}

window.CameraController = CameraController;
