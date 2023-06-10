import React, { useState, useRef, RefObject, useMemo, CSSProperties, useEffect, useCallback } from 'react'
import './style.css'
import { useGL } from './use-gl'
import { useCanvasSize } from './use-canvas-size'
import { useProgram } from './use-program'

export type ShaderProps = {
	glsl: string
	uniform: string
}

export interface Props {
	glsl?: string
	uniforms?: string
	mouse?: boolean
	time?: boolean
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
	const { glsl, uniforms } = props ?? {}
	const fragmentShader = glsl
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
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

	const vertexShader = `#version 300 es
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

	// 	const fragmentShaderSource = `#version 300 es
	//   precision highp float;

	// 	uniform vec2 resolution;
	// 	uniform vec2 mouse;
	// 	uniform float time;

	//   // we need to declare an output for the fragment shader
	//   out vec4 outColor;

	//   void main() {
	// 		vec2 position = ( gl_FragCoord.xy / resolution.xy );
	// 		float dist = length(position - vec2(.5));
	// 		float t = .5 + (sin(time*3.) * .5);
	//     outColor = vec4(dist, dist, t, 1);
	//   }
	// `

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

	const program = useRef<WebGLProgram | null>()

	const createProgram = useCallback(
		({ vertex, fragment }: ProgramConfig): ProgramResult | undefined => {
			if (!gl) {
				return
			}
			program.current = gl.createProgram()
			if (!program.current) {
				throw new Error(`Unable to create program.`)
			}

			const vertexShader = createShader(vertex, gl.VERTEX_SHADER)!
			const fragmentShader = createShader(fragment, gl.FRAGMENT_SHADER)!
			gl.attachShader(program.current, vertexShader)
			gl.attachShader(program.current, fragmentShader)
			gl.linkProgram(program.current)

			if (!gl.getProgramParameter(program.current, gl.LINK_STATUS)) {
				gl.detachShader(program.current, vertexShader)
				gl.detachShader(program.current, fragmentShader)
				gl.deleteShader(vertexShader)
				gl.deleteShader(fragmentShader)
				throw new Error('Unable to initialize the shader program:\n' + gl.getProgramInfoLog(program.current))
			}

			const triangleArray = gl.createVertexArray()
			gl.bindVertexArray(triangleArray)

			const resolutionUniformLocation = gl.getUniformLocation(program.current, 'resolution')
			const mouseUniformLocation = gl.getUniformLocation(program.current, 'mouse')
			const positionLocation = gl.getAttribLocation(program.current, 'a_position')

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

				gl.useProgram(program.current)
				gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)
				gl.uniform2f(mouseUniformLocation, mousePos.x, mousePos.y)
				gl.bindVertexArray(vao)
				gl.drawArrays(gl.TRIANGLES, 0, 6)
			}
		},
		[createShader, gl, mousePos]
	)

	const Render = (time: number) => {
		if (!gl || !program.current) {
			return
		}
		time *= 0.001 // convert to seconds
		const mouseUniformLocation = gl.getUniformLocation(program.current, 'mouse')
		const timeUniformLocation = gl.getUniformLocation(program.current, 'time')
		gl.uniform2f(mouseUniformLocation, mousePos.x, mousePos.y)
		gl.uniform1f(timeUniformLocation, time)
		gl.drawArrays(gl.TRIANGLES, 0, 6)
		requestAnimationFrame(Render)
	}
	requestAnimationFrame(Render)

	useEffect(() => {
		if (!gl || !vertexShader || !fragmentShader) {
			return
		}
		createProgram({ vertex: vertexShader, fragment: fragmentShader })
	}, [gl, vertexShader, fragmentShader, createProgram])

	const updateMousePosition = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
			const canvas = e.target as HTMLCanvasElement
			// console.log(e.nativeEvent.offsetX / canvas.offsetWidth, 1 - e.nativeEvent.offsetY / canvas.offsetHeight)
			setMousePos({
				x: e.nativeEvent.offsetX / canvas.offsetWidth,
				y: 1 - e.nativeEvent.offsetY / canvas.offsetHeight,
			})
		},
		[mousePos]
	)

	return (
		<canvas
			ref={canvasRef}
			// width={width}
			// height={height}
			onMouseMove={(e) => updateMousePosition(e)}
			style={{
				width: '100%',
				height: '100%',
				backgroundColor: 'coral',
				...style,
			}}
		></canvas>
	)
}
