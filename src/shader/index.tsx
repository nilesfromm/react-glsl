import React, { useState, useRef, RefObject, useMemo, CSSProperties, useEffect, useCallback } from 'react'
import './style.css'
import { useGL } from './use-gl'
import { useCanvasSize } from './use-canvas-size'
import { useProgram } from './use-program'
export type ShaderProps = {
	fragmentShader: string
	uniform: string
}

export interface Props {
	fragmentShader?: string
	uniforms?: string
	pixelRatio?: number
	style?: CSSProperties
	webglAttributes?: WebGLContextAttributes
}

type ProgramId = string
interface ProgramConfig {
	readonly vertex: string
	readonly fragment: string
}

export interface ProgramResult {
	id: number
	program?: WebGLProgram
	ready?: boolean
}

const DEFAULT_ATTRIBUTES: WebGLContextAttributes = {
	alpha: true,
	antialias: false,
	depth: true,
	desynchronized: true,
	failIfMajorPerformanceCaveat: undefined,
	powerPreference: 'default',
	premultipliedAlpha: true,
	preserveDrawingBuffer: false,
	stencil: false,
}

export function Shader(props?: Props): JSX.Element {
	// const { pixelRatio = devicePixelRatio, webglAttributes, programs: initialPrograms, style, scripts = [] } = props ?? {}

	// const { width, height } = useCanvasSize({ gl, canvasRef, pixelRatio })
	// const [programs, setPrograms] = useState<ProgramConfig[]>(initialPrograms ?? [])
	// const { usedProgram, getAttributeLocation, getUniformLocation, setActiveProgram } = useProgram({ gl, programs })

	// const glConfig: GlConfig | undefined = useMemo(
	// 	() =>
	// 		gl
	// 			? {
	// 					gl,
	// 					getUniformLocation,
	// 					getAttributeLocation,
	// 			  }
	// 			: undefined,
	// 	[gl, getUniformLocation, getAttributeLocation]
	// )

	// const { getScriptProcessor } = useGlAction({ gl, getAttributeLocation, getUniformLocation, setActiveProgram })

	// const processor = useMemo(() => getScriptProcessor(scripts), [scripts, getScriptProcessor])

	// const ready = useMemo(
	// 	() => !!(gl && usedProgram && width && height && glConfig),
	// 	[gl, usedProgram, width, height, glConfig]
	// )
	// useEffect((): void | (() => void) => {
	// 	if (ready) {
	// 		const initCleanup = processor?.runByTags(['init'])
	// 		const loopCleanup = processor?.loopByTags(['loop'], { cleanupAfterLoop: false })

	// 		return () => {
	// 			initCleanup?.()
	// 			loopCleanup?.()
	// 		}
	// 	}
	// }, [usedProgram, glConfig, ready, processor])

	const vertexShaderSource = `#version 300 es
  // an attribute is an input (in) to a vertex shader.
  // It will receive data from a buffer
  in vec4 a_position;
 
  // all shaders have a main function
  void main() {
 
    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = a_position;
  }
`

	const fragmentShaderSource = `#version 300 es
  precision highp float;

	uniform vec2 resolution;
	uniform vec2 mouse;
 
  // we need to declare an output for the fragment shader
  out vec4 outColor;
 
  void main() {
		vec2 position = ( gl_FragCoord.xy / resolution.xy );
    outColor = vec4(position, 0, 1);
  }
`

	const canvasRef: RefObject<HTMLCanvasElement> = React.useRef<HTMLCanvasElement>(null)
	// const gl = useGL({ canvasRef })
	const [gl, setGL] = useState<WebGL2RenderingContext | undefined>()

	React.useLayoutEffect(() => {
		const canvas = canvasRef.current
		setGL(
			canvas?.getContext?.('webgl2', {
				...DEFAULT_ATTRIBUTES,
			}) ?? undefined
		)
	}, [canvasRef])

	const style = props?.style ?? {}

	const createShader = useCallback(
		(shaderSource: string, type: GLenum) => {
			if (!gl) {
				return
			}
			if (type !== gl.VERTEX_SHADER && type !== gl.FRAGMENT_SHADER) {
				throw new Error(`Shader error`)
			}
			const shader = gl.createShader(type)
			if (!shader) {
				throw new Error(`Unable to generate shader.`)
			}
			gl.shaderSource(shader, shaderSource)
			gl.compileShader(shader)

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				// Something went wrong during compilation; get the error
				console.error(`Shader compile error` + gl.getShaderInfoLog(shader))
			}
			return shader
		},
		[gl]
	)

	// const CanvasSize = (canvas: HTMLCanvasElement) => {
	// 	const width = canvas.clientWidth | 0
	// 	const height = canvas.clientHeight | 0
	// 	if (canvas.width !== width || canvas.height !== height) {
	// 		canvas.width = width
	// 		canvas.height = height
	// 		return true
	// 	}
	// 	return false
	// }

	useEffect((): void => {
		if (canvasRef.current) {
			const width = canvasRef.current.clientWidth | 0
			const height = canvasRef.current.clientHeight | 0
			if (canvasRef.current.width !== width || canvasRef.current.height !== height) {
				canvasRef.current.width = width
				canvasRef.current.height = height
			}
		}
	}, [canvasRef])

	const createProgram = useCallback(
		({ vertex, fragment }: ProgramConfig): ProgramResult | undefined => {
			if (!gl) {
				return
			}
			const program = gl.createProgram()
			if (!program) {
				throw new Error(`Unable to create program.`)
			}

			const vertexShader = createShader(vertex, gl.VERTEX_SHADER)!
			const fragmentShader = createShader(fragment, gl.FRAGMENT_SHADER)!
			gl.attachShader(program, vertexShader)
			gl.attachShader(program, fragmentShader)
			gl.linkProgram(program)

			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				gl.detachShader(program, vertexShader)
				gl.detachShader(program, fragmentShader)
				gl.deleteShader(vertexShader)
				gl.deleteShader(fragmentShader)
				throw new Error('Unable to initialize the shader program:\n' + gl.getProgramInfoLog(program))
			}

			const triangleArray = gl.createVertexArray()
			gl.bindVertexArray(triangleArray)

			const resolutionUniformLocation = gl.getUniformLocation(program, 'resolution')
			const mouseUniformLocation = gl.getUniformLocation(program, 'mouse')
			const positionLocation = gl.getAttribLocation(program, 'a_position')

			if (positionLocation >= 0) {
				var vao = gl.createVertexArray()
				gl.bindVertexArray(vao)
				const positionBuffer = gl.createBuffer()
				gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

				gl.bufferData(
					gl.ARRAY_BUFFER,
					new Float32Array([
						-1,
						-1, // first triangle
						1,
						-1,
						-1,
						1,
						-1,
						1, // second triangle
						1,
						-1,
						1,
						1,
					]),
					gl.STATIC_DRAW
				)

				gl.enableVertexAttribArray(positionLocation)
				gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

				gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
				gl.clearColor(0, 0, 0, 1)
				gl.clear(gl.COLOR_BUFFER_BIT)

				gl.useProgram(program)
				gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)
				gl.bindVertexArray(vao)
				gl.drawArrays(gl.TRIANGLES, 0, 6)
				// gl.drawArrays(gl.TRIANGLES, 0, 3)
			}
		},
		[createShader, gl]
	)

	useEffect(() => {
		if (!gl) {
			return
		}
		const result = createProgram({ vertex: vertexShaderSource, fragment: fragmentShaderSource })
	}, [gl])

	return (
		<canvas
			ref={canvasRef}
			// width={width}
			// height={height}
			style={{
				width: '100%',
				height: '100%',
				backgroundColor: 'coral',
				...style,
			}}
		></canvas>
	)
}
