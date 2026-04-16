// yaku.js

// ------------------------------
// 役判定のメイン関数
// ------------------------------
export function judgeYaku(handTiles, winTile, isTsumo, playerWind = 1, roundWind = 1) {
  const tiles = [...handTiles];

  const yakuList = [];
  let han = 0;

  // ------------------------------
  // 1. 和了形チェック（最小構成）
  // ------------------------------
  const isWinning = checkWinningShape(tiles);
  if (!isWinning) {
    return { han: 0, yakuList: [] };
  }

  // ------------------------------
  // 2. 役判定（最小構成）
  // ------------------------------

  // ツモ
  if (isTsumo) {
    yakuList.push("門前清自摸和");
    han += 1;
  }

  // タンヤオ
  if (isTanyao(tiles)) {
    yakuList.push("断么九");
    han += 1;
  }

  // 役牌（風牌・三元牌）
  const yakuhaiHan = checkYakuhai(tiles, playerWind, roundWind);
  if (yakuhaiHan > 0) {
    yakuList.push("役牌");
    han += yakuhaiHan;
  }

// -------------------------
// 役牌判定
// -------------------------

// 三元牌（白=1, 發=2, 中=3）
const dragonCount = { 1: 0, 2: 0, 3: 0 };

// 風牌（東=1, 南=2, 西=3, 北=4）
const windCount = { 1: 0, 2: 0, 3: 0, 4: 0 };

for (const t of hand) {
  if (t.suit === "dragon") dragonCount[t.value]++;
  if (t.suit === "wind") windCount[t.value]++;
}

// 三元牌の刻子
for (let d = 1; d <= 3; d++) {
  if (dragonCount[d] >= 2) han++;   // 雀頭 or 刻子
}

// 自風（game.selfWind を wind の番号に変換）
const windMap = { east: 1, south: 2, west: 3, north: 4 };
const selfWindNum = windMap[selfWind];
if (windCount[selfWindNum] >= 2) han++;

// 場風（東1局なら東=1）
const roundWindNum = 1; // 今は東固定
if (windCount[roundWindNum] >= 2) han++;


//
// 一盃口 + 二盃口
// 
const iipeikouHan = checkIipeikou(tiles);
if (iipeikouHan === 3) {
  yakuList.push("二盃口");
  han += 3;
} else if (iipeikouHan === 1) {
  yakuList.push("一盃口");
  han += 1;
}


  return { han, yakuList };
}

// ---------------------------------------------------------------------------------------------------------------

// ------------------------------
// 役の定義
// ------------------------------
function checkWinningShape(tiles) {
  tiles.sort((a, b) => a.id - b.id);

  // 雀頭候補を全探索
  for (let i = 0; i < tiles.length - 1; i++) {
    if (sameTile(tiles[i], tiles[i + 1])) {
      const remaining = tiles.slice();
      remaining.splice(i, 2);

      if (checkMelds(remaining)) {
        return true;
      }
    }
  }
  return false;
}

// ------------------------------
// 面子分解（順子・刻子）
// ------------------------------
function checkMelds(tiles) {
  if (tiles.length === 0) return true;

  const first = tiles[0];

  // 刻子チェック
  const same = tiles.filter(t => sameTile(t, first));
  if (same.length >= 3) {
    const rest = removeTiles(tiles, first, 3);
    if (checkMelds(rest)) return true;
  }

  // 順子チェック（数牌のみ）
  if (first.suit === "man" || first.suit === "pin" || first.suit === "sou") {
    const t2 = findTile(tiles, first.suit, first.value + 1);
    const t3 = findTile(tiles, first.suit, first.value + 2);

    if (t2 && t3) {
      const rest = removeSpecificTiles(tiles, [first, t2, t3]);
      if (checkMelds(rest)) return true;
    }
  }

  return false;
}

// ------------------------------
// タンヤオ判定
// ------------------------------
function isTanyao(tiles) {
  return tiles.every(t => {
    if (t.suit === "wind" || t.suit === "dragon") return false;
    return t.value >= 2 && t.value <= 8;
  });
}

// ------------------------------
// 役牌判定（風牌・三元牌）
// ------------------------------
function checkYakuhai(tiles, playerWind, roundWind) {
  let han = 0;

  const counts = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  if (counts[`dragon_white`] >= 3) yakuList.push(`役牌：白`);
  if (counts[`dragon_green`] >= 3) yakuList.push("役牌：發");
  if (counts[`dragon_red`] >= 3) yakuList.push("役牌：中");
  if (counts[`wind_${playerWind}`] >= 3) yakuList.push("自風牌：東");
  if (counts[`wind_${roundWind}`] >= 3) yakuList.push("場風牌：南");

  return han;
}

//
// 一盃口 + 二盃口
//
function checkIipeikou(tiles) {
  let han = 0;

  // スートごとに数字を集計
  const suits = { man: [], pin: [], sou: [] };

  for (const t of tiles) {
    if (t.suit === "man" || t.suit === "pin" || t.suit === "sou") {
      suits[t.suit].push(t.value);
    }
  }

  let iipeikouCount = 0;  // 一盃口の数

  for (const suit of ["man", "pin", "sou"]) {
    const arr = suits[suit].sort((a, b) => a - b);

    const shuntsuCount = {};

    for (let i = 0; i < arr.length - 2; i++) {
      const a = arr[i], b = arr[i + 1], c = arr[i + 2];
      if (a + 1 === b && b + 1 === c) {
        const key = `${suit}-${a}`;
        shuntsuCount[key] = (shuntsuCount[key] || 0) + 1;
      }
    }

    // 同じ順子が2回 → 一盃口
    for (const key in shuntsuCount) {
      if (shuntsuCount[key] >= 2) {
        iipeikouCount++;
      }
    }
  }

  // 一盃口が2つ → 二盃口（3翻）
  if (iipeikouCount >= 2) {
    return 3;  // 二盃口
  }

  // 一盃口が1つ → 一盃口（1翻）
  if (iipeikouCount === 1) {
    return 1;
  }

  return 0;
}



// ------------------------------
// 補助関数
// ------------------------------
function sameTile(a, b) {
  return a.suit === b.suit && a.value === b.value;
}

function findTile(tiles, suit, value) {
  return tiles.find(t => t.suit === suit && t.value === value);
}

function removeTiles(tiles, tile, count) {
  const result = tiles.slice();
  let removed = 0;

  for (let i = 0; i < result.length && removed < count; i++) {
    if (sameTile(result[i], tile)) {
      result.splice(i, 1);
      i--;
      removed++;
    }
  }
  return result;
}

function removeSpecificTiles(tiles, list) {
  const result = tiles.slice();
  for (const t of list) {
    const idx = result.findIndex(x => sameTile(x, t));
    if (idx >= 0) result.splice(idx, 1);
  }
  return result;
}
