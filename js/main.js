// main.js
import { Game } from "./game.js";

let game = null;

window.addEventListener("load", () => {
  game = new Game();

  
// モード表示
if (true){
  game.setPlayMode("CPU戦");
} 

/*
else {
  game.setPlayMode("対人戦");
}
*/


// game画面を呼ぶ
function startCPUmode() {
  window.game = new Game();
  game.setPlayMode("CPU戦");
}

function startPVPmode() {
  window.game = new Game();
  game.setPlayMode("対人戦");
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
  showScreen("game-screen");
  startCPUmode();
};

/*

// ------------------------------
// 画面遷移
// ------------------------------
// タイトル → ログイン
document.getElementById("to-login").onclick = () => {
  showScreen("login-screen");
};

// ログイン → メニュー（認証は後で実装）
document.getElementById("login-btn").onclick = () => {
  // 認証処理は後で追加
  showScreen("menu-screen");
};

// ログイン → アカウント作成
document.getElementById("to-register").onclick = () => {
  showScreen("register-screen");
};

// アカウント作成 → ログイン
document.getElementById("back-login").onclick = () => {
  showScreen("login-screen");
};

// メニュー → CPU戦
document.getElementById("cpu-mode").onclick = () => {
  showScreen("game-screen");
  startCPUmode(); // ← 後で実装
};

// メニュー → 対人戦
document.getElementById("pvp-mode").onclick = () => {
  showScreen("game-screen");
  startPVPmode(); // ← 後で実装
};

*/



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

