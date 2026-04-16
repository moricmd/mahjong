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

    this.state = "INIT";
    this.turn = 0;
    this.wall = [];
    this.wallIndex = 0;

    this.initGame();
  }

  // -------------------------
  // INIT → 山生成
  // -------------------------
  initGame() {
    
    // 自分の風をランダム決定（東・南・西）
    const winds = ["east", "south", "west"];
    this.selfWind = winds[Math.floor(Math.random() * winds.length)];

    // 自分を基準としてCPU の座り位置を決める
    if (this.selfWind === "east") {
      this.players[1].position = "top";   // CPU1
       this.players[2].position = "right"; // CPU2
    }

    if (this.selfWind === "south") {
      this.players[1].position = "left";  // CPU1
      this.players[2].position = "right"; // CPU2
    }

    if (this.selfWind === "west") {
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

  // -------------------------
  // DEAL → 配牌
  // -------------------------
  deal() {
    for (let i = 0; i < 13; i++) {
      this.players.forEach(p => p.draw(this.wall[this.wallIndex++]));
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
    renderPlayerHand(this.players[0], index => this.onPlayerDiscard(index));

    // CPU の手牌（裏向き）
    renderCPUHand(1, this.players[1].hand.length);
    renderCPUHand(2, this.players[2].hand.length);

    // 捨て牌
    renderDiscards(0, this.players[0].discards);
    renderDiscards(1, this.players[1].discards);
    renderDiscards(2, this.players[2].discards);
}

  //
  // 自動理牌
  //
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

  // -------------------------
  // CHECK_WIN → 和了判定（最小）
  // -------------------------
  onCheckWin() {
    const p = this.players[this.turn];
    const lastTile = p.hand[p.hand.length - 1];

    // 最小の役判定（ツモ + タンヤオのみ）
    const { han } = judgeYaku(p.hand, lastTile, true);

    if (han > 0) {
      const score = calcScore(han, 30, this.turn === 0, true);
      console.log("和了！ han=", han, "score=", score);
      alert(`プレイヤー${this.turn} ツモ和了（仮） han=${han}`);
      this.state = "END_ROUND";
      return;
    }

    // 和了でなければ捨て牌へ
    if (p.isCPU) {
      // CPUは即ランダム捨て
      const idx = Math.floor(Math.random() * p.hand.length);
      p.discard(idx);

      if (this.autoSort) this.sortHand(this.turn);
      
        this.state = "NEXT_TURN";

    } else {
        // 人間は捨て牌待ち
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
