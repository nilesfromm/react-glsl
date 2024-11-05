import { CSSProperties } from 'react';

type uniform = {
    name: string;
    value: number | number[];
};
type ShaderCanvasProps = {
    glsl: string;
    enableMouse?: boolean;
    enableTime?: boolean;
    uniforms?: uniform[];
    pixelRatio?: number;
    style?: CSSProperties;
    className?: string;
    webglAttributes?: WebGLContextAttributes;
};
type ShaderResult = {
    id: number;
    program?: WebGLProgram;
    ready?: boolean;
};
declare const ShaderCanvas: ({ glsl, uniforms, className, enableMouse, enableTime, pixelRatio, style, webglAttributes, }: ShaderCanvasProps) => JSX.Element;

export { ShaderCanvas, ShaderCanvasProps, ShaderResult };
