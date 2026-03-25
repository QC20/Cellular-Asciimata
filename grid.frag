#version 300 es
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
}