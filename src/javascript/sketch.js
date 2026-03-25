/**
 * Cellular ASCIImata - by humanbydefinition
 * Created for the #WCCChallenge - Theme: "Pattern"
 * 
 * This interactive sketch features a cellular automaton that is being rendered on a 1024x1024 canvas,
 * which is then further processed before it's ready to be parsed by p5.asciify, a p5.js add-on library.
 * 
 * The cellular automaton shader is based on a submission on shadertoy by 'laserbat': https://www.shadertoy.com/view/dttyRX
 * Implementation features a slightly modified von Neumann neighborhood and a few other tweaks.
 * https://en.wikipedia.org/wiki/Von_Neumann_neighborhood
 * 
 * KEYBOARD+MOUSE CONTROLS:
 * - WASD: Move the view
 * - Mouse drag: Move the view
 * - Space: Pause or unpause
 * - r: Reset the sketch (resets cellular automaton with a new seed, color palette, character set and position)
 * - k: Cycle through kaleidoscope segments (off, 1, 2, 4, 8)
 * - i: Invert characters (swaps the ascii character color with its cell background color)
 * - b: Cycle through background colors (black, white)
 * - c: Cycle through character color modes (brightness, fixed [white])
 * - +: Increase font size (8, 16, 32, 64, 128)
 * - -: Decrease font size (8, 16, 32, 64, 128)
 *
 * TOUCH CONTROLS:
 * - Swipe around to move the view
 * - Double tap to cycle through the pre-defined font sizes
 */

let offsetX = 0;
let offsetY = 0;
let prevMouseX = 0;
let prevMouseY = 0;
let touchStartX = 0;
let touchStartY = 0;
let lastTapTime = 0;
const doubleTapDelay = 300; // milliseconds
let isTouching = false;
let isDragging = false;
let isPaused = false;

let fontSizes = [8, 16, 32, 64, 128];
let selectedFontSize = 8;

// "1BIT MONITOR GLOW" by "Polyducks" -> https://lospec.com/palette-list/1bit-monitor-glow
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
    [ // "ST 24" by "Skiller Thomson" -> https://lospec.com/palette-list/st-24
        "#111126", "#141433", "#17174d", "#281d73", "#3e2680", "#6c29a6",
        "#8136b3", "#ba41d9", "#de73e5", "#ed9df2", "#e9c2f2", "#ffffff",
        "#dae7f2", "#9de7f2", "#73c7e5", "#4192d9", "#3670b3", "#295ba6",
        "#23468c", "#1d2873", "#2953a6", "#3663b3", "#417ed9", "#73a8e5"
    ],
    [ // "MULFOK32" by "mulfok" -> https://lospec.com/palette-list/mulfok32
        "#5ba675", "#6bc96c", "#abdd64", "#fcef8d", "#ffb879", "#ea6262",
        "#cc425e", "#a32858", "#751756", "#390947", "#611851", "#873555",
        "#a6555f", "#c97373", "#f2ae99", "#ffc3f2", "#ee8fcb", "#d46eb3",
        "#873e84", "#1f102a", "#4a3052", "#7b5480", "#a6859f", "#d9bdc8",
        "#ffffff", "#aee2ff", "#8db7ff", "#6d80fa", "#8465ec", "#834dc4",
        "#7d2da0", "#4e187c"
    ],
    [ // "CC-29" by "Alpha6" -> https://lospec.com/palette-list/cc-29
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

let zoomAccumulator = 0;

let seed;

let previousFramebuffer;
let nextFramebuffer;
let rotationFramebuffer;
let gridFramebuffer;
let zoomFramebuffer;

let grid;

let kaleidoscopeEffect;
let colorPaletteEffect;

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

    // Sort colors in each palette by brightness
    colorPalettes.forEach(palette => {
        palette.sort((a, b) => {
            let colorA = color(a);
            let colorB = color(b);
            return brightness(colorA) - brightness(colorB);
        });
    });

    seed = random(0, 100);

    previousFramebuffer = createFramebuffer({ format: FLOAT, width: caCanvasWidth, height: caCanvasHeight });
    nextFramebuffer = createFramebuffer({ format: FLOAT, width: caCanvasWidth, height: caCanvasHeight });
    rotationFramebuffer = createFramebuffer({ format: FLOAT, width: caCanvasWidth, height: caCanvasHeight });
    gridFramebuffer = createFramebuffer({ format: FLOAT, width: 1, height: 1 }); // Gets resized in draw at frame 1
    zoomFramebuffer = createFramebuffer({ format: FLOAT });

    grid = P5Asciify.grid; // Get the grid object from p5.asciify for measurements

    setAsciiOptions({
        common: {
            fontSize: selectedFontSize,
        },
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

    // Wheel: two-finger pan (macOS trackpad / Windows scroll) + pinch-to-zoom (macOS) / Ctrl+scroll (Windows)
    let canvasEl = document.querySelector('canvas');
    canvasEl.addEventListener('wheel', function (e) {
        e.preventDefault();
        if (e.ctrlKey) {
            // Pinch-to-zoom (macOS trackpad pinch) or Ctrl+scroll (Windows / macOS)
            zoomAccumulator += e.deltaY;
            if (Math.abs(zoomAccumulator) >= 50) {
                cycleFontSize(zoomAccumulator < 0 ? 1 : -1);
                zoomAccumulator = 0;
            }
        } else {
            // Pan — scale by delta mode: 0 = pixels (trackpad), 1 = lines (mouse wheel)
            let s = e.deltaMode === 0 ? 0.15 : 3;
            offsetX = constrain(offsetX + e.deltaX * s, 0, caCanvasWidth - grid.cols);
            offsetY = constrain(offsetY + e.deltaY * s, 0, caCanvasHeight - grid.rows);
        }
    }, { passive: false });
}

function draw() {
    if (frameCount === 1) {
        gridFramebuffer.resize(grid.cols, grid.rows);
        offsetX = floor(random(0, caCanvasWidth - grid.cols));
        offsetY = floor(random(0, caCanvasHeight - grid.rows));
    }

    if (!isPaused) {
        // Cycle the framebuffers
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

    gridFramebuffer.begin();
    shader(gridShader);
    gridShader.setUniform('u_inputTexture', nextFramebuffer);
    gridShader.setUniform('u_offset', [offsetX, offsetY]);
    rect(0, 0, grid.cols, grid.rows);
    gridFramebuffer.end();

    zoomFramebuffer.begin();
    shader(zoomShader);
    zoomShader.setUniform('u_resolution', [windowWidth, windowHeight]);
    zoomShader.setUniform('u_gridDimensions', [grid.cols, grid.rows]);
    zoomShader.setUniform('u_inputTexture', gridFramebuffer);
    rect(0, 0, windowWidth, windowHeight);
    zoomFramebuffer.end();

    image(zoomFramebuffer, -windowWidth / 2, -windowHeight / 2);

    if (keyIsDown(87)) { // 'w' key
        offsetY = max(0, offsetY - 1);
    }

    if (keyIsDown(83)) { // 's' key
        offsetY = min(caCanvasHeight - (grid.rows), offsetY + 1);
    }

    if (keyIsDown(65)) { // 'a' key
        offsetX = max(0, offsetX - 1);
    }

    if (keyIsDown(68)) { // 'd' key
        offsetX = min(caCanvasWidth - (grid.cols), offsetX + 1);
    }
}

function mousePressed() {
    isDragging = true;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
}

function mouseReleased() {
    isDragging = false;
}

function mouseDragged() {
    if (isDragging) {
        let dx = mouseX - prevMouseX;
        let dy = mouseY - prevMouseY;

        offsetX = constrain(offsetX - dx, 0, caCanvasWidth - grid.cols);
        offsetY = constrain(offsetY - dy, 0, caCanvasHeight - grid.rows);

        prevMouseX = mouseX;
        prevMouseY = mouseY;
    }
    return false; // prevent browser scroll / text selection
}

function touchStarted() {
    let currentTime = millis();
    if (currentTime - lastTapTime < doubleTapDelay) {
        cycleFontSize();
        lastTapTime = 0;
    } else {
        isTouching = true;
        touchStartX = touches[0].x;
        touchStartY = touches[0].y;
        lastTapTime = currentTime;
    }
}

function touchMoved() {
    if (isTouching) {
        let dx = touches[0].x - touchStartX;
        let dy = touches[0].y - touchStartY;

        offsetX = constrain(offsetX - dx, 0, caCanvasWidth - grid.cols);
        offsetY = constrain(offsetY - dy, 0, caCanvasHeight - grid.rows);

        touchStartX = touches[0].x;
        touchStartY = touches[0].y;
    }
    return false; // prevent page scroll during touch pan
}

function touchEnded() {
    isTouching = false;
}

function keyPressed() {
    if (key === "+") {
        cycleFontSize(1);
    }

    if (key === "-") {
        cycleFontSize(-1);
    }

    if (key === "f" || key === "F") {
        toggleFullscreen();
    }

    if (key === " ") {
        isPaused = !isPaused;
    }

    if (key === "r") {
        frameCount = 1;

        seed = random(0, 100);

        offsetX = floor(random(0, caCanvasWidth - grid.cols));
        offsetY = floor(random(0, caCanvasHeight - grid.rows));

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
        if (kaleidoscopeEffect.enabled === false) {
            kaleidoscopeEffect.enabled = true;
            kaleidoscopeEffect.segments = availableKaleidoscopeSegments[0];
        } else {
            let index = availableKaleidoscopeSegments.indexOf(kaleidoscopeEffect.segments);
            if (index === availableKaleidoscopeSegments.length - 1) {
                kaleidoscopeEffect.enabled = false;
            } else {
                index = (index + 1) % availableKaleidoscopeSegments.length;
                kaleidoscopeEffect.segments = availableKaleidoscopeSegments[index];
            }
        }
    }

    if (key === "i") {
        invertCharacters = !invertCharacters;

        setAsciiOptions({
            brightness: {
                invertMode: invertCharacters,
            },
        });
    }

    if (key === "b") {
        let index = backgroundColors.indexOf(selectedBackgroundColor);
        index = (index + 1) % backgroundColors.length;
        selectedBackgroundColor = backgroundColors[index];

        setAsciiOptions({
            brightness: {
                backgroundColor: selectedBackgroundColor,
            },
        });
    }

    if (key === "c") {
        characterColorMode = characterColorMode === 0 ? 1 : 0;

        setAsciiOptions({
            brightness: {
                characterColorMode: characterColorMode,
            },
        });
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    gridFramebuffer.resize(grid.cols, grid.rows);
}

function toggleFullscreen() {
    let el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

function cycleFontSize(direction = 1) {
    let index = fontSizes.indexOf(selectedFontSize);
    index = (index + direction + fontSizes.length) % fontSizes.length;
    selectedFontSize = fontSizes[index];
    setAsciiOptions({
        common: {
            fontSize: selectedFontSize,
        },
    });
    gridFramebuffer.resize(grid.cols, grid.rows);
}
