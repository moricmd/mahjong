// main.js
import { Game } from "./game.js";

let game = null;

window.addEventListener("load", () => {
  game = new Game();

  document.getElementById("next-btn").onclick = () => {
    game.step();
  };
});
