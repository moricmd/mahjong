// player.js

export class Player {
  constructor(index, isCPU = false) {
    this.index = index;
    this.isCPU = isCPU;

    // 手牌・捨て牌
    this.hand = [];
    this.discards = [];

    // 副露（ポン・カン）
    this.melds = [];        // { type: "pon" | "ankan" | "daiminkan" | "kakan", tiles: [...] }

    // 状態フラグ
    this.isMenzen = true;   // 門前
    this.isRiichi = false;  // 立直
    this.isDoubleRiichi = false; // ダブル立直
    this.isIppatsu = false; // 一発

    // カン・北抜き
    this.kanCount = 0;      // カンの回数（三槓子判定用）
    this.northCount = 0;    // 北抜きの回数（北ドラ用）
  }

  draw(tile) {
    if (!tile) return;
    this.hand.push(tile);
  }

  discard(index) {
    const tile = this.hand.splice(index, 1)[0];
    this.discards.push(tile);
    return tile;
  }
}

