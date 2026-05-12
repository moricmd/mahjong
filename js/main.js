// main.js
import { Game } from "./game.js";

let game = null;

window.addEventListener("load", () => {



  // game画面を呼ぶ
  function startCPUmode() {
    showScreen("game-screen");

    setTimeout(() => {
      game = new Game();
      game.setPlayMode("CPU戦");
      game.step();
    }, 0);
  }

  function startPVPmode() {
    setTimeout(() => {
      game = new Game();
      game.setPlayMode("対人戦");
      game.step();
    }, 0);
  }


  // ------------------------------
  // 画面遷移(ログインをスキップ)
  // ------------------------------

  // タイトル → メニュー
  document.getElementById("start-btn").onclick = () => {
    showScreen("menu-screen");
  };

  // メニュー → CPU戦（ゲーム画面）
  document.getElementById("cpu-mode").onclick = () => {
    startCPUmode();
  };

});




function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "flex";
}





// ------------------------------
// 自動理牌
// ------------------------------
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



// game が変化したら常に window に反映する
Object.defineProperty(window, "game", {
  get() { return game; }
});




  
