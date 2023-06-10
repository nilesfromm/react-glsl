import React from 'react'
import { Shader } from './index'
export default {
	title: 'Shader',
}
export const ShaderPrimary = () => (
	<div style={{ width: '600px', height: '400px', padding: '10px', backgroundColor: 'cornflowerblue' }}>
		<Shader
			fragmentShader={`this is a test string for fragment shader`}
			uniforms='this is a test string for uniforms'
		/>
	</div>
)
