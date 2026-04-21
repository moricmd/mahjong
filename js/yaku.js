// yaku.js

// ------------------------------
// 役判定のメイン関数
// ------------------------------
export function judgeYaku(
  player,
  handTiles,
  winTile,
  isTsumo,
  playerWind = 1,
  roundWind = 1,
  doraIndicators = [],
  uraIndicators = []
) {
  const tiles = [...handTiles];
  const yakuList = [];
  let han = 0;

  // 和了形チェック
  if (!checkWinningShape(tiles)) {
    return { han: 0, yakuList: [] };
  }

  // 立直
  if (player.isRiichi) {
    yakuList.push("立直");
    han += 1;
  }

  // ツモ（門前のみ）
  if (isTsumo && player.isMenzen) {
    yakuList.push("門前清自摸和");
    han += 1;
  }

  // タンヤオ
  if (isTanyao(tiles)) {
    yakuList.push("断么九");
    han += 1;
  }

  // 役牌
  const yakuhaiHan = checkYakuhai(tiles, playerWind, roundWind);
  if (yakuhaiHan > 0) {
    yakuList.push("役牌");
    han += yakuhaiHan;
  }

  // 一盃口・二盃口
  if (player.isMenzen) {
    const iipeikouHan = checkIipeikou(tiles);
    if (iipeikouHan === 3) {
      yakuList.push("二盃口");
      han += 3;
    } else if (iipeikouHan === 1) {
      yakuList.push("一盃口");
      han += 1;
    }
  }

  // 平和
  const pinfuHan = checkPinfu(tiles, playerWind, roundWind);
  if (player.isMenzen && pinfuHan > 0) {
    yakuList.push("平和");
    han += pinfuHan;
  }

  // ドラ
  const doraCount = countDora(tiles, doraIndicators);
  if (doraCount > 0) {
    yakuList.push(`ドラ${doraCount}`);
    han += doraCount;
  }

  // 裏ドラ
  if (player.isRiichi) {
    const uraCount = countDora(tiles, uraIndicators);
    if (uraCount > 0) {
      yakuList.push(`裏ドラ${uraCount}`);
      han += uraCount;
    }
  }

  // 三色同刻
  const sanshokuHan = checkSanshokuDoukou(tiles);
  if (sanshokuHan > 0) {
    yakuList.push("三色同刻");
    han += sanshokuHan;
  }

  // 一気通貫
  const ittsuuHan = checkIttsuu(tiles);
  if (ittsuuHan > 0) {
    if (player.isMenzen) {
      yakuList.push("一気通貫");
      han += 2;
    } else {
      yakuList.push("一気通貫（食い下がり）");
      han += 1;
    }
  }

  return { han, yakuList };
}


// ======================================================================
// 役の定義
// ======================================================================

// ------------------------------
// 和了形チェック
// ------------------------------
function checkWinningShape(tiles) {
  tiles.sort((a, b) => a.id - b.id);

  for (let i = 0; i < tiles.length - 1; i++) {
    if (sameTile(tiles[i], tiles[i + 1])) {
      const remaining = tiles.slice();
      remaining.splice(i, 2);
      if (checkMelds(remaining)) return true;
    }
  }
  return false;
}

// ------------------------------
// 面子分解
// ------------------------------
function checkMelds(tiles) {
  if (tiles.length === 0) return true;

  const first = tiles[0];

  // 刻子
  const same = tiles.filter(t => sameTile(t, first));
  if (same.length >= 3) {
    const rest = removeTiles(tiles, first, 3);
    if (checkMelds(rest)) return true;
  }

  // 順子
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
// タンヤオ
// ------------------------------
function isTanyao(tiles) {
  return tiles.every(t => {
    if (t.suit === "wind" || t.suit === "dragon") return false;
    return t.value >= 2 && t.value <= 8;
  });
}

// ------------------------------
// 役牌
// ------------------------------
function checkYakuhai(tiles, playerWind, roundWind) {
  let han = 0;

  const counts = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  // 三元牌
  if (counts["dragon-1"] >= 3) han++;
  if (counts["dragon-2"] >= 3) han++;
  if (counts["dragon-3"] >= 3) han++;

  // 自風
  if (counts[`wind-${playerWind}`] >= 3) han++;

  // 場風
  if (counts[`wind-${roundWind}`] >= 3) han++;

  return han;
}

// ------------------------------
// 一盃口・二盃口
// ------------------------------
function checkIipeikou(tiles) {
  const suits = { man: [], pin: [], sou: [] };

  for (const t of tiles) {
    if (suits[t.suit]) suits[t.suit].push(t.value);
  }

  let count = 0;

  for (const suit of ["man", "pin", "sou"]) {
    const arr = suits[suit].sort((a, b) => a - b);
    const shuntsu = {};

    for (let i = 0; i < arr.length - 2; i++) {
      if (arr[i] + 1 === arr[i + 1] && arr[i + 1] + 1 === arr[i + 2]) {
        const key = `${suit}-${arr[i]}`;
        shuntsu[key] = (shuntsu[key] || 0) + 1;
      }
    }

    for (const key in shuntsu) {
      if (shuntsu[key] >= 2) count++;
    }
  }

  if (count >= 2) return 3; // 二盃口
  if (count === 1) return 1; // 一盃口
  return 0;
}

// ------------------------------
// 平和
// ------------------------------
function checkPinfu(tiles, playerWind, roundWind) {
  const counts = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  // 雀頭が役牌なら不可
  for (const key in counts) {
    if (counts[key] === 2) {
      const [suit, value] = key.split("-");
      const v = Number(value);

      if (suit === "dragon") return 0;
      if (suit === "wind" && (v === playerWind || v === roundWind)) return 0;
    }
  }

  // 順子が4つ必要
  const nums = tiles.filter(t => t.suit !== "wind" && t.suit !== "dragon");
  let shuntsu = 0;

  const arr = nums.sort((a, b) => a.value - b.value);

  for (let i = 0; i < arr.length - 2; i++) {
    if (
      arr[i].suit === arr[i + 1].suit &&
      arr[i + 1].suit === arr[i + 2].suit &&
      arr[i].value + 1 === arr[i + 1].value &&
      arr[i + 1].value + 1 === arr[i + 2].value
    ) {
      shuntsu++;
    }
  }

  return shuntsu >= 4 ? 1 : 0;
}

// ------------------------------
// ドラ
// ------------------------------
function countDora(tiles, indicators) {
  let count = 0;

  for (const ind of indicators) {
    const next = nextTile(ind);
    for (const t of tiles) {
      if (t.suit === next.suit && t.value === next.value) count++;
    }
  }

  return count;
}

// ------------------------------
// 三色同刻
// ------------------------------
function checkSanshokuDoukou(tiles) {
  const counts = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  for (let n = 1; n <= 9; n++) {
    if (
      counts[`man-${n}`] >= 3 &&
      counts[`pin-${n}`] >= 3 &&
      counts[`sou-${n}`] >= 3
    ) {
      return 2;
    }
  }

  return 0;
}

// ------------------------------
// 一気通貫
// ------------------------------
function checkIttsuu(tiles) {
  const suits = ["man", "pin", "sou"];

  for (const s of suits) {
    const has123 = tiles.some(t => t.suit === s && t.value === 1) &&
                   tiles.some(t => t.suit === s && t.value === 2) &&
                   tiles.some(t => t.suit === s && t.value === 3);

    const has456 = tiles.some(t => t.suit === s && t.value === 4) &&
                   tiles.some(t => t.suit === s && t.value === 5) &&
                   tiles.some(t => t.suit === s && t.value === 6);

    const has789 = tiles.some(t => t.suit === s && t.value === 7) &&
                   tiles.some(t => t.suit === s && t.value === 8) &&
                   tiles.some(t => t.suit === s && t.value === 9);

    if (has123 && has456 && has789) return 2;
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
