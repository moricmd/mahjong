export class Player {
  constructor(id, isCPU = false) {
    this.id = id;
    this.isCPU = isCPU;
    this.hand = [];
    this.river = [];
  }

  draw(tile) {
    if (!tile) return;

    this.hand.push(tile);
  }

  discard(index) {
    const [t] = this.hand.splice(index, 1);
    if (t) this.river.push(t);
    return t;
  }
}
