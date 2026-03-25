#version 300 es
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
}