
/**
 * Cellular ASCIImata - by humanbydefinition
 * Created for the #WCCChallenge - Theme: "Pattern" 👘
 * 
 * Hello Raph and the whole Birb's Nest community! 🐦
 * I'm experimenting with cellular automata for a bit now and with the theme being "Pattern" this week, 
 * I thought it would be a great opportunity to finally create my first entry for the #WCCChallenge.
 * 
 * This interactive sketch features a cellular automaton that is being rendered on a 1024x1024 canvas, 
 * which is then further processed before it's ready to be parsed by p5.asciify, a p5.js add-on library I've been working on.
 * 
 * The cellular automaton shader is based on a submission on shadertoy by 'laserbat': https://www.shadertoy.com/view/dttyRX
 * My implementation is a bit different, featuring a slightly modified von Neumann neighborhood and a few other tweaks.
 * https://en.wikipedia.org/wiki/Von_Neumann_neighborhood
 * 
 * For starters, each pixel in the cellular automaton is assigned a random value between 0 and 1 based on a noise function.
 * Each pixel in the cellular automaton is updated each frame based on the values of its neighbors from the previous frame.
 * Those values are stored in an array for each pixel and sorted using an insertion sort algorithm.
 * The first and last values of the sorted array are then used to determine the final array index to pick the new rgb values for the pixel.
 * 
 * KEYBOARD+MOUSE CONTROLS:
 * - WASD: Move the view
 * - Mouse drag: Move the view
 * - Space: Pause or unpause
 * - r: Reset the sketch (resets with cellular automaton with a new seed, color palette, character set and position)
 * - k: Cycle through kaleidoscope segments (off, 1, 2, 4, 8)
 * - i: Invert characters (swaps the ascii character color with it's cell background color)
 * - b: Cycle through background colors (black, white)
 * - c: Cycle through character color modes (brightness, fixed [white])
 * - +: Increase font size (8, 16, 32, 64, 128)
 * - -: Decrease font size (8, 16, 32, 64, 128)
 *
 * TOUCH CONTROLS:
 * - Swipe around to move the view
 * - Double tap to cycle through the pre-defined font sizes
 * 
 * The provided kaleidoscope and color palette effects are also part of p5.asciify.
 * p5.asciify is open-source and available on GitHub: https://github.com/humanbydefinition/p5.asciify 
 * 
 * I hope you like this infinite pattern generator and it runs smoothly on your machine! 🌀
 * 
 * 
 * See other submissions for the #WCCChallenge here: https://openprocessing.org/curation/78544
 * Join the Birb's Nest community on Discord: https://discord.gg/S8c7qcjw2blet
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
    "Æ«î╛ΣΩæδσ┐ì»É",
    "‼╨∞φ²ⁿτ¿æ",
    "╨◘▒▓ÜÖëè╜╝¼¡",
    " .:,'-^*+?!|=0#X%WM@", // https://polar.sh/emilwidlund/posts/the-secrets-behind-rendering-anything-as-ascii
    " .:-=+*#%@", // https://paulbourke.net/dataformats/asciiart/
    "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,\"^`'. " // https://paulbourke.net/dataformats/asciiart/
]

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

let seed;

let previousFramebuffer;
let nextFramebuffer;
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
    //randomSeed(0); // Uncomment to get the same results each time for a given seed (only works when clicking the reload button above)

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
            enabled: true, // Set to false to disable ascii conversion
            characterColorMode: characterColorMode,
            characterColor: backgroundColors[1],
            characters: charsets[Math.floor(random() * charsets.length)],
            invertMode: invertCharacters,
            backgroundColor: selectedBackgroundColor,
        },
    });

    let randomPalette = colorPalettes[Math.floor(random() * colorPalettes.length)];
    colorPaletteEffect = addAsciiEffect("pre", "colorpalette", { palette: randomPalette });
    //colorPaletteEffect.enabled = false; // Uncomment to disable color palette effect to get a grayscale output

    kaleidoscopeEffect = addAsciiEffect("pre", "kaleidoscope", { segments: 1, angle: 0 });
    kaleidoscopeEffect.enabled = false;
}

function draw() {
    if (frameCount === 1) { // p5.asciify grid is initialized after setup, so we need to resize the framebuffer here
        gridFramebuffer.resize(grid.cols, grid.rows);
        offsetX = floor(random(0, caCanvasWidth - grid.cols));
        offsetY = floor(random(0, caCanvasHeight - grid.rows));
    }

    if (!isPaused) {
        // Cycle the framebuffers
        [previousFramebuffer, nextFramebuffer] = [nextFramebuffer, previousFramebuffer];

        nextFramebuffer.begin(); // Render the next iteration of the cellular automata
        shader(caShader);
        caShader.setUniform('u_resolution', [caCanvasWidth, caCanvasHeight]);
        caShader.setUniform('u_frameCount', frameCount);
        caShader.setUniform('u_seed', seed);
        caShader.setUniform('u_previousIterationTexture', previousFramebuffer);
        rect(0, 0, caCanvasWidth, caCanvasHeight);
        nextFramebuffer.end();
    }

    gridFramebuffer.begin(); // Render a chunk of the cellular automata equal to the ascii grid size based on the offset
    shader(gridShader);
    gridShader.setUniform('u_inputTexture', nextFramebuffer);
    gridShader.setUniform('u_offset', [offsetX, offsetY]);
    rect(0, 0, grid.cols, grid.rows);
    gridFramebuffer.end();

    zoomFramebuffer.begin(); // Render the zoomed in view of the grid
    shader(zoomShader);
    zoomShader.setUniform('u_resolution', [windowWidth, windowHeight]);
    zoomShader.setUniform('u_gridDimensions', [grid.cols, grid.rows]);
    zoomShader.setUniform('u_inputTexture', gridFramebuffer);
    rect(0, 0, windowWidth, windowHeight);
    zoomFramebuffer.end();

    image(zoomFramebuffer, -windowWidth / 2, -windowHeight / 2); // Display the zoomed in view, which is picked up by p5.asciify

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

        // Update offset with boundary checks
        offsetX = constrain(offsetX + dx, 0, caCanvasWidth - grid.cols);
        offsetY = constrain(offsetY + dy, 0, caCanvasHeight - grid.rows);

        prevMouseX = mouseX;
        prevMouseY = mouseY;
    }
}

function touchStarted() {
  let currentTime = millis();
  if (currentTime - lastTapTime < doubleTapDelay) {
    // Double tap detected
    cycleFontSize();
    lastTapTime = 0; // Reset to prevent triple-tap
  } else {
    // Single tap (start of potential drag)
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

    // Update offset with boundary checks
    offsetX = constrain(offsetX - dx, 0, caCanvasWidth - grid.cols);
    offsetY = constrain(offsetY - dy, 0, caCanvasHeight - grid.rows);

    touchStartX = touches[0].x;
    touchStartY = touches[0].y;
  }
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

    if (key === " ") { // Pause or unpause
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

    if (key === "k") { // Cycle through kaleidoscope segments
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

    if (key === "i") { // Invert characters
        invertCharacters = !invertCharacters;

        setAsciiOptions({
            brightness: {
                invertMode: invertCharacters,
            },
        });
    }

    if (key === "b") { // Cycle through background colors
        let index = backgroundColors.indexOf(selectedBackgroundColor);
        index = (index + 1) % backgroundColors.length;
        selectedBackgroundColor = backgroundColors[index];

        setAsciiOptions({
            brightness: {
                backgroundColor: selectedBackgroundColor,
            },
        });
    }

    if (key === "c") { // Cycle through character color modes
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

const VERT_SHADER = `   #version 300 es

                        precision mediump float;

                        layout(location = 0) in vec3 aPosition;
                        layout(location = 1) in vec2 aTexCoord; // Add attribute for texture coordinates

                        out vec2 v_texCoord; // Varying to pass the texture coordinate to the fragment shader

                        void main() {
                            vec4 positionVec4 = vec4(aPosition, 1.0);
                            positionVec4.xy = positionVec4.xy * 2.0 - 1.0;

                            gl_Position = positionVec4;

                            v_texCoord = aTexCoord; // Pass the texture coordinate to the fragment shader
                        }`;

const CA_FRAG_SHADER = `#version 300 es
												precision highp float;
												precision highp int;

												out vec4 fragColor;
												uniform sampler2D u_previousIterationTexture;
												uniform vec2 u_resolution;
												uniform int u_frameCount;
												uniform float u_seed;

												// Fetch value from texture
												float GET(vec2 coord, ivec2 offset) {
														return texelFetch(u_previousIterationTexture, ivec2(mod(coord + vec2(offset) + u_resolution.xy, u_resolution.xy)), 0).r;
												}

												// Number of neighbors for each cell
												const int NEIGHBOR_COUNT = 6;

												// Hash function
												int hash(int x) {
														x += (x << 10u);
														x ^= (x >> 6u);
														x += (x << 3u);
														x ^= (x >> 11u);
														x += (x << 15u);
														return x;
												}

												// Simple noise function
												float noise(in vec2 co) {
														int x = int(co.x * u_resolution.x);
														int y = int(co.y * u_resolution.y);
														int z = int(u_seed);
														int w = int(fract(float(1)) * u_resolution.x);
														int res = hash(x + hash(y + hash(z + hash(w))));

														return mod(float(res), u_resolution.x) / u_resolution.x;
												}

												void getNeighbors(vec2 fragCoord, out float vals[6]) {
														// Von Neumann neighborhood (4 neighbors + center)
														ivec2 offsets[5] = ivec2[](ivec2(0, 0), ivec2(-1, 0), ivec2(1, 0), ivec2(0, -1), ivec2(0, 1));
														for(int i = 0; i < 5; i++) {
																vals[i] = GET(fragCoord, offsets[i]);
														}
														vals[5] = GET(fragCoord, ivec2(0, 0)); // Added an additional center value, so persistent structures more likely emerge
												}

												void insertionSort(inout float vals[6], int n) {
														for (int i = 1; i < n; i++) {
																float key = vals[i];
																int j = i - 1;

																while (j >= 0 && vals[j] > key) {
																		vals[j + 1] = vals[j];
																		j = j - 1;
																}
																vals[j + 1] = key;
														}
												}

												void main() {
														vec2 fragCoord = gl_FragCoord.xy;

														if(u_frameCount == 2) {
																float val = noise(fragCoord / u_resolution);
																fragColor = vec4(val, val, val, 1.0f);
														} else {
																float vals[NEIGHBOR_COUNT];

																getNeighbors(fragCoord, vals);
																insertionSort(vals, NEIGHBOR_COUNT);

																int idx = int(float(vals[0] * 256.0f) + float(vals[NEIGHBOR_COUNT - 1] * 256.0f)) % NEIGHBOR_COUNT;
																fragColor = vec4(vals[idx], vals[idx], vals[idx], 1.0f);
														}
												}`

const GRID_FRAG_SHADER = `  #version 300 es
                            precision highp float;

                            // Uniforms
                            uniform sampler2D u_inputTexture;
                            uniform ivec2 u_offset;

                            // Output
                            out vec4 fragColor;

                            void main() {
                                // Calculate the texture coordinate to sample the color from
                                vec2 texCoord = (vec2(gl_FragCoord.xy) + vec2(u_offset)) / vec2(textureSize(u_inputTexture, 0));
                                
                                // Sample the color from the input texture
                                vec4 color = texture(u_inputTexture, texCoord);
                                
                                // Output the color to the fragment
                                fragColor = color;
                            }`

const ZOOM_FRAG_SHADER = `  #version 300 es
                            precision highp float;

                            // Uniforms
                            uniform sampler2D u_inputTexture;
                            uniform vec2 u_resolution;
                            uniform ivec2 u_gridDimensions;

                            // Output
                            out vec4 fragColor;

                            void main() {
                                // Calculate the size of each cell in the grid
                                vec2 cellSize = u_resolution / vec2(u_gridDimensions);
                                
                                // Calculate which cell we are in
                                ivec2 cellIndex = ivec2(floor(gl_FragCoord.xy / cellSize));
                                
                                // Calculate the texture coordinate to sample the color from
                                vec2 texCoord = (vec2(cellIndex) + vec2(0.5)) / vec2(u_gridDimensions);
                                
                                // Sample the color from the input texture
                                vec4 color = texture(u_inputTexture, texCoord);
                                
                                // Output the color to the fragment
                                fragColor = color;
                            }`;