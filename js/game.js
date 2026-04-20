// game.js
import { generateTiles, shuffle } from "./tiles.js";
import { Player } from "./player.js";
import { renderPlayerHand, renderCPUHand, renderDiscards, renderState } from "./ui.js";
import { judgeYaku } from "./yaku.js";
import { calcScore } from "./score.js";

export class Game {
  constructor() {
    this.players = [
      new Player(0, false), // 自分
      new Player(1, true),  // CPU
      new Player(2, true)   // CPU
    ];

    this.state = "INIT";　// 状態
    this.turn = 0; // 巡目
    
    this.wallIndex = 0; // 山からめくった牌の番号

    this.isMensen = true; // 門前フラグ

    this.autoSort = true; // 自動整理ボタン


    this.honba = 0; // 積み棒(親連荘・流局ごとに+1)
    this.kyotaku = 0; // 供託(立直時に支払い)

    
    // 牌山
    this.wall = []; // 山
    this.rinshan = []; // 嶺上牌
    this.doraIndicators = []; // ドラ表示牌
    this.uraIndicators = []; // 裏ドラ表示牌

    this.initGame();
  }

  // -------------------------
  // INIT → 山生成
  // -------------------------
  initGame() {
    
    // 自分の風をランダム決定（東・南・西）
    const winds = [1, 2, 3]; // 東=1, 南=2, 西=3
    this.playerWind = winds[Math.floor(Math.random() * winds.length)];

    // 自分を基準としてCPU の座り位置を決める
    if (this.playerWind === 1) { // 東のとき
      this.players[1].position = "top";   // CPU1
       this.players[2].position = "right"; // CPU2
    }

    if (this.playerWind === 2) { // 南
      this.players[1].position = "left";  // CPU1
      this.players[2].position = "right"; // CPU2
    }

    if (this.playerWind === 3) { // 西
      this.players[1].position = "top";   // CPU1
      this.players[2].position = "left";  // CPU2
    }

// 自分は常に bottom
this.players[0].position = "bottom";

    
    this.wall = generateTiles();
    shuffle(this.wall);
    this.wallIndex = 0;

    this.state = "DEAL";
    this.deal();
  }

  buildWall() {
  const tiles = generateTiles(); // 108枚（3麻）
  shuffle(tiles);

  // 嶺上牌（4枚）を後ろから確保
  this.rinshan = tiles.splice(-4);

  // ドラ表示牌（1枚）
  this.doraIndicators = [ tiles.splice(-1)[0] ];

  // 裏ドラはリーチ時にめくるので今は空
  this.uraIndicators = [];

  // 残りが通常山
  this.wall = tiles;

}


  // -------------------------
  // DEAL → 配牌
  // -------------------------
  deal() {
    for (let i = 0; i < 13; i++) {
      this.players.forEach(p => p.draw(this.wall[this.wallIndex++]));
    }

    if (this.autoSort){
      this.sorthand(0);
    }

    this.state = "TURN_START";
    this.updateUI();
  }

  // -------------------------
  // UI 更新
  // -------------------------
updateUI() {
  renderState(this.state, this.turn);

  // プレイヤーの手牌
  renderPlayerHand(
    this.players[0],
    index => this.onPlayerDiscard(index),
    this.autoSort
  );

  // CPU の手牌
  renderCPUHand(1, this.players[1].hand.length);
  renderCPUHand(2, this.players[2].hand.length);

  // 捨て牌
  renderDiscards(0, this.players[0].discards);
  renderDiscards(1, this.players[1].discards);
  renderDiscards(2, this.players[2].discards);
}

  // ------------------------------
  // ドラ表示エリア
  // ------------------------------
  updateDoraUI() {
  const area = document.getElementById("dora-indicators");
  area.innerHTML = "";

  this.doraIndicators.forEach(tile => {
    const img = document.createElement("img");
    img.src = tileToImage(tile); // あなたの tileToImage() を使用
    area.appendChild(img);
  });

  document.getElementById("honba-count").textContent = this.honba;
  document.getElementById("kyotaku-count").textContent = this.kyotaku;
}

  setPlayMode(mode) {
  document.getElementById("play-mode").textContent = mode;
}






  // ------------------------------
  // 自動理牌
  // ------------------------------
  sortHand(playerIndex) {
  const p = this.players[playerIndex];

  // 手牌が14枚の時は理牌しない
  if (p.hand.length !== 13) return;

  const windOrder = { 1: 0, 2: 1, 3: 2, 4: 3 };
  const dragonOrder = { 1: 0, 2: 1, 3: 2 };
  const suitOrder = { man: 0, pin: 1, sou: 2, wind: 3, dragon: 4 };

  p.hand.sort((a, b) => {
    // 種類順
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }

    // 数牌
    if (a.suit === "man" || a.suit === "pin" || a.suit === "sou") {
      if (a.value !== b.value) return a.value - b.value;
      // 赤牌は通常の5の直後
      return (a.red ? 1 : 0) - (b.red ? 1 : 0);
    }

    // 風牌
    if (a.suit === "wind") {
      return windOrder[a.value] - windOrder[b.value];
    }

    // 三元牌
    if (a.suit === "dragon") {
      return dragonOrder[a.value] - dragonOrder[b.value];
    }

    return 0;
  });
}




  
  // -------------------------
  // 外部から呼ぶ1ステップ
  // -------------------------
  step() {
    switch (this.state) {
      case "TURN_START":
        this.onTurnStart();
        break;

      case "DRAW":
        this.onDraw();
        break;

      case "CHECK_WIN":
        this.onCheckWin();
        break;

      case "DISCARD":
        // 人間はクリック待ちなのでここでは何もしない
        break;

      case "NEXT_TURN":
        this.onNextTurn();
        break;

      case "END_ROUND":
        alert("局終了（仮）");
        break;
    }

    this.updateUI();
  }

  // -------------------------
  // TURN_START
  // -------------------------
  onTurnStart() {
    if (this.wallIndex >= this.wall.length) {
      this.state = "END_ROUND";
      return;
    }
    this.state = "DRAW";
  }

  // -------------------------
  // DRAW → ツモ
  // -------------------------
  onDraw() {
    const p = this.players[this.turn];
    const tile = this.wall[this.wallIndex++];
    p.draw(tile);

    // ツモ和了チェックへ
    this.state = "CHECK_WIN";
  }

  // 通常ツモ
  drawTile() {
    return this.wall.pop();
  }

  // 嶺上牌ツモ
  drawRinshan() {
    return this.rinshan.pop();
  }


  // -------------------------
  // CHECK_WIN → 和了判定（最小）
  // -------------------------
  onCheckWin() {
  const p = this.players[this.turn];
  const lastTile = p.hand[p.hand.length - 1];

  // 役判定
  const result = judgeYaku(
    p,                // player
    p.hand,           // handTiles
    lastTile,         // winTile
    true,             // isTsumo
    this.playerWind,  // playerWind
    1                 // roundWind（東場固定）
  );

  const { han, yakuList } = result;

  if (han > 0) {
    const score = calcScore(
      result,          // ← ここが最重要（オブジェクトで渡す）
      30,
      this.turn === 0,
      true
    );

    console.log("和了！ han=", han, "yaku=", yakuList, "score=", score);
    alert(`プレイヤー${this.turn} ツモ和了（仮） han=${han}\n${yakuList.join(" / ")}`);
    this.state = "END_ROUND";
    return;
  }

  // 和了でなければ捨て牌へ
  if (p.isCPU) {
    const idx = Math.floor(Math.random() * p.hand.length);
    p.discard(idx);

    if (this.autoSort) this.sortHand(this.turn);
    this.state = "NEXT_TURN";

  } else {
    this.state = "DISCARD";
  }
}


  


  // -------------------------
  // DISCARD（人間）
  // -------------------------
  onPlayerDiscard(index) {
    if (this.state !== "DISCARD") return;

    const p = this.players[0];
    p.discard(index);

    // 打牌時に理牌
    if (this.autoSort) this.sortHand(0);
    
    this.state = "NEXT_TURN";
    this.updateUI();
  }



  // -------------------------
  // NEXT_TURN
  // -------------------------
  onNextTurn() {
    this.turn = (this.turn + 1) % 3;
    this.state = "TURN_START";
  }
}

// -------------------------------
// 画面切り替え
// -------------------------------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "flex";
}



