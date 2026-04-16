// main.js
import { Game } from "./game.js";

let game = null;

window.addEventListener("load", () => {
  game = new Game();

  document.getElementById("next-btn").onclick = () => {
    game.step();
  };
});

//
//自動理牌
//
const autoSortBtn = document.getElementById("auto-sort-btn");
let autoSort = false;

autoSortBtn.addEventListener("click", () => {
  autoSort = !autoSort;
  autoSortBtn.textContent = `自動整理：${autoSort ? "ON" : "OFF"}`;
});

