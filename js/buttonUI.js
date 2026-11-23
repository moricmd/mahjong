// buttonUI.js

const BUTTON_DATA = {
    riichi: { label: "立直", className: "btn-riichi" },
    cancel: { label: "キャンセル", className: "btn-cancel" },
    tsumo:  { label: "ツモ", className: "btn-tsumo" },
    ron:    { label: "ロン", className: "btn-ron" },
    pon:    { label: "ポン", className: "btn-pon" },
    kan:    { label: "カン", className: "btn-kan" },
    north:  { label: "北抜き", className: "btn-north" },
    skip:   { label: "スキップ", className: "btn-skip" } 
};

// ----------
// ボタン作成
// ----------
export function createActionButton(type, handler){

    const data = BUTTON_DATA[type];
    const btn = document.createElement("button");

    btn.className = "action-btn";
    btn.textContent = data.label;
    btn.classList.add(data.className);
    btn.onclick = handler;

    return btn;

}

/**
 * アクションボタンを描画する
 * @param { string[] } actions - 表示するボタンの種類の配列
 * @param { Function } handler - ボタン押下時に呼ばれる処理
 */

export function renderActionButtons(actions, handler){

    const container = document.getElementById("action-buttons");
    
    container.innerHTML = "";
    
    const isCancelOnly = (actions.length === 1 && actions[0] === "cancel");
    const allItems = isCancelOnly ? ["cancel"] : [...actions, "skip"];

    const slots = new Array(6).fill(null);

    // 
    // アクションボタンの描画領域は次のようになる:
    //
    // [0][1][2]
    // [3][4][5]
    //
    //  ・アクションボタンは下段から埋め、左から詰める（上段も同様）
    //  ・インデックス5は常に"スキップ"ボタンである
    //
    //
    const orderMap = {
        1: [5],
        2: [4, 5],
        3: [3, 4, 5],
        4: [3, 4, 0, 5],
        5: [3, 4, 0, 1, 5],
        6: [3, 4, 0, 1, 2, 5]
    };

    const orderIndex = orderMap[allItems.length] ?? [3, 4, 0, 1, 2, 5];

    allItems.forEach((type, i) => {

        if(orderIndex[i] !== undefined){
            slots[orderIndex[i]] = type; 
        }
    });

    slots.forEach((type, index) => {

        if(!type) return;

        const btn = createActionButton(type, () => {
            if(type === "skip"){
                container.innerHTML = "";
            }
            handler?.(type);
        });

        container.appendChild(btn);    
    });
}

/*
  // 立直・副露ボタン
  // ===========================================================================
export function updateActionButtons() {
  const container = document.getElementById("action-buttons");
  container.innerHTML = "";

  const p = this.players[0];

  // -------------------------
  // ① ボタンを表示する状況か？
  // -------------------------

  // ロン待ち
  const isCheckRon = (this.state === "CheckRon");

  // ポン・カン待ち
  const isWaitCall = (this.state === "WaitCall");

  // 自分のツモ番（CheckTsumo → Discard）
  const isMyTurn =
    (this.turn === 0) &&
    (this.state === "CheckTsumo" || this.state === "Discard");

  if (!isCheckRon && !isWaitCall && !isMyTurn) {
    return; // 何も表示しない
  }

  // -------------------------
  // ② ボタン候補を作る（優先順）
  // -------------------------
  let list = [];

  if(p.isWaitingRiichi){
    // 立直待ち中はキャンセルボタンしか表示させない
    list.push({
      name: "キャンセル",
      handler: () => {
        console.log("%c[ClickedButton: updateActionButtons] キャンセルボタンが押された", "color: #7a0808;");
        onCancelRiichi(this, 0);
      }
    });

  } else if (isMyTurn) {
    // 立直（門前時のみ）
    if (p.isMenzen && canRiichi(this, 0)) {
      list.push({ 
        name: "立直",
        handler: () => {
          console.log("%c[ClickedButton: updateActionButtons] 立直ボタンが押された", "color: #7a0808;");
          onRiichi(this, 0);
        }
      });
    }


    // ツモ和了
    if (p.canCallTsumo){
      list.push({
        name: "ツモ",
        handler: () => {
          console.log("%c[ClickedButton: updateActionButtons] ツモボタンが押された", "color: #7a0808;");          
          container.innerHTML = "";
          this.tsumoPayment(p.tsumoResult);  // 点数授受処理を呼ぶ
        }
      });
    }



    // 暗槓（自分のツモ番のみ）
    if (canAnkan(this)) {
      list.push({ name: "カン", handler: () => onAnkan(this) });
    }

    // 北抜き
    if (canNorth(this)) {
      list.push({
        name: "北抜き",
        handler: () => {
          console.log("%c[ClickedButton: updateActionButtons] 北抜きボタンが押された", "color: #7a0808;");
          onNorth(this, 0);
        }
      });
    }

  } else if(isCheckRon){
    // ロン
    if (p.canCallRon && !p.isFuriten){
      list.push({
        name: "ロン",
        handler: () => {
          console.log("%c[ClickedButton: updateActionButtons] ロンボタンが押された", "color: #7a0808;");
          container.innerHTML = "";
          this.ronPayment(this.pendingRonResult);
        }
      });
    }
  } else if (isWaitCall) {
    // ポン・大明槓
    if (canPon(this)) {
      list.push({ name: "ポン", handler: () => onPon(this, 0) });
    }
    if (canDaiminkan(this)) {
      list.push({ name: "カン", handler: () => onKan(this) });
    }
  }

  // -------------------------
  // ③ レイアウト
  // -------------------------
  if (list.length === 0) return;

  const slots = new Array(6).fill(null);
  
  const skip = { 
    name: "スキップ",
    handler: () => {
      console.log("%c[ClickedButton: updateActionButtons] スキップボタンが押された", "color: #7a0808;");
      container.innerHTML = "";

      const p = this.players[this.turn];

      // 自分のツモ番でスキップしたら打牌へ
      if(this.state === "Discard"){
        console.log("%c[updateActionButtons] スキップしたため打牌へ移行", "color: #4b88c2;");
        this.state = "Discard";
        this.scheduleStep(0);
        return;
      }

      const p0 = this.players[0];

      // 1. ロン可能なのにスキップしたなら同巡フリテンになる
      if (p0.canCallRon) {
        p0.canCallRon = false;
        missedRonFuriten(this, 0);
      }

      // 2. 保持していた ronResult から、自分（0番）を除外した「CPUだけの勝者リスト」を作る
      if (this.pendingRonResult && this.pendingRonResult.isRonWin) {
        const cpuWinners = this.pendingRonResult.winners.filter(w => w.winnerIndex !== 0);

        if (cpuWinners.length > 0) {
          // 自分はスキップしたけど、CPUがロンできるならCPUにロンさせる！
          console.log("%c[Skip] 自分はスキップしましたが、CPUのロン和了を実行します", "color: #4b88c2;");
          const cpuRonResult = {
            ...this.pendingRonResult,
            winners: cpuWinners
          };
          this.pendingRonResult = null;
          this.ronPayment(cpuRonResult);
          return;
        }
      }

      // 3. CPUのロンも誰もいないなら、通常の進行（次のポン・カン・ツモなどのステートへ）に戻る
      this.pendingRonResult = null;
      this.state = "WaitCall"; 
      this.updateUI();
      this.scheduleStep(0);
    }
  };
  
  //
  //  slots = [0] [1] [2]
  //          [3] [4] [5]
  //
  //  ・スキップボタンは必ず5に置く
  //
  //  ・下段から使い、優先度の高いボタンから詰めていく:
  //
  //  　  立直 → ツモ / ロン → ポン → カン → 北抜き　の順
  //
  //  　  優先度の高いものほど左に並ぶ
  //

  const allItems = p.isWaitingRiichi
    ? [...list]         // 立直待ちならキャンセルのみ（listにキャンセルしか入っていない）
    : [...list, skip];  // 各action-btnとスキップボタン

  const total = allItems.length;

  let orderIndex = [];

  if(total == 1){
    // キャンセルボタン
    orderIndex = [5];
  } else if(total === 2){
    orderIndex = [4, 5];
  } else if(total === 3){
    orderIndex = [3, 4, 5];
  } else if(total === 4){
    orderIndex = [3, 4, 0, 5];
  } else if(total === 5){
    orderIndex = [3, 4, 0, 1, 5];
  } else {
    orderIndex = [3, 4, 0, 1, 2, 5];
  }

  for(let i = 0; i < allItems.length; i++){
    if(orderIndex[i] !== undefined){
      slots[orderIndex[i]] = allItems[i];
      console.log(`${allItems[i].name}: ${orderIndex[i]}`);
    }
  }

  console.log(`%c[updateActionButton] 生成するボタン: ${slots.map(s => s ? s.name : "empty")}`, "color: #4b88c2;");
    // -------------------------
  // ④ DOM に追加（null は描画しない）
  // -------------------------
  slots.forEach((item, index) => {
    if (!item) return;
    const btn = this.createActionButton(item.name, item.handler);

    const row = Math.floor(index / 3) + 1;
    const col = (index % 3) + 1;
    
    btn.style.gridRow = row;
    btn.style.gridColumn = col;

    container.appendChild(btn);
  });
}





export function createActionButton(label, handler) {

    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.textContent = label;
    btn.onclick = handler;

    switch(label){

      case "立直":
        btn.classList.add("btn-riichi");
        break;

      case "キャンセル":
        btn.classList.add("btn-cancel");
        break;

      case "ツモ":
        btn.classList.add("btn-tsumo");
        break;

      case "ロン":
        btn.classList.add("btn-ron");
        break;

      case "ポン":
        btn.classList.add("btn-pon");
        break;

      case "カン":
        btn.classList.add("btn-kan");
        break;

      case "北抜き":
        btn.classList.add("btn-north");
        break;

      case "スキップ":
        btn.classList.add("btn-skip");
        break;

    }

    return btn;
}


*/
