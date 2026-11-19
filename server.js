const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let waitingPlayers = [];
let currentGame = null;


function shufflePlayer(array){
    for(let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

io.on("connection", (socket) => {
    console.log(`ユーザーが接続: ${socket.id}`);

    waitingPlayers.push(socket);
    const playerIndex = waitingPlayers.length - 1;
    socket.emit("assignIndex", playerIndex);

    if(waitingPlayers.length === 3){
        console.log("ゲーム開始");

        shufflePlayer(waitingPlayers);

        waitingPlayers.forEach((socket, index) => {
            socket.emit("assignIndex", index);
                console.log(`Socket ID: ${socket.id} -> 割り当てインデックス: ${index}`);  
        });

        // Gameインスタンス初期化
    }

    socket.on("disconnect", () => {
        console.log(`ユーザーが通信を切断した: ${socket.id}`);
        waitingPlayers = waitingPlayers.filter(s => s !== socket);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`サーバーが起動: http://localhost:${PORT}`);
});