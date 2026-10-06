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


////////  追加内容

export const SCORE_TABLE = {
  ron: {
    child: {
      1: {30: 1000,
          40: 1300,
          50: 1600,
          60: 2000,
          70: 2300,
          80: 2600,
          90: 2900,
          100: 3200, 
          110: 3600
      },

      2: {25: 1600,
          30: 2000,
          40: 2600,
          50: 3200,
          60: 3900,
          70: 4500,
          80: 5200,
          90: 5800,
          100: 6400,
          110: 7100
      },

      3: {25: 3200,
          30: 3900,
          40: 5200,
          50: 6400,
          60: 7700, 
          70: 8000, 80: 8000, 90: 8000, 100: 8000, 110: 8000
      },

      4: {25: 6400,
          30: 7700, 
          40: 8000, 50: 8000, 60: 8000, 70: 8000, 80: 8000, 90: 8000, 100: 8000, 110: 8000
      },

      5: 8000,    // 満貫

      6: 12000,   // 跳満
      7: 12000,

      8: 16000,   // 倍満
      9: 16000,
      10: 16000,

      11: 24000,  // 三倍満
      12: 24000,

      13: 32000   // 役満
    },

    parent: {
      1: {30: 1500,
          40: 2000,
          50: 2400,
          60: 2900,
          70: 3400,
          80: 3900,
          90: 4400, 
          100: 4800,
          110: 5300
      },

      2: {25: 2400,
          30: 2900,
          40: 3900,
          50: 4800,
          60: 5800,
          70: 6800,
          80: 7700,
          90: 8700,
          100: 9600,
          110: 10600
      },

      3: {25: 4800,
          30: 5800,
          40: 7700,
          50: 9600,
          60: 11600,
          70: 12000, 80: 12000, 90: 12000, 100: 12000, 110: 12000
      },

      4: {25: 9600,
          30: 11600,
          40: 12000, 50: 12000, 60: 12000, 70: 12000, 80: 12000, 90: 12000, 100: 12000, 110: 12000
      },

      5: 12000,   // 満貫

      6: 18000,   // 跳満
      7: 18000,

      8: 24000,   // 倍満
      9: 24000,
      10: 24000,

      11: 36000,  // 三倍満
      12: 36000,

      13: 48000   // 役満
    }
  },

  tsumo: {
    child: {
      1: {30: {child: 300, parent: 500},
          40: {child: 400, parent: 700},
          50: {child: 400, parent: 800},
          60: {child: 500, parent: 1000},
          70: {child: 600, parent: 1200},
          80: {child: 700, parent: 1300},
          90: {child: 800, parent: 1500}, 
          100: {child: 800, parent: 1600}},

      2: {20: {child: 400, parent: 700},
          30: {child: 500, parent: 1000},
          40: {child: 700, parent: 1300},
          50: {child: 800, parent: 1600},
          60: {child: 1000, parent: 2000},
          70: {child: 1200, parent: 2300},
          80: {child: 1300, parent: 2600},
          90: {child: 1500, parent: 2900},
          100: {child: 1600, parent: 3200},
          110: {child: 1800, parent: 3600}},

      3: {20: {child: 700, parent: 1300},
          25: {child: 800, parent: 1600},
          30: {child: 1000, parent: 2000},
          40: {child: 1300, parent: 2600},
          50: {child: 1600, parent: 3200},
          60: {child: 2000, parent: 3900},
          70: {child: 2000, parent: 4000},
          80: {child: 2000, parent: 4000},
          90: {child: 2000, parent: 4000},
          100: {child: 2000, parent: 4000},
          110: {child: 2000, parent: 4000}},   
          
      4: {20: {child: 1300, parent: 2600},
          25: {child: 1600, parent: 3200},
          30: {child: 2000, parent: 3900},
          40: {child: 2000, parent: 4000},
          50: {child: 2000, parent: 4000},
          60: {child: 2000, parent: 4000},
          70: {child: 2000, parent: 4000},
          80: {child: 2000, parent: 4000},
          90: {child: 2000, parent: 4000},
          100: {child: 2000, parent: 4000},
          110: {child: 2000, parent: 4000}},
      
      5: {child: 2000, parent: 4000},

      6: {child: 3000, parent: 6000},
      7: {child: 3000, parent: 6000},

      8: {child: 4000, parent: 8000},
      9: {child: 4000, parent: 8000},
      10: {child: 4000, parent: 8000},

      11: {child: 6000, parent: 12000},
      12: {child: 6000, parent: 12000},

      13: {child: 8000, parent: 16000}

    },

    parent: {
      1: {30: {child: 500},
          40: {child: 700},
          50: {child: 800},
          60: {child: 1000},
          70: {child: 1200},
          80: {child: 1300},
          90: {child: 1500}, 
          100: {child: 1600}},

      2: {20: {child: 700},
          30: {child: 1000},
          40: {child: 1300},
          50: {child: 1600},
          60: {child: 2000},
          70: {child: 2300},
          80: {child: 2600},
          90: {child: 2900},
          100: {child: 3200},
          110: {child: 3600}},

      3: {20: {child: 1300},
          25: {child: 1600},
          30: {child: 2000},
          40: {child: 2600},
          50: {child: 3200},
          60: {child: 3900},
          70: {child: 4000},
          80: {child: 4000},
          90: {child: 4000},
          100: {child: 4000},
          110: {child: 4000}},

      4: {20: {child: 2600},
          25: {child: 3200},
          30: {child: 3900},
          40: {child: 4000},
          50: {child: 4000},
          60: {child: 4000},
          70: {child: 4000},
          80: {child: 4000},
          90: {child: 4000},
          100: {child: 4000},
          110: {child: 4000}},

      5: {child: 4000},

      6: {child: 6000},
      7: {child: 6000},

      8: {child: 8000},
      9: {child: 8000},
      10: {child: 8000},

      11: {child: 12000},
      12: {child: 12000},

      13: {child: 16000}
    }
  
  }


}




////////

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


// ------------------------------
// 100点切り上げ
// ------------------------------
function roundUp(x) {
  return Math.ceil(x / 100) * 100;
}
