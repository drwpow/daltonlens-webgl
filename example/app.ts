import { WebGL } from "./webgl";
import type { COLOR_MODE } from "../index.js";

const examples = {
  // example 1
  example1: new WebGL({
    canvasEl: document.getElementById("example-1") as HTMLCanvasElement,
    imgURL: "/ishihara-combined.png",
  }),

  // example 2
  example2: new WebGL({
    canvasEl: document.getElementById("example-2") as HTMLCanvasElement,
    imgURL: "/rgb-span.png",
  }),

  // example 3
  example3: new WebGL({
    canvasEl: document.getElementById("example-3") as HTMLCanvasElement,
    imgURL: "/chris-yang-japan.jpg",
  }),
};

// buttonz
for (const el of document.querySelectorAll("button")) {
  el.addEventListener("click", () => {
    const canvasEl = document.getElementById(el.getAttribute("aria-controls")!);
    const webgl = Object.values(examples).find(
      (ex) => ex.canvasEl === canvasEl,
    );
    if (!webgl) {
      throw new Error("Couldn’t find the canvas element");
    }
    webgl.setColorMode(
      el.getAttribute("data-color-mode") as keyof typeof COLOR_MODE,
    );
  });
}
