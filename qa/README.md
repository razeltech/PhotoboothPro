# Aerobooth QA Testing Documentation

This document outlines the Manual Quality Assurance (QA) Checklist and the Automated E2E Testing Suite using Playwright for the **Aerobooth** premium retro photobooth application.

---

## 📱 Responsiveness & Adaptability Design Plan

Aerobooth has been engineered with desktop-first precision and mobile-first fluid mechanics:
1. **Fluid Containers**: Centralized cards and stages use flexible Tailwind limits (`w-full max-w-6xl mx-auto px-4 md:px-8`) preventing wide stretching on wide-screens and side bleed on small devices.
2. **Dynamic Viewport Scaling**: Live camera viewfinder dynamically shifts its canvas aspect ratio (`aspect-[4/3]`, `aspect-video`, or `aspect-square`) based on user preferences.
3. **Adaptive Form Layout**:
   - **Desktop**: A parallel bento-grid split layout. The live customized strip occupies the left side while parameters sit in the right sidebar.
   - **Mobile**: Collapses gracefully into a stacked layout, turning sidebars into step-by-step swipe tabs or vertical scrollable modules.
4. **Touch Targets**: Handheld buttons maintain a minimum size of `44px` for natural thumb tap feedback.

---

## 📋 Manual QA Test Plan Matrix

| Step ID | Category | Feature Under Test | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **QA-001** | Landing | Template Selection | Clicking template cards (e.g. Vintage Strip, Polaroid, Purikura Grid, Duo) highlights the selection with a neon glow border and plays tactile tone. |
| **QA-002** | Camera | Permission Request | Loading the Camera View triggers standard browser media consent. Refusal loads the helpful fallback error panel gracefully. |
| **QA-003** | Camera | Aspect Ratio Preference | Toggling between **4:3**, **16:9**, and **1:1** shifts the camera live stream viewport size instantly without restarting the capture cycle. |
| **QA-004** | Camera | Capture Flow & Sound | Clicking "Start Capture" counts down (3s, 5s, 10s) with sound ticks, flashes, plays physical shutter click, captures photo, and displays transient preview overlays. |
| **QA-005** | Customize | Border Bases | Clicking Custom border styles changes the frame background instantly. |
| **QA-006** | Customize | Custom BG Upload | Dragging & dropping or selecting an image uploads and sets it as frame background. Toggles for Opacity, Layout Format (Fill Cover, Fit Center, Tile Repeat), and Tiling Scale operate in real-time. |
| **QA-007** | Customize | Captions & Filters | Selecting custom layout pairings (e.g., Editorial, Retro, Brutalist) changes fonts and styling instantly. Adjusting the Film Grain or Vignette sliders applies effects in real-time. |
| **QA-008** | Export | Perfect Compile | Clicking "Download JPG" or "Download PNG" generates high-resolution print files. Source images are mathematically center-cropped (`object-cover` style) on the HTML Canvas to eliminate stretching bugs! |

---

## 🤖 Automated Playwright E2E Tests

The Playwright tests inside `qa/photobooth.spec.ts` automate:
- **Responsive Layout Verification**: Runs tests under Desktop (1280x800), Tablet (768x1024), and Mobile (375x667) to assert correct layout structures.
- **Landing UI Flow**: Asserts core template cards exist and select successfully.
- **Dynamic Viewport Adjustments**: Validates camera settings, such as aspect ratio toggling.
- **Download Stability**: Checks that download and back triggers work correctly.

### Running the Tests Locally

We have created an automated test script (`test-local.sh`) that installs dependencies, provisions Playwright browser binaries, and executes the test suite.

To run the automated script:
```bash
# Make the script executable
chmod +x test-local.sh

# Run the automated script
./test-local.sh
```

Alternatively, you can run steps manually:

Ensure all dependencies are installed:
```bash
npm install
npx playwright install chromium
```

To run tests in headless mode:
```bash
npx playwright test
```

To run with visual browser UI (Interactive mode):
```bash
npx playwright test --ui
```

To view the generated test reports:
```bash
npx playwright show-report
```
