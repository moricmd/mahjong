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
    return {
      base: 0,
      ron: 0,
      tsumo: { parent: 0, child: 0 }
    };
  }

  // 基本点：fu × 2^(han + 2)
  const base = fu * Math.pow(2, han + 2);

  if (!isTsumo) {
    // ------------------------------
    // ロン（親 ×6、子 ×4）
    // ------------------------------
    const ron = isDealer ? roundUp(base * 6) : roundUp(base * 4);
    return {
      base,
      ron,
      tsumo: { parent: 0, child: 0 }
    };
  } else {
    // ------------------------------
    // ツモ（ツモ損あり）
    // ------------------------------
    if (isDealer) {
      // 親のツモ → 子2人が同額
      const each = roundUp(base * 2);
      return {
        base,
        ron: 0,
        tsumo: { parent: each, child: each }
      };
    } else {
      // 子のツモ → 親が2倍、もう1人の子が1倍
      const parent = roundUp(base * 2);
      const child = roundUp(base);
      return {
        base,
        ron: 0,
        tsumo: { parent, child }
      };
    }
  }
}

// ------------------------------
// 100点切り上げ
// ------------------------------
function roundUp(x) {
  return Math.ceil(x / 100) * 100;
}
