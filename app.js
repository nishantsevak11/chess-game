const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chess = new Chess();
let players = { white: null, black: null };

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
});

io.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    // Assign roles to players
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("playerRole", "spectator");
    }

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("A user disconnected: ", socket.id);
        if (socket.id === players.white) {
            players.white = null;
        } else if (socket.id === players.black) {
            players.black = null;
        }
    });

    // Handle move event
    socket.on("move", (move) => {
        try {
            // Ensure only the correct player moves
            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                socket.emit("invalidMove");
            }
        } catch (error) {
            socket.emit("invalidMove");
        }
    });

    // Send the initial board state
    socket.emit("boardState", chess.fen());
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}...`);
});
