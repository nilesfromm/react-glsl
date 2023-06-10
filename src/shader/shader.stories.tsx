import React from 'react'
import { Shader } from './index'
export default {
	title: 'Shader',
}

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
    outColor = vec4(dist, dist, t, 1);
  }
`

export const ShaderPrimary = () => (
	<div style={{ width: '400px', height: '400px' }}>
		<Shader glsl={glsl} mouse time />
	</div>
)
