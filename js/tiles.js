// 三麻（雀魂）牌生成
export function generateTiles() {
  const tiles = [];
  let id = 0;

  // 萬子 1,9 のみ
  [1, 9].forEach(v => {
    for (let i = 0; i < 4; i++) tiles.push({ id: id++, suit: "man", value: v, red: false });
  });

  // 筒子 1〜9 + 赤5p
  for (let v = 1; v <= 9; v++) {
    for (let i = 0; i < 4; i++) tiles.push({ id: id++, suit: "pin", value: v, red: false });
  }
  tiles.push({ id: id++, suit: "pin", value: 5, red: true });

  // 索子 1～9 + 赤5s
  for (let v = 1; v <= 9; v++) {
    for (let i = 0; i < 4; i++) tiles.push({ id: id++, suit: "sou", value: v, red: false });
  }
  tiles.push({ id: id++, suit: "sou", value: 5, red: true });

  // 風牌（東・南・西・北）
  winds.forEach(v => {
    for (let i = 0; i < 4; i++) tiles.push({ id: id++, suit: "wind", value: v, red: false });
  });

  // 三元牌（白・發・中）
  const dragons = [1, 2, 3, 4];
  dragons.forEach(v => {
    for (let i = 0; i < 4; i++) tiles.push({ id: id++, suit: "dragon", value: v, red: false });
  });

  return tiles;
}

export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
