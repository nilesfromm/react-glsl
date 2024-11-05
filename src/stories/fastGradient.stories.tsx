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
    float t = .5 + (sin(time*4.) * .5);
		float dist = smoothstep( .7, t/10., length(vec2(position.x,position.y) - vec2(0.5)) );
    // float dist = length(vec2(position.x,position.y) - vec2(.5));
    float wave = sin(dist * 64. + time * 16.);
    vec4 outWave = mix(vec4(0., 0., 0., 1.0), vec4(smoothstep(0.,0.9,wave),wave*0.8,smoothstep(0.2,0.4,wave),1.), smoothstep(0.,.5,dist));
    outColor = outWave;
  }
`;

export const FastShader = () => (
  <div style={{ width: "100%", height: "100%" }}>
    <ShaderCanvas glsl={glsl} mouse time />
  </div>
);
