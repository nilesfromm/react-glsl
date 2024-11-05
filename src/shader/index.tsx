import React, {
  useState,
  useRef,
  RefObject,
  useMemo,
  CSSProperties,
  useEffect,
  useCallback,
} from "react";

type uniform = {
  name: string;
  // type: "float" | "vec2" | "vec3" | "vec4";
  value: number | number[];
};

export type ShaderCanvasProps = {
  glsl: string;
  mouse?: boolean;
  time?: boolean;
  uniforms?: uniform[];
  pixelRatio?: number;
  style?: CSSProperties;
  className?: string;
  webglAttributes?: WebGLContextAttributes;
};

interface Shaders {
  readonly vertex: string;
  readonly fragment: string;
}

export type ShaderResult = {
  id: number;
  program?: WebGLProgram;
  ready?: boolean;
};

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

export const ShaderCanvas = ({
  glsl,
  uniforms = [],
  className = "",
  mouse = true,
  time = true,
  pixelRatio = 1,
  style = {},
  webglAttributes = DEFAULT_ATTRIBUTES,
}: ShaderCanvasProps): JSX.Element => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
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
          ...webglAttributes,
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

      // uniforms.forEach((uniform) => {
      //   const location = gl.getUniformLocation(program.current, uniform.name);
      //   if (!location) {
      //     throw new Error(`Unable to get uniform location for ${uniform.name}`);
      //   }
      //   switch (uniform.type) {
      //     case "float":
      //       gl.uniform1f(location, uniform.value as number);
      //       break;
      //     case "vec2":
      //       gl.uniform2fv(location, uniform.value as number[]);
      //       break;
      //     case "vec3":
      //       gl.uniform3fv(location, uniform.value as number[]);
      //       break;
      //     case "vec4":
      //       gl.uniform4fv(location, uniform.value as number[]);
      //       break;
      //   }
      // });

      // const sliderUniformLocation = gl.getUniformLocation(
      //   program.current,
      //   "slider"
      // );

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
    if (!gl || !program.current || !time) {
      return;
    }

    uniforms.forEach((uniform) => {
      if (!program.current) return;
      const location = gl.getUniformLocation(program.current, uniform.name);
      if (!location) {
        throw new Error(`Unable to get uniform location for ${uniform.name}`);
      }
      if (typeof uniform.value === "number") {
        gl.uniform1f(location, uniform.value as number);
      } else if (uniform.value.length === 2) {
        gl.uniform2fv(location, uniform.value as number[]);
      } else if (uniform.value.length === 3) {
        gl.uniform3fv(location, uniform.value as number[]);
      } else if (uniform.value.length === 4) {
        gl.uniform4fv(location, uniform.value as number[]);
      }

      // switch (uniform.type) {
      //   case "float":
      //     gl.uniform1f(location, uniform.value as number);
      //     break;
      //   case "vec2":
      //     gl.uniform2fv(location, uniform.value as number[]);
      //     break;
      //   case "vec3":
      //     gl.uniform3fv(location, uniform.value as number[]);
      //     break;
      //   case "vec4":
      //     gl.uniform4fv(location, uniform.value as number[]);
      //     break;
      // }
    });

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
      mouse &&
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
      onMouseMove={(e) => updateMousePosition(e)}
      style={{
        width: "100%",
        height: "100%",
        ...style,
      }}
    ></canvas>
  );
};
