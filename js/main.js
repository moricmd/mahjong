// main.js
import { CPUGame } from "./CPUGame.js";
import { updateGameLayout } from "./gameUI.js";

const socket = io();

let game = null;

window.addEventListener("load", () => {

  // game画面を呼ぶ
  function startCPUmode() {
    showScreen("game-screen");

    setTimeout(() => {
      game = new CPUGame();
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

window.addEventListener("resize", () => {
  if(game && game.players){
    updateGameLayout(game.players);
  }
})


function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
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


document.getElementById("pvp-mode").onclick = () => {
  console.log("対人戦のマッチングに参加中");
  socket.emit("joinMatchmaking");
}

socket.on("gameStart", (data) => {
  console.log("ゲーム開始");
  showScreen("game-screen");
})

  
