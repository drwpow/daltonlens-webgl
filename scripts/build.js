import daltonLens from "../index.js";
import fs from "node:fs";

fs.writeFileSync("./shader.vert", daltonLens.vShader);
fs.writeFileSync("./shader.frag", daltonLens.fShader);
