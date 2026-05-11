// player.js

export class Player {
  constructor(index, isCPU = false) {
    this.index = index;
    this.isCPU = isCPU;

    // -------------------------
    // 手牌・捨て牌・副露
    // -------------------------
    this.hand = [];
    this.discards = [];
    this.melds = []; // { type: "pon" | "ankan" | "daiminkan" | "kakan", tiles: [...], from }

    // -------------------------
    // リーチ関連
    // -------------------------
    this.isMenzen = true;       // 門前
    this.isRiichi = false;      // 立直
    this.isDoubleRiichi = false;// ダブル立直
    this.isIppatsu = false;     // 一発
    this.riichiTurn = null;     // 立直した巡目
    this.riichiTile = null;     // 立直宣言牌

    // -------------------------
    // フリテン関連
    // -------------------------
    this.isFuriten = false;     // 現在フリテンか
    this.furitenType = "none";  // "none" | "discard" | "sameTurn" | "riichi"
    this.missedRon = false;     // リーチ後にロン見逃ししたか

    // -------------------------
    // テンパイ・待ち牌
    // -------------------------
    this.isTenpai = false;      // テンパイしているか
    this.waits = [];            // 待ち牌リスト（例: ["5m", "8p"]）

    // -------------------------
    // カン・北抜き
    // -------------------------
    this.kanCount = 0;          // カンの回数（三槓子判定用）
    this.northCount = 0;        // 北抜きの回数（北ドラ用）
  }

  // -------------------------
  // ツモ
  // -------------------------
  draw(tile) {
    if (!tile) return;
    this.hand.push(tile);
  }

  // -------------------------
  // 打牌
  // -------------------------
  discard(index) {
    const tile = this.hand.splice(index, 1)[0];
    this.discards.push(tile);
    return tile;
  }
}

