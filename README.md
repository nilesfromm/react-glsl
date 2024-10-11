# React GLSL

A minimal wrapper for GLSL shaders in React.

Basic usage:

```
import ShaderCanvas from react-glsl;

const fragment = `#version 300 es
precision highp float;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;

void main() {
    vec2 position = ( gl_FragCoord.xy / resolution.xy );
    float dist = length(position - vec2(.5));
    float t = .5 + (sin(time*3.) * .5);
    outColor = vec4(dist, dist/1.8, t, 1);
}
`;

export const Shader = () => (

  <div style={{ width: "100%", height: "100%" }}>
    <ShaderCanvas glsl={fragment} mouse time />
  </div>
);
```

---

Inspired By:

- https://webgl2fundamentals.org/webgl/lessons/webgl-shadertoy.html
- https://glslsandbox.com/
- https://thebookofshaders.com/
- https://github.com/jacklehamster/opengl-template
