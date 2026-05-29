// tiles.js

// 三麻（雀魂）牌生成
export function generateTiles() {
  const tiles = [];
  let id = 0;

  // 萬子 1,9 のみ（雀魂三麻仕様）
  [1, 9].forEach(v => {
    for (let i = 0; i < 4; i++) {
      tiles.push({ id: id++, suit: "man", value: v, red: false });
    }
  });

  // 筒子 1〜9（5p は「3枚＋赤1枚」で合計4枚）
  for (let v = 1; v <= 9; v++) {
    const count = (v === 5) ? 3 : 4;  // ★ 5だけ3枚にする
    for (let i = 0; i < count; i++) {
      tiles.push({ id: id++, suit: "pin", value: v, red: false });
    }
    if (v === 5) {
      tiles.push({ id: id++, suit: "pin", value: 5, red: true }); // ★ 赤5p
    }
  }

  // 索子 1〜9（5s も「3枚＋赤1枚」で合計4枚）
  for (let v = 1; v <= 9; v++) {
    const count = (v === 5) ? 3 : 4;  // ★ 5だけ3枚にする
    for (let i = 0; i < count; i++) {
      tiles.push({ id: id++, suit: "sou", value: v, red: false });
    }
    if (v === 5) {
      tiles.push({ id: id++, suit: "sou", value: 5, red: true }); // ★ 赤5s
    }
  }

  // 風牌（東=1, 南=2, 西=3, 北=4）
  const winds = [1, 2, 3, 4];
  winds.forEach(v => {
    for (let i = 0; i < 4; i++) {
      tiles.push({ id: id++, suit: "wind", value: v, red: false });
    }
  });

  // 三元牌（白=1, 發=2, 中=3）
  const dragons = [1, 2, 3];
  dragons.forEach(v => {
    for (let i = 0; i < 4; i++) {
      tiles.push({ id: id++, suit: "dragon", value: v, red: false });
    }
  });

  return tiles;
}



// 牌画像をidに変換
export function tileToId(tile) {
  if (tile.suit === "man") {
    return `m${tile.value}`;
  }

  if (tile.suit === "pin") {
    if (tile.red && tile.value === 5) return "p5r";
    return `p${tile.value}`;
  }

  if (tile.suit === "sou") {
    if (tile.red && tile.value === 5) return "s5r";
    return `s${tile.value}`;
  }

  if (tile.suit === "wind") {
    return `w${tile.value}`;   // 東=1, 南=2, 西=3, 北=4
  }

  if (tile.suit === "dragon") {
    return `d${tile.value}`;   // 白=1, 發=2, 中=3
  }
}



// 牌の画像パスを返す
export function tileToImage(tile) {
  return `img/${tileToId(tile)}.png`;
}


export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}