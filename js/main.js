// js/main.js
import { CPUGame } from "./CPUGame.js";
import { updateGameLayout } from "./gameUI.js";
import { initPvPClient } from "./pvpClient.js";

let game = null;

// ------------------------------
// 自動理牌
// ------------------------------
const autoSortBtn = document.getElementById("auto-sort-btn");
let autoSort = true;
autoSortBtn.textContent = "自動整理：ON";

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => (s.style.display = "none"));
  document.getElementById(id).style.display = "block";
}

// 対人戦クライアント側の受信・描画を初期化
initPvPClient(socket, {
  showScreen,
  getAutoSort: () => autoSort
});

window.addEventListener("load", () => {
  function startCPUmode() {
    showScreen("game-screen");

    setTimeout(() => {
      game = new CPUGame();
      game.setPlayMode("CPU戦");
      game.step();
    }, 0);
  }

  // タイトル → メニュー
  document.getElementById("start-btn").onclick = () => {
    showScreen("menu-screen");
  };

  // メニュー → CPU戦（ゲーム画面）
  document.getElementById("cpu-mode").onclick = () => {
    startCPUmode();
  };

  // メニュー → 対人戦（マッチング参加）
  document.getElementById("pvp-mode").onclick = () => {
    if(!socket){
      const socket = io();
      initPvPClient(socket, {
        showScreen,
        getAutoSort: () => autoSort
      });
    }

    console.log("対人戦のマッチングを開始");
    socket.emit("joinMatchMaking");
  };
});

window.addEventListener("resize", () => {
  if (game && game.players) {
    updateGameLayout(game.players);
  }
});

autoSortBtn.addEventListener("click", () => {
  autoSort = !autoSort;
  autoSortBtn.textContent = `自動整理：${autoSort ? "ON" : "OFF"}`;

  if (game) {
    game.autoSort = autoSort;

    if (autoSort) {
      game.sortHand(0);
      game.updateUI();
    }
  }
});

// game が変化したら常に window に反映する
Object.defineProperty(window, "game", {
  get() {
    return game;
  }
});