import React, {
  useState,
  useRef,
  RefObject,
  useMemo,
  CSSProperties,
  useEffect,
  useCallback,
} from "react";

// import { useGL } from "./use-gl";
// import { useCanvasSize } from "./use-canvas-size";
// import { useProgram } from "./use-program";

export interface ShaderCanvasProps {
  glsl: string;
  uniforms?: string;
  mouse?: boolean;
  time?: boolean;
  pixelRatio?: number;
  style?: CSSProperties;
  webglAttributes?: WebGLContextAttributes;
}

interface Shaders {
  readonly vertex: string;
  readonly fragment: string;
}

export interface ShaderResult {
  id: number;
  program?: WebGLProgram;
  ready?: boolean;
}

const DEFAULT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: true,
  desynchronized: true,
  failIfMajorPerformanceCaveat: undefined,
  powerPreference: "default",
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  stencil: false,
};

export function ShaderCanvas(props: ShaderCanvasProps): JSX.Element {
  const { glsl, uniforms, style } = props;
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const fragmentShader = glsl;
  const vertexShader = `#version 300 es
    in vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
  `;

  const [gl, setGL] = useState<WebGL2RenderingContext | null>();
  const program = useRef<WebGLProgram | null>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      setGL(
        canvas.getContext?.("webgl2", {
          ...DEFAULT_ATTRIBUTES,
        })
      );
      const width = canvas.clientWidth | 0;
      const height = canvas.clientHeight | 0;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
  }, [canvasRef]);

  const createShader = useCallback(
    (shaderSource: string, type: GLenum) => {
      if (!gl) {
        return;
      }
      if (type !== gl.VERTEX_SHADER && type !== gl.FRAGMENT_SHADER) {
        throw new Error(`Shader Type error`);
      }
      const shader = gl.createShader(type);
      if (!shader) {
        throw new Error(`Shader Generation error`);
      }
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`Shader Compile error: ` + gl.getShaderInfoLog(shader));
      }
      return shader;
    },
    [gl]
  );

  const createProgram = useCallback(
    ({ vertex, fragment }: Shaders): ShaderResult | undefined => {
      if (!gl) {
        return;
      }
      program.current = gl.createProgram();
      if (!program.current) {
        throw new Error(`Unable to create program.`);
      }

      const vertexShader = createShader(vertex, gl.VERTEX_SHADER)!;
      const fragmentShader = createShader(fragment, gl.FRAGMENT_SHADER)!;
      gl.attachShader(program.current, vertexShader);
      gl.attachShader(program.current, fragmentShader);
      gl.linkProgram(program.current);

      if (!gl.getProgramParameter(program.current, gl.LINK_STATUS)) {
        gl.detachShader(program.current, vertexShader);
        gl.detachShader(program.current, fragmentShader);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error(
          "Unable to initialize the shader program:\n" +
            gl.getProgramInfoLog(program.current)
        );
      }

      const triangleArray = gl.createVertexArray();
      gl.bindVertexArray(triangleArray);

      const resolutionUniformLocation = gl.getUniformLocation(
        program.current,
        "resolution"
      );
      const mouseUniformLocation = gl.getUniformLocation(
        program.current,
        "mouse"
      );
      const positionLocation = gl.getAttribLocation(
        program.current,
        "a_position"
      );

      if (positionLocation >= 0) {
        var vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

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
        );

        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program.current);
        gl.uniform2f(
          resolutionUniformLocation,
          gl.canvas.width,
          gl.canvas.height
        );
        gl.uniform2f(mouseUniformLocation, mousePos.x, mousePos.y);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    },
    [createShader, gl, mousePos]
  );

  const Render = (time: number) => {
    if (!gl || !program.current) {
      return;
    }
    time *= 0.001; // convert to seconds
    const mouseUniformLocation = gl.getUniformLocation(
      program.current,
      "mouse"
    );
    const timeUniformLocation = gl.getUniformLocation(program.current, "time");
    gl.uniform2f(mouseUniformLocation, mousePos.x, mousePos.y);
    gl.uniform1f(timeUniformLocation, time);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(Render);
  };
  requestAnimationFrame(Render);

  const getUniformLocation = useCallback(
    (name: string): WebGLUniformLocation | undefined => {
      if (gl && program.current) {
        return gl.getUniformLocation(program.current, name) ?? undefined;
      }
      return;
    },
    [gl, program]
  );

  useEffect(() => {
    if (!gl || !vertexShader || !fragmentShader) {
      return;
    }
    createProgram({ vertex: vertexShader, fragment: fragmentShader });
  }, [gl, vertexShader, fragmentShader, createProgram]);

  const updateMousePosition = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const canvas = e.target as HTMLCanvasElement;
      // console.log(e.nativeEvent.offsetX / canvas.offsetWidth, 1 - e.nativeEvent.offsetY / canvas.offsetHeight)
      setMousePos({
        x: e.nativeEvent.offsetX / canvas.offsetWidth,
        y: 1 - e.nativeEvent.offsetY / canvas.offsetHeight,
      });
    },
    [mousePos]
  );

  return (
    <canvas
      ref={canvasRef}
      // width={width}
      // height={height}
      onMouseMove={(e) => updateMousePosition(e)}
      style={{
        width: "100%",
        height: "100%",
        ...style,
      }}
    ></canvas>
  );
}
