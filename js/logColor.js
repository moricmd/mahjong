// logColor.js

// クライアント側コードでののログ表示色
export const COLOR_CODE = {
    Reject: "#e44848",
    TurnLog: "#4b88c2",
    Step: "#4caf50",
    Timer: "#f07b0e",
    WaitUser: "#ff4794",
    GameLog: "#9453df",
    ClickedButton: "#7a0808"
};

// サーバー側コードでのログ表示色
export const TERMINAL_COLOR = {
    Reset: "\x1b[0m",
    Reject: "\x1b[38;2;228;72;72m",       // #e44848
    TurnLog: "\x1b[38;2;75;136;194m",     // #4b88c2
    Step: "\x1b[38;2;76;175;80m",         // #4caf50
    Timer: "\x1b[38;2;240;123;14m",       // #f07b0e
    WaitUser: "\x1b[38;2;255;71;148m",    // #ff4794
    GameLog: "\x1b[38;2;148;83;223m",     // #9453df
    ClickedButton: "\x1b[38;2;122;8;8m",  // #7a0808
};