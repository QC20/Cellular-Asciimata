/**
 * Cellular ASCIImata - by humanbydefinition
 * Created for the #WCCChallenge - Theme: "Pattern"
 *
 * Enhanced with:
 *  - Cross-platform fullscreen (macOS, Windows, iOS, Android)
 *  - Momentum-based panning for organic scrolling feel
 *  - macOS trackpad: two-finger scroll panning + pinch-to-zoom
 *  - Windows: mouse wheel panning + Ctrl+wheel zoom
 *  - Mobile: swipe with inertia + pinch-to-zoom font cycling
 *  - iOS Safari and Chrome optimizations
 *  - Android Chrome and Firefox optimizations
 *
 * KEYBOARD CONTROLS:
 *  WASD        Move through the automaton space
 *  Space       Pause / unpause evolution
 *  R           Reset with new seeds and parameters
 *  F           Toggle fullscreen
 *  K           Cycle kaleidoscope segments (off, 1, 2, 4, 8)
 *  I           Toggle character inversion
 *  B           Switch background color
 *  C           Cycle character color modes
 *  + / -       Adjust font size
 *
 * MOUSE / TRACKPAD:
 *  Click+drag          Pan the viewport
 *  Scroll (wheel)      Pan the viewport
 *  Ctrl+scroll         Zoom (cycle font sizes)
 *  Pinch (trackpad)    Zoom (cycle font sizes)
 *
 * TOUCH (phones and tablets):
 *  Swipe               Pan with momentum
 *  Pinch               Zoom (cycle font sizes)
 *  Double-tap           Cycle font sizes
 */

// ─── Platform detection ────────────────────────────────────────────
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/.test(navigator.userAgent);
const IS_MOBILE = IS_IOS || IS_ANDROID;
const IS_MACOS = /Mac/.test(navigator.platform) && !IS_IOS;

// ─── View and navigation state ─────────────────────────────────────
let offsetX = 0;
let offsetY = 0;

// Smooth interpolated offset for organic feel
let targetOffsetX = 0;
let targetOffsetY = 0;
const LERP_FACTOR = 0.25; // How quickly the view catches up to the target

// Momentum state for panning
let velocityX = 0;
let velocityY = 0;
const FRICTION = 0.92;            // Momentum decay per frame
const MIN_VELOCITY = 0.05;        // Below this threshold, stop
const VELOCITY_SCALE = 0.6;       // Scale velocity from drag deltas

// Mouse drag state
let prevMouseX = 0;
let prevMouseY = 0;
let isDragging = false;
let dragDeltaX = 0;
let dragDeltaY = 0;

// Touch state
let touchStartX = 0;
let touchStartY = 0;
let lastTapTime = 0;
const DOUBLE_TAP_DELAY = 300;
let isTouching = false;
let touchDeltaX = 0;
let touchDeltaY = 0;

// Pinch-to-zoom state
let initialPinchDist = 0;
let isPinching = false;
const PINCH_THRESHOLD = 50; // Pixel distance change to trigger a zoom step

// Wheel zoom accumulator (for trackpad pinch and Ctrl+scroll)
let zoomAccumulator = 0;

// Simulation state
let isPaused = false;

// ─── Display settings ──────────────────────────────────────────────
let fontSizes = [8, 16, 32, 64, 128];
let selectedFontSize = IS_MOBILE ? 16 : 8;

// "1BIT MONITOR GLOW" by "Polyducks"
let backgroundColors = ["#222323", "#f0f6f0"];
let selectedBackgroundColor = backgroundColors[0];

let availableKaleidoscopeSegments = [1, 2, 4, 8];

let characterColorMode = 0; // 0: brightness, 1: fixed

let invertCharacters = false;

let caCanvasWidth = 1024;
let caCanvasHeight = 1024;

let charsets = [
    "\u00C6\u00AB\u00EE\u2561\u03A3\u03A9\u00E6\u03B4\u03C3\u2510\u00EC\u00BB\u00C9",
    "\u203C\u2568\u221E\u03C6\u00B2\u207F\u03C4\u00BF\u00E6",
    "\u2568\u25D8\u2592\u2593\u00DC\u00D6\u00EB\u00E8\u255C\u255D\u00BC\u00A1",
    " .:,'-^*+?!|=0#X%WM@",
    " .:-=+*#%@",
    "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. "
];

let colorPalettes = [
    [ // "ST 24" by "Skiller Thomson"
        "#111126", "#141433", "#17174d", "#281d73", "#3e2680", "#6c29a6",
        "#8136b3", "#ba41d9", "#de73e5", "#ed9df2", "#e9c2f2", "#ffffff",
        "#dae7f2", "#9de7f2", "#73c7e5", "#4192d9", "#3670b3", "#295ba6",
        "#23468c", "#1d2873", "#2953a6", "#3663b3", "#417ed9", "#73a8e5"
    ],
    [ // "MULFOK32" by "mulfok"
        "#5ba675", "#6bc96c", "#abdd64", "#fcef8d", "#ffb879", "#ea6262",
        "#cc425e", "#a32858", "#751756", "#390947", "#611851", "#873555",
        "#a6555f", "#c97373", "#f2ae99", "#ffc3f2", "#ee8fcb", "#d46eb3",
        "#873e84", "#1f102a", "#4a3052", "#7b5480", "#a6859f", "#d9bdc8",
        "#ffffff", "#aee2ff", "#8db7ff", "#6d80fa", "#8465ec", "#834dc4",
        "#7d2da0", "#4e187c"
    ],
    [ // "CC-29" by "Alpha6"
        "#f2f0e5", "#b8b5b9", "#868188", "#646365", "#45444f", "#3a3858",
        "#212123", "#352b42", "#43436a", "#4b80ca", "#68c2d3", "#a2dcc7",
        "#ede19e", "#d3a068", "#b45252", "#6a536e", "#4b4158", "#80493a",
        "#a77b5b", "#e5ceb4", "#c2d368", "#8ab060", "#567b79", "#4e584a",
        "#7b7243", "#b2b47e", "#edc8c4", "#cf8acb", "#5f556a"
    ]
];

let caShader;
let gridShader;
let zoomShader;

let seed;

let previousFramebuffer;
let nextFramebuffer;
let rotationFramebuffer;
let gridFramebuffer;
let zoomFramebuffer;

let grid;

let kaleidoscopeEffect;
let colorPaletteEffect;

// ─── Fullscreen helpers ────────────────────────────────────────────

function isFullscreen() {
    return !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement);
}

function enterFullscreen() {
    let el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
}

function exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
}

function toggleFullscreen() {
    if (isFullscreen()) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

function handleFullscreenChange() {
    // Give the browser a moment to settle the new dimensions
    setTimeout(() => {
        resizeCanvas(windowWidth, windowHeight);
        if (grid) {
            gridFramebuffer.resize(grid.cols, grid.rows);
            // Clamp offsets to new grid dimensions
            targetOffsetX = constrain(targetOffsetX, 0, caCanvasWidth - grid.cols);
            targetOffsetY = constrain(targetOffsetY, 0, caCanvasHeight - grid.rows);
            offsetX = targetOffsetX;
            offsetY = targetOffsetY;
        }
    }, 100);
}

// ─── Touch utility ─────────────────────────────────────────────────

function pinchDistance(t1, t2) {
    let dx = t1.x - t2.x;
    let dy = t1.y - t2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// ─── Offset clamping utility ───────────────────────────────────────

function clampTarget() {
    if (!grid) return;
    targetOffsetX = constrain(targetOffsetX, 0, caCanvasWidth - grid.cols);
    targetOffsetY = constrain(targetOffsetY, 0, caCanvasHeight - grid.rows);
}

// ─── p5 lifecycle ──────────────────────────────────────────────────

function preload() {
    caShader = createShader(VERT_SHADER, CA_FRAG_SHADER);
    gridShader = createShader(VERT_SHADER, GRID_FRAG_SHADER);
    zoomShader = createShader(VERT_SHADER, ZOOM_FRAG_SHADER);
}

function setup() {
    describe("An interactive and animated cellular automaton visualized as a dynamic grid of ASCII characters, showcasing complex patterns and behaviors.");

    frameRate(60);
    pixelDensity(1);

    createCanvas(windowWidth, windowHeight, WEBGL);

    // Sort palettes by brightness
    colorPalettes.forEach(palette => {
        palette.sort((a, b) => brightness(color(a)) - brightness(color(b)));
    });

    seed = random(0, 100);

    previousFramebuffer = createFramebuffer({ format: FLOAT, width: caCanvasWidth, height: caCanvasHeight });
    nextFramebuffer = createFramebuffer({ format: FLOAT, width: caCanvasWidth, height: caCanvasHeight });
    rotationFramebuffer = createFramebuffer({ format: FLOAT, width: caCanvasWidth, height: caCanvasHeight });
    gridFramebuffer = createFramebuffer({ format: FLOAT, width: 1, height: 1 });
    zoomFramebuffer = createFramebuffer({ format: FLOAT });

    grid = P5Asciify.grid;

    setAsciiOptions({
        common: { fontSize: selectedFontSize },
        brightness: {
            enabled: true,
            characterColorMode: characterColorMode,
            characterColor: backgroundColors[1],
            characters: charsets[Math.floor(random() * charsets.length)],
            invertMode: invertCharacters,
            backgroundColor: selectedBackgroundColor,
        },
    });

    let randomPalette = colorPalettes[Math.floor(random() * colorPalettes.length)];
    colorPaletteEffect = addAsciiEffect("pre", "colorpalette", { palette: randomPalette });

    kaleidoscopeEffect = addAsciiEffect("pre", "kaleidoscope", { segments: 1, angle: 0 });
    kaleidoscopeEffect.enabled = false;

    // ── Register event listeners ──

    let canvasEl = document.querySelector('canvas');

    // Wheel: trackpad two-finger scroll (macOS), mouse wheel (Windows), pinch-to-zoom
    canvasEl.addEventListener('wheel', handleWheel, { passive: false });

    // Fullscreen change events (all browser prefixes)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Prevent iOS Safari overscroll and bounce on the entire document
    document.addEventListener('touchmove', preventOverscroll, { passive: false });

    // Prevent double-tap-to-zoom on iOS Safari
    document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });

    // Context menu blocks long-press on mobile
    canvasEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // Prevent iOS 10+ pinch-to-zoom on the page itself (we handle it ourselves)
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gestureend', function (e) { e.preventDefault(); }, { passive: false });
}

function preventOverscroll(e) {
    // Only prevent if touch is on the canvas, so we don't break other page elements
    if (e.target.tagName === 'CANVAS') {
        e.preventDefault();
    }
}

function handleWheel(e) {
    e.preventDefault();

    if (e.ctrlKey) {
        // Pinch-to-zoom on macOS trackpad, or Ctrl+scroll on Windows
        zoomAccumulator += e.deltaY;
        if (Math.abs(zoomAccumulator) >= 50) {
            cycleFontSize(zoomAccumulator < 0 ? 1 : -1);
            zoomAccumulator = 0;
        }
    } else {
        // Pan. Scale factor depends on input device:
        // deltaMode 0 = pixels (trackpad), deltaMode 1 = lines (mouse wheel click)
        let scale = e.deltaMode === 0 ? 0.15 : 3;

        // On macOS trackpad, both axes are meaningful.
        // On Windows mouse wheel, deltaY dominates.
        targetOffsetX += e.deltaX * scale;
        targetOffsetY += e.deltaY * scale;
        clampTarget();

        // Kill any residual momentum so the wheel input feels direct
        velocityX = 0;
        velocityY = 0;
    }
}

function draw() {
    if (frameCount === 1) {
        gridFramebuffer.resize(grid.cols, grid.rows);
        targetOffsetX = floor(random(0, caCanvasWidth - grid.cols));
        targetOffsetY = floor(random(0, caCanvasHeight - grid.rows));
        offsetX = targetOffsetX;
        offsetY = targetOffsetY;
    }

    // ── Apply momentum ──
    if (!isDragging && !isTouching) {
        if (Math.abs(velocityX) > MIN_VELOCITY || Math.abs(velocityY) > MIN_VELOCITY) {
            targetOffsetX -= velocityX;
            targetOffsetY -= velocityY;
            clampTarget();
            velocityX *= FRICTION;
            velocityY *= FRICTION;
        } else {
            velocityX = 0;
            velocityY = 0;
        }
    }

    // ── Smooth interpolation toward target ──
    offsetX = lerp(offsetX, targetOffsetX, LERP_FACTOR);
    offsetY = lerp(offsetY, targetOffsetY, LERP_FACTOR);

    // ── Cellular automaton step ──
    if (!isPaused) {
        [previousFramebuffer, nextFramebuffer] = [nextFramebuffer, previousFramebuffer];

        nextFramebuffer.begin();
        shader(caShader);
        caShader.setUniform('u_resolution', [caCanvasWidth, caCanvasHeight]);
        caShader.setUniform('u_frameCount', frameCount);
        caShader.setUniform('u_seed', seed);
        caShader.setUniform('u_previousIterationTexture', previousFramebuffer);
        rect(0, 0, caCanvasWidth, caCanvasHeight);
        nextFramebuffer.end();
    }

    // ── Viewport extraction ──
    gridFramebuffer.begin();
    shader(gridShader);
    gridShader.setUniform('u_inputTexture', nextFramebuffer);
    gridShader.setUniform('u_offset', [Math.round(offsetX), Math.round(offsetY)]);
    rect(0, 0, grid.cols, grid.rows);
    gridFramebuffer.end();

    // ── Zoom to screen ──
    zoomFramebuffer.begin();
    shader(zoomShader);
    zoomShader.setUniform('u_resolution', [windowWidth, windowHeight]);
    zoomShader.setUniform('u_gridDimensions', [grid.cols, grid.rows]);
    zoomShader.setUniform('u_inputTexture', gridFramebuffer);
    rect(0, 0, windowWidth, windowHeight);
    zoomFramebuffer.end();

    image(zoomFramebuffer, -windowWidth / 2, -windowHeight / 2);

    // ── Keyboard continuous movement ──
    let moveSpeed = IS_MOBILE ? 2 : 1;
    if (keyIsDown(87)) targetOffsetY = max(0, targetOffsetY - moveSpeed); // W
    if (keyIsDown(83)) targetOffsetY = min(caCanvasHeight - grid.rows, targetOffsetY + moveSpeed); // S
    if (keyIsDown(65)) targetOffsetX = max(0, targetOffsetX - moveSpeed); // A
    if (keyIsDown(68)) targetOffsetX = min(caCanvasWidth - grid.cols, targetOffsetX + moveSpeed); // D
}

// ─── Mouse interaction ─────────────────────────────────────────────

function mousePressed() {
    isDragging = true;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    dragDeltaX = 0;
    dragDeltaY = 0;
    // Kill momentum when user grabs the viewport
    velocityX = 0;
    velocityY = 0;
}

function mouseReleased() {
    if (isDragging) {
        // Launch momentum from the last drag delta
        velocityX = dragDeltaX * VELOCITY_SCALE;
        velocityY = dragDeltaY * VELOCITY_SCALE;
    }
    isDragging = false;
}

function mouseDragged() {
    if (isDragging) {
        let dx = mouseX - prevMouseX;
        let dy = mouseY - prevMouseY;

        targetOffsetX -= dx;
        targetOffsetY -= dy;
        clampTarget();

        // Track the most recent drag delta for momentum launch
        dragDeltaX = dx;
        dragDeltaY = dy;

        prevMouseX = mouseX;
        prevMouseY = mouseY;
    }
    return false;
}

// ─── Touch interaction ─────────────────────────────────────────────

function touchStarted() {
    if (touches.length === 2) {
        // Start pinch gesture
        isPinching = true;
        isTouching = false;
        initialPinchDist = pinchDistance(touches[0], touches[1]);
        velocityX = 0;
        velocityY = 0;
        return false;
    }

    // Single touch: check for double-tap
    let currentTime = millis();
    if (currentTime - lastTapTime < DOUBLE_TAP_DELAY) {
        cycleFontSize(1);
        lastTapTime = 0;
        return false;
    }

    isTouching = true;
    touchStartX = touches[0].x;
    touchStartY = touches[0].y;
    touchDeltaX = 0;
    touchDeltaY = 0;
    lastTapTime = currentTime;

    // Kill momentum on new touch
    velocityX = 0;
    velocityY = 0;

    return false;
}

function touchMoved() {
    if (isPinching && touches.length >= 2) {
        let currentDist = pinchDistance(touches[0], touches[1]);
        let diff = currentDist - initialPinchDist;
        if (Math.abs(diff) > PINCH_THRESHOLD) {
            cycleFontSize(diff > 0 ? 1 : -1);
            initialPinchDist = currentDist;
        }
        return false;
    }

    if (isTouching && touches.length === 1) {
        let dx = touches[0].x - touchStartX;
        let dy = touches[0].y - touchStartY;

        targetOffsetX -= dx;
        targetOffsetY -= dy;
        clampTarget();

        // Store delta for momentum
        touchDeltaX = dx;
        touchDeltaY = dy;

        touchStartX = touches[0].x;
        touchStartY = touches[0].y;
    }
    return false;
}

function touchEnded() {
    if (isPinching) {
        // End pinch when fewer than 2 fingers remain
        if (touches.length < 2) {
            isPinching = false;
        }
        return false;
    }

    if (isTouching) {
        // Launch momentum from final swipe delta
        velocityX = touchDeltaX * VELOCITY_SCALE;
        velocityY = touchDeltaY * VELOCITY_SCALE;
        isTouching = false;
    }
    return false;
}

// ─── Keyboard interaction ──────────────────────────────────────────

function keyPressed() {
    if (key === "+") cycleFontSize(1);
    if (key === "-") cycleFontSize(-1);

    if (key === "f" || key === "F") toggleFullscreen();

    if (key === " ") {
        isPaused = !isPaused;
        return false; // Prevent page scroll on space
    }

    if (key === "r") {
        frameCount = 1;
        seed = random(0, 100);

        targetOffsetX = floor(random(0, caCanvasWidth - grid.cols));
        targetOffsetY = floor(random(0, caCanvasHeight - grid.rows));
        offsetX = targetOffsetX;
        offsetY = targetOffsetY;
        velocityX = 0;
        velocityY = 0;

        previousFramebuffer.begin();
        clear();
        previousFramebuffer.end();

        nextFramebuffer.begin();
        clear();
        nextFramebuffer.end();

        setAsciiOptions({
            brightness: {
                characters: charsets[Math.floor(random() * charsets.length)],
            },
        });

        let randomPalette = colorPalettes[Math.floor(random() * colorPalettes.length)];
        colorPaletteEffect.palette = randomPalette;
    }

    if (key === "k") {
        if (!kaleidoscopeEffect.enabled) {
            kaleidoscopeEffect.enabled = true;
            kaleidoscopeEffect.segments = availableKaleidoscopeSegments[0];
        } else {
            let index = availableKaleidoscopeSegments.indexOf(kaleidoscopeEffect.segments);
            if (index === availableKaleidoscopeSegments.length - 1) {
                kaleidoscopeEffect.enabled = false;
            } else {
                kaleidoscopeEffect.segments = availableKaleidoscopeSegments[(index + 1) % availableKaleidoscopeSegments.length];
            }
        }
    }

    if (key === "i") {
        invertCharacters = !invertCharacters;
        setAsciiOptions({ brightness: { invertMode: invertCharacters } });
    }

    if (key === "b") {
        let index = (backgroundColors.indexOf(selectedBackgroundColor) + 1) % backgroundColors.length;
        selectedBackgroundColor = backgroundColors[index];
        setAsciiOptions({ brightness: { backgroundColor: selectedBackgroundColor } });
    }

    if (key === "c") {
        characterColorMode = characterColorMode === 0 ? 1 : 0;
        setAsciiOptions({ brightness: { characterColorMode: characterColorMode } });
    }
}

// ─── Window resize ─────────────────────────────────────────────────

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (grid) {
        gridFramebuffer.resize(grid.cols, grid.rows);
        clampTarget();
    }
}

// ─── Font size cycling ─────────────────────────────────────────────

function cycleFontSize(direction = 1) {
    let index = fontSizes.indexOf(selectedFontSize);
    index = (index + direction + fontSizes.length) % fontSizes.length;
    selectedFontSize = fontSizes[index];
    setAsciiOptions({ common: { fontSize: selectedFontSize } });
    if (grid) {
        gridFramebuffer.resize(grid.cols, grid.rows);
        clampTarget();
    }
}
