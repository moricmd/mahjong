// game.js
import { generateTiles, shuffle } from "./tiles.js";
import { Player } from "./player.js";
import { renderPlayerHand, renderCPUHand, renderDiscards, renderState } from "./ui.js";
import { judgeYaku } from "./yaku.js";
import { calcScore } from "./score.js";
import { chooseDiscardIndex } from "./CPU.js";

export class Game {
  constructor() {
    this.players = [
      new Player(0, false),
      new Player(1, true),
      new Player(2, true)
    ];

    this.state = "INIT";
    this.turn = 0;

    this.wallIndex = 0;
    this.autoSort = true;

    this.honba = 0;
    this.kyotaku = 0;

    this.wall = [];
    this.rinshan = [];
    this.doraIndicators = [];
    this.uraIndicators = [];


    this.scores = [35000, 35000, 35000]; // 点数
    this.round = 1;   // 1=東, 2=南, 3=西
    this.kyoku = 1;   // 1〜3
    this.dealer = 0;  


    this.initGame();
  }

  // -------------------------
  // INIT → 山生成
  // -------------------------
  initGame() {
    const winds = [1, 2, 3];
    this.playerWind = winds[Math.floor(Math.random() * winds.length)];

    if (this.playerWind === 1) {
      this.players[1].position = "top";
      this.players[2].position = "right";
    }
    if (this.playerWind === 2) {
      this.players[1].position = "left";
      this.players[2].position = "right";
    }
    if (this.playerWind === 3) {
      this.players[1].position = "top";
      this.players[2].position = "left";
    }

    this.players[0].position = "bottom";

    this.buildWall();
    this.state = "DEAL";
    this.deal();
  }

  // -------------------------
  // 山構築（嶺上・ドラ）
  // -------------------------
  buildWall() {
    const tiles = generateTiles();
    shuffle(tiles);

    this.rinshan = tiles.splice(-4);
    this.doraIndicators = [tiles.splice(-1)[0]];
    this.uraIndicators = [];

    this.wall = tiles;
    this.wallIndex = 0;
  }

  // -------------------------
  // 配牌
  // -------------------------
  deal() {
    for (let i = 0; i < 13; i++) {
      this.players.forEach(p => p.draw(this.wall[this.wallIndex++]));
    }

    if (this.autoSort) this.sortHand(0);

    this.state = "TURN_START";
    this.updateUI();
  }

  // -------------------------
  // UI 更新
  // -------------------------
  updateUI() {
    renderState(this.state, this.turn);

    renderPlayerHand(
      this.players[0],
      index => this.onPlayerDiscard(index),
      this.autoSort
    );

    renderCPUHand(1, this.players[1].hand.length);
    renderCPUHand(2, this.players[2].hand.length);

    renderDiscards(0, this.players[0].discards);
    renderDiscards(1, this.players[1].discards);
    renderDiscards(2, this.players[2].discards);
  }


  
  // ------------------------------
  // プレイモード表示
  // ------------------------------
  setPlayMode(mode) {
    const el = document.getElementById("play-mode");
    if (el) el.textContent = mode;
  }



  // -------------------------
  // 一発クリア
  // -------------------------
  clearIppatsu() {
    for (const p of this.players) {
      p.isIppatsu = false;
    }
  }

  // -------------------------
  // 自動理牌
  // -------------------------
  sortHand(playerIndex) {
    const p = this.players[playerIndex];
    if (p.hand.length !== 13) return;

    const windOrder = { 1: 0, 2: 1, 3: 2, 4: 3 };
    const dragonOrder = { 1: 0, 2: 1, 3: 2 };
    const suitOrder = { man: 0, pin: 1, sou: 2, wind: 3, dragon: 4 };

    p.hand.sort((a, b) => {
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }

      if (a.suit === "man" || a.suit === "pin" || a.suit === "sou") {
        if (a.value !== b.value) return a.value - b.value;
        return (a.red ? 1 : 0) - (b.red ? 1 : 0);
      }

      if (a.suit === "wind") {
        return windOrder[a.value] - windOrder[b.value];
      }

      if (a.suit === "dragon") {
        return dragonOrder[a.value] - dragonOrder[b.value];
      }

      return 0;
    });
  }

  // =========================
  // 副露処理 
  // =========================

  // -------------------------
  // ポン
  // -------------------------
  onPon(playerIndex, tile) {
    const p = this.players[playerIndex];

    let removed = 0;
    for (let i = 0; i < p.hand.length && removed < 2; i++) {
      if (sameTile(p.hand[i], tile)) {
        p.hand.splice(i, 1);
        i--;
        removed++;
      }
    }

    p.melds.push({
      type: "pon",
      tiles: [tile, tile, tile]
    });

    p.isMenzen = false;
    this.clearIppatsu();

    this.turn = playerIndex;
    this.state = "DISCARD";
    this.updateUI();
  }

  // -------------------------
  // 暗槓
  // -------------------------
  onAnkan(playerIndex, tile) {
    const p = this.players[playerIndex];

    let removed = 0;
    for (let i = 0; i < p.hand.length && removed < 4; i++) {
      if (sameTile(p.hand[i], tile)) {
        p.hand.splice(i, 1);
        i--;
        removed++;
      }
    }

    p.melds.push({
      type: "ankan",
      tiles: [tile, tile, tile, tile]
    });

    p.kanCount++;
    this.addKanDora();
    this.clearIppatsu();

    this.state = "DRAW";
    this.updateUI();
  }

  // -------------------------
  // 大明槓
  // -------------------------
  onDaiminkan(playerIndex, tile) {
    const p = this.players[playerIndex];

    let removed = 0;
    for (let i = 0; i < p.hand.length && removed < 3; i++) {
      if (sameTile(p.hand[i], tile)) {
        p.hand.splice(i, 1);
        i--;
        removed++;
      }
    }

    p.melds.push({
      type: "daiminkan",
      tiles: [tile, tile, tile, tile]
    });

    p.isMenzen = false;
    p.kanCount++;

    this.addKanDora();
    this.clearIppatsu();

    this.turn = playerIndex;
    this.state = "DRAW";
    this.updateUI();
  }

  // -------------------------
  // 加槓
  // -------------------------
  onKakan(playerIndex, tile) {
    const p = this.players[playerIndex];

    const idx = p.hand.findIndex(t => sameTile(t, tile));
    p.hand.splice(idx, 1);

    const meld = p.melds.find(m => m.type === "pon" && sameTile(m.tiles[0], tile));
    meld.type = "kakan";
    meld.tiles.push(tile);

    p.kanCount++;

    this.addKanDora();
    this.clearIppatsu();

    this.state = "DRAW";
    this.updateUI();
  }

  // -------------------------
  // 北抜き
  // -------------------------
  onNorth(playerIndex) {
    const p = this.players[playerIndex];

    const idx = p.hand.findIndex(t => t.suit === "wind" && t.value === 4);
    if (idx < 0) return;

    const tile = p.hand[idx];
    p.hand.splice(idx, 1);

    p.northCount++;

    this.doraIndicators.push(tile);

    // ★ あなたの仕様：北抜きでも一発消す
    this.clearIppatsu();

    this.state = "DRAW";
    this.updateUI();
  }

  // -------------------------
  // カンドラ追加（仮実装）
  // -------------------------
  addKanDora() {
    if (this.wall.length > 0) {
      this.doraIndicators.push(this.wall[this.wallIndex++]);
    }
  }

  // =========================
  // 進行処理
  // =========================

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

    this.state = "CHECK_WIN";

    if (p.isCPU) {
      setTimeout(() => this.step(), 300);
    }
  }

  // -------------------------
  // CHECK_WIN → 和了判定
  // -------------------------
  onCheckWin() {
    const p = this.players[this.turn];
    const lastTile = p.hand[p.hand.length - 1];

    const result = judgeYaku(
      p,
      p.hand,
      lastTile,
      true,   // isTsumo
      false,  // isRon
      this.playerWind,
      1,
      this.doraIndicators,
      this.uraIndicators,
      this.wallIndex >= this.wall.length
    );

    if (result.han > 0) {
      const score = calcScore(result, 30, this.turn === 0, true);

      alert(`プレイヤー${this.turn} ツモ和了！ han=${result.han}\n${result.yakuList.join(" / ")}`);
      this.state = "END_ROUND";
      return;
    }

    // 和了でなければ捨て牌へ
    if (p.isCPU) {
      const idx = chooseDiscardIndex(p.hand);
      const discardTile = p.discard(idx);

      if (this.onCheckRon(discardTile, this.turn)) return;

      if (this.autoSort) this.sortHand(this.turn);
      this.state = "NEXT_TURN";
    } else {
      this.state = "DISCARD";
    }
  }

  // -------------------------
  // ロン判定
  // -------------------------
  onCheckRon(discardTile, discarderIndex) {
    for (let i = 0; i < 3; i++) {
      if (i === discarderIndex) continue;

      const p = this.players[i];
      const tempHand = [...p.hand, discardTile];

      const result = judgeYaku(
        p,
        tempHand,
        discardTile,
        false,  // isTsumo
        true,   // isRon
        this.playerWind,
        1,
        this.doraIndicators,
        this.uraIndicators,
        this.wallIndex >= this.wall.length
      );

      if (result.han > 0) {
        const score = calcScore(result, 30, i === 0, false);

        alert(`プレイヤー${i} が ロン和了！ han=${result.han}\n${result.yakuList.join(" / ")}`);

        this.state = "END_ROUND";
        return true;
      }
    }

    return false;
  }


  // -------------------------
  // 聴牌判定
  // -------------------------
  isTenpai(playerIndex) {
    const p = this.players[playerIndex];
    return checkTenpai(p.hand); // あなたの checkTenpai() を使う
  }


  // -------------------------
  // DISCARD（人間）
  // -------------------------
  onPlayerDiscard(index) {
    if (this.state !== "DISCARD") return;

    const p = this.players[0];
    const discardTile = p.discard(index);

    if (this.onCheckRon(discardTile, 0)) return;

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

    if (this.players[this.turn].isCPU) {
      setTimeout(() => this.step(), 300);
    }
  }
}

