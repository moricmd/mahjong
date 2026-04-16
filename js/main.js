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
let autoSort = true;

autoSortBtn.textContent = "自動整理：ON";

autoSortBtn.addEventListener("click", () => {
  autoSort = !autoSort;
  autoSortBtn.textContent = `自動整理：${autoSort ? "ON" : "OFF"}`;

  if (game) {
    game.autoSort = autoSort;

    if (autoSort){
      game.sortHand(0);
      game.updateUI();
    }

  }
});

