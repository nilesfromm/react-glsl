# React GLSL

A minimal wrapper for GLSL shaders in React.

Basic usage:

```ts
import { ShaderCanvas } from 'react-glsl';

const fragment: string = `#version 300 es
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
  <div style={{ width: '100%', height: '100%' }}>
    <ShaderCanvas glsl={fragment} mouse time />
  </div>
);
```

\*\*\*Note: to use react-glsl in a NextJs project, make sure to set client mode:

```ts
'use client';
```

Pass in fragment shader as a string with optional props:

```ts
export type ShaderCanvasProps = {
  glsl: string;
  mouse?: boolean;
  time?: boolean;
  pixelRatio?: number;
  style?: CSSProperties;
  webglAttributes?: WebGLContextAttributes;
};
```

- glsl - fragment shader string
- mouse - enable mouse postion uniform (vec2 from 0-1 scaled to canvas size)
- time - enable time uniform (float)
- pixelRatio - set custom pixelRatio
- style - css for canvas element
- webglAttributes - add additional webgl customization

---

Inspired By:

- https://webgl2fundamentals.org/webgl/lessons/webgl-shadertoy.html
- https://glslsandbox.com/
- https://thebookofshaders.com/
- https://github.com/jacklehamster/opengl-template
