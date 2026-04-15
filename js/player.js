export class Player {
  constructor(id, isCPU = false) {
    this.id = id;
    this.isCPU = isCPU;
    this.hand = [];
    this.discards = [];
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
