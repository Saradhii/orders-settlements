"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const VERTEX_SHADER = `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
  float time = uTime * 0.25;
  vec3 color = vec3(0.0);

  for (float i = 0.0; i < 8.0; i++) {
    float wave = sin(uv.x * 1.6 + time + i * 0.35) * 0.32;
    float distance = abs(uv.y + wave);

    color += 0.012 / distance * vec3(0.35 + i * 0.06, 0.55, 1.0 - i * 0.04);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

  if (!vertex || !fragment) return null;

  const program = gl.createProgram();

  if (!program) return null;

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export function ShaderAnimation({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: true });

    if (!gl) return;

    const program = createProgram(gl);

    if (!program) return;

    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "aPosition");

    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);

    const timeUniform = gl.getUniformLocation(program, "uTime");
    const resolutionUniform = gl.getUniformLocation(program, "uResolution");

    function resize() {
      if (!canvas || !gl) return;

      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(canvas.clientWidth * scale);
      const height = Math.floor(canvas.clientHeight * scale);

      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    let frame = 0;

    function render(now: number) {
      resize();

      if (gl && canvas) {
        gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
        gl.uniform1f(timeUniform, reduceMotion.matches ? 0 : (now - start) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      frame = requestAnimationFrame(render);
    }

    frame = requestAnimationFrame(render);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("absolute inset-0 h-full w-full bg-black", className)}
    />
  );
}
