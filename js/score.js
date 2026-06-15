// score.js

// ------------------------------
// 点数計算のメイン関数
// ------------------------------
// han: 飜数
// fu: 符（とりあえず30符固定でOK）
// isDealer: 親かどうか
// isTsumo: ツモかどうか
export function calcScore(han, fu = 30, isDealer = false, isTsumo = false) {
  if (han <= 0) {
    return { base: 0, ron: 0, tsumo: { parent: 0, child: 0 } };
  }

  // 基本点
  let base = fu * Math.pow(2, han + 2);

  // ------------------------------
  // 満貫以上の上限処理（重要）
  // ------------------------------
  if (han >= 13) {
    base = 8000; // 役満
  } else if (han >= 11) {
    base = 6000; // 三倍満
  } else if (han >= 8) {
    base = 4000; // 倍満
  } else if (han >= 6) {
    base = 3000; // 跳満
  } else if (han === 5) {
    base = 2000; // 満貫
  } else {
    base = roundUp(base);
  }

  // ------------------------------
  // ロン
  // ------------------------------
  if (!isTsumo) {
    const ron = isDealer ? base * 6 : base * 4;
    return {
      base,
      ron: roundUp(ron),
      tsumo: { parent: 0, child: 0 }
    };
  }

  // ------------------------------
  // ツモ（三麻ツモ損）
  // ------------------------------
  if (isDealer) {
    // 親ツモ → 子2人が同額
    const each = roundUp(base * 2);
    return {
      base,
      ron: 0,
      tsumo: { parent: each, child: each }
    };
  } else {
    // 子ツモ → 親2倍、子1倍
    const parent = roundUp(base * 2);
    const child = roundUp(base);
    return {
      base,
      ron: 0,
      tsumo: { parent, child }
    };
  }
}

function roundUp(x) {
  return Math.ceil(x / 100) * 100;
}


// ------------------------------
// 100点切り上げ
// ------------------------------
function roundUp(x) {
  return Math.ceil(x / 100) * 100;
}
