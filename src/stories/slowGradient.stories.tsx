import React from "react";
import { ShaderCanvas } from "../shader/index";
export default {
  title: "Gradients",
};

const glsl = `#version 300 es
  precision highp float;

	uniform vec2 resolution;
	uniform vec2 mouse;
	uniform float time;
 
  // we need to declare an output for the fragment shader
  out vec4 outColor;
 
  void main() {
		vec2 position = ( gl_FragCoord.xy / resolution.xy );
		float dist = length(position - vec2(.5));
		float t = .5 + (sin(time*3.) * .5);
    outColor = vec4(dist, dist/1.8, t, 1);
  }
`;

export const SlowShader = () => (
  <div style={{ width: "100%", height: "100%" }}>
    <ShaderCanvas glsl={glsl} mouse time />
  </div>
);
