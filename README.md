# Cellular ASCIImata

An interactive exploration of cellular automata rendered as dynamic ASCII characters. This project bridges computational aesthetics with real-time generative visual systems, transforming mathematical rules into engaging typographic patterns that evolve across the screen.

## What is This

Cellular ASCIImata visualizes a continuous cellular automaton using a modified von Neumann neighborhood executed on the GPU. Each frame, the automaton evolves based on its previous state, with each cell represented by a character whose appearance reflects the underlying cell value. The result is a living, breathing grid of typography that responds to viewer interaction and reveals the hidden complexity of cellular computation.

The system prioritizes performance through GPU-accelerated shader computation while maintaining interactive responsiveness through real-time character rendering. The full 1024x1024 cellular canvas is visualized across your screen through a zoomable ASCII grid managed by p5.asciify.

## Technical Foundation

The cellular automaton logic runs entirely on WebGL fragment shaders. Instead of traditional totalistic rules, the system uses a custom approach that samples six values from each cell's neighborhood, sorts them, and applies a hash-based index to determine the next state. This creates emergent pattern behavior that avoids the predictability of standard rulesets.

The neighborhood includes the von Neumann cross pattern (four orthogonal neighbors plus the cell itself) supplemented by an additional reference value, generating richer state transitions than conventional CA implementations. Initial conditions use seeded noise generation to ensure unique patterns across sessions.

Three specialized shaders handle distinct stages of the pipeline. The cellular automaton shader computes state progression. The grid sampling shader extracts a viewport section from the massive computation space. The zoom shader interpolates character cells to fill your display screen.

## Interaction and Customization

The piece responds to both keyboard and touch input, letting you navigate the automaton space in real time. You can pause and resume evolution, reset with entirely new parameters, or adjust the visual presentation without interrupting the underlying computation.

Switch between multiple character sets to dramatically change visual texture. The included charsets range from traditional monospace characters to mathematical symbols and Unicode glyphs, each bringing distinct aesthetic qualities to the same underlying patterns. You can also choose different color palettes, each curated for visual coherence and contrast.

Modify font sizes from 8 to 128 pixels to shift between exploring fine detail and recognizing large-scale patterns. Apply a kaleidoscope effect that mirrors the grid along multiple axes, creating symmetrical compositions from asymmetrical automata. Invert character display modes to reverse the relationship between cell brightness and typography color, creating wholly different visual impressions of identical computational states.

Character color rendering adapts to computed brightness values or remains fixed white depending on your preference. Switch background colors between dark and light to suit your context and reveal different aspects of pattern contrast.

## Controls

**Keyboard**

- WASD to move through the automaton space
- Space to pause and unpause evolution
- R to reset with new seeds and parameters
- K to cycle through kaleidoscope segments
- I to toggle character inversion
- B to switch background colors
- C to cycle character color modes
- Plus or minus to adjust font size

**Touch**

- Swipe to navigate the space
- Double tap to cycle font sizes

## Running Locally

Clone this repository and open index.html in a modern web browser. The project relies on external CDN libraries (p5.js and p5.asciify) and requires WebGL 2 support. No build process or local dependencies needed. To clone and run, use `git clone https://github.com/QC20/Cellular-Asciimata.git`, then open the index.html file in your browser.

## Credits

Cellular automaton shader approach adapted from a Shadertoy submission by laserbat. Character rendering powered by p5.asciify. Color palettes sourced from Lospec, a community palette library curated for pixel art and digital design.

Created for the WCC Challenge with the theme Pattern.