// game.js
import { generateTiles, shuffle } from "./tiles.js";
import { Player } from "./player.js";
import { renderHand, renderState } from "./ui.js";
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
    renderHand(this.players[0], index => this.onPlayerDiscard(index));
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
