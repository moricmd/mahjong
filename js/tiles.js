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
