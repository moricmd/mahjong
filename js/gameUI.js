// gameUI.js

// ----------
// 基準座標の取得関数
// ----------
function getTableMetrics(){

    const table = document.getElementById("table");
    const yama = document.getElementById("table-info");

    if(!table || !yama) return null;

    const tableWidth = table.clientWidth;
    const tableHeight = table.clientHeight;

    const yamaWidth = yama.offsetWidth;
    const yamaHeight = yama.offsetHeight;

    return {
        cx: tableWidth / 2,
        cy: tableHeight / 2,
        yamaWidth: yamaWidth,
        yamaHeight: yamaHeight
    };

}


// ----------
// 手牌の位置更新関数
// ----------
function updateHandPositions(players){

    const metrics = getTableMetrics();

    if(!metrics) return null;

    const { cx, cy, yamaWidth } = metrics;
    const offset = yamaWidth * 1.4;
    let player0Pos = null;

    players.forEach((player, index) => {

        const selector = index === 0 ? "#player-wrapper" : `#cpu${index}-wrapper`;
        const el = document.querySelector(selector);
        if(!el) return;

        let x = cx;
        let y = cy;
        let rotate = 0;

        switch(player.position){

            case "bottom":
                y = cy + offset;
                rotate = 0;
                break;

            case "top":
                y = cy - offset;
                rotate = 180;
                break;

            case "right":
                x = cx + offset;
                y = cy - 14;
                rotate = -90;
                break;

            case "left":
                x = cx - offset;
                y = cy + 14;
                rotate = 90;
                break;

            // leftとrightでは、wrapperが14枚の大きさである関係上牌をツモっていないときに
            // 上下に牌の位置が1枚分ずれるため、牌の横幅の半分（14px）ずつずらすことで位置を揃えている

            el.style.position = "absolute";
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;

            if(index === 0){
                player0Pos = { x, y };
            }
        }
    });

    return player0Pos;
}


// ----------
// 捨て牌の位置更新関数
// ----------
function updateDiscardPostions(players){

    const metrics = getTableMetrics();
    if(!metrics) return;

    const { cx, cy, yamaWidth } = metrics;
    const offset = yamaWidth * 0.8;

    players.forEach((player, index) => {

        const selector = `#discard-${index}`;
        const el = document.querySelector(selector);
        if(!el) return;

        let x = cx;
        let y = cy;
        let rotate = 0;

        switch(player.position){

            case "bottom":
                y = cy + offset;
                rotate = 0;
                break;

            case "top":
                y = cy - offset;
                rotate = 180;
                break;

            case "right":
                x = cx + offset;
                rotate = -90;
                break;

            case "left":
                x = cx - offset;
                rotate = 90;
                break;
        }

        el.style.position = "absolute";
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;
    });
}


// ----------
// フリテン表示枠の位置更新関数
// ----------
function updateFuritenPostion(player0Pos){

    //
    //  top   :  手牌と同じ高さ
    //  left  :  枠が手牌から20px離れる位置
    //

    const el = document.getElementById("furiten-indicator");
    const handWrapper = document.getElementById("player-wrapper");
    if(!el || !handWrapper || !player0Pos) return;

    const halfHandWidth = (40 * 14) / 2;  // 手牌の半分の幅
    const badgeWidth = el.style.width;    // フリテン表示枠のwidth
    const gap = 20;                       // 手牌（player-wrapper）との間隔

    // 手牌の左端のx座標（手牌の中心のx座標 - 手牌の半分の長さ）
    const handLeftX = player0Pos.x - handHalfWidth;

    // フリテン表示枠の中心のx座標（手牌の左端のx座標 - 間隔 - 表示枠の半分の長さ）
    const leftX = handLeftX - gap - (badgeWidth / 2);

    el.style.postion = "absolute";
    el.style.left = `${leftX}px`;
    el.style.top = `${player0Pos.y}px`;
    el.style.transform = "translate(-50%, -50%)";

}


// ----------
// action-btnの位置更新関数
// ----------
function updateActionButtonsPosition(player0Pos){

    const el = document.getElementById("action-buttons");
    if(!el || !player0Pos) return;

    const halfHandWidth = (40 * 14) / 2;   // 手牌全体の半分の幅
    const tileHeight = 60;                 // 牌のheight
    const actionWidth = el.style.width;    // ボタン表示領域のwidth 
    const actionHeight = el.style.height;  // ボタン表示領域のheight
    const gap = 20;                        // 手牌との間隔

    // 手牌の右端のx座標（手牌の中心のx座標 + 手牌の半分の長さ）
    const handRigthX = player0Pos.x + halfHandWidth;

    // ボタン表示領域の中心のx座標（手牌の右端のx座標 - ボタン表示領域のwidthの半分の長さ）
    const leftX = handRigthX - (actionWidth / 2);


    // 手牌の上端のy座標（手牌の中心のy座標 - 牌のheightの半分の長さ）
    const handTopY = player0Pos.y - (tileHeight / 2);

    // ボタン表示領域の中心のy座標（手牌の上端のy座標 - 間隔 - ボタン表示領域のheightの半分の長さ）
    const topY = handTopY - gap - (actionHeight / 2);

    el.style.position = "absolute";
    el.style.left = `${leftX}px`;
    el.style.top = `${topY}px`;
    el.style.transform = "translate(-50%, -50%)"; // 縦横ともに中心を合わせる

}

export function updateGameLayout(players){
    const player0Pos = updateHandPositions(players);
    updateDiscardPostions(players);

    if(player0Pos){
        updateFuritenPostion(player0Pos);
        updateActionButtonsPosition(player0Pos);
    }
}