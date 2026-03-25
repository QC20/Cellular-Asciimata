const VERT_SHADER = `#version 300 es

precision mediump float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;

out vec2 v_texCoord;

void main() {
    vec4 positionVec4 = vec4(aPosition, 1.0);
    positionVec4.xy = positionVec4.xy * 2.0 - 1.0;

    gl_Position = positionVec4;

    v_texCoord = aTexCoord;
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
    vals[5] = GET(fragCoord, ivec2(0, 0)); // Additional center value for persistent structures
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
}`;

const GRID_FRAG_SHADER = `#version 300 es
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
}`;

const ZOOM_FRAG_SHADER = `#version 300 es
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
