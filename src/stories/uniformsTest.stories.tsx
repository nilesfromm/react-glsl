import React, { useState } from "react";
import { ShaderCanvas } from "../shader/index";
export default {
  title: "Gradients",
};

const glsl = `#version 300 es
  precision highp float;

	uniform vec2 resolution;
	uniform vec2 mouse;
	uniform float time;
  uniform vec2 slider;
  uniform vec4 inColor;
 
  // we need to declare an output for the fragment shader
  out vec4 outColor;
 
  void main() {
		vec2 position = ( gl_FragCoord.xy / resolution.xy );
    float t = .5 + (sin(time*4.) * .5);
		float dist = smoothstep( .7, t/10., length(vec2(position.x,position.y) - slider) );
    // float dist = length(vec2(position.x,position.y) - vec2(.5));
    float wave = sin(dist * 64. + time * 16.);
    vec4 outWave = mix(vec4(0., 0., 0., 1.0), vec4(smoothstep(0.,0.9,wave),wave*0.8,smoothstep(0.2,0.4,wave),1.), smoothstep(0.,.5,dist));
    outColor = inColor * outWave;
  }
`;

export const UniformTestShader = () => {
  const [slider1, setSlider1] = useState(0.0);
  const [slider2, setSlider2] = useState(1.0);
  const [slider3, setSlider3] = useState(0.5);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
      }}
    >
      <ShaderCanvas
        style={{ width: "50%", height: "50%" }}
        glsl={glsl}
        uniforms={[
          {
            name: "slider",
            value: [0.5, 0.5],
          },
          {
            name: "inColor",
            value: [slider1, slider2, slider3, 1.0],
          },
        ]}
        enableMouse
        enableTime
      />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={slider1}
        onChange={(e) => {
          setSlider1(parseFloat(e.target.value));
        }}
      />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={slider2}
        onChange={(e) => {
          setSlider2(parseFloat(e.target.value));
        }}
      />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={slider3}
        onChange={(e) => {
          setSlider3(parseFloat(e.target.value));
        }}
      />
    </div>
  );
};
