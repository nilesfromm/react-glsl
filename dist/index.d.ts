import { CSSProperties } from 'react';

type ShaderCanvasProps = {
    glsl: string;
    uniforms?: string;
    mouse?: boolean;
    time?: boolean;
    pixelRatio?: number;
    style?: CSSProperties;
    webglAttributes?: WebGLContextAttributes;
};
type ShaderResult = {
    id: number;
    program?: WebGLProgram;
    ready?: boolean;
};
declare const ShaderCanvas: (props: ShaderCanvasProps) => JSX.Element;

export { ShaderCanvas, ShaderCanvasProps, ShaderResult };
