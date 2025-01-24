const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const notificationElement = document.getElementById("notification");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Receive the player role
socket.on("playerRole", (role) => {
    playerRole = role;
    const roleText = role === "w" ? "White" : role === "b" ? "Black" : "Spectator";
    document.getElementById("player-role").textContent = `Role: ${roleText}`;
    console.log("You are playing as:", roleText);
});

// Render the board
const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = ""; // Clear the board

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + colIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            // Add pieces to the board
            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.textContent = getPieceUnicode(square.type, square.color);
                pieceElement.draggable = square.color === (playerRole === "w" ? "w" : "b"); // Only allow dragging for the player's pieces
                pieceElement.addEventListener("dragstart", () => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: colIndex };
                    }
                });
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => e.preventDefault());
            squareElement.addEventListener("drop", () => handleMove(rowIndex, colIndex));

            boardElement.appendChild(squareElement);
        });
    });
};

// Handle the piece move
const handleMove = (targetRow, targetCol) => {
    if (!draggedPiece || !sourceSquare) return;

    const source = {
        from: `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`,
        to: `${String.fromCharCode(97 + targetCol)}${8 - targetRow}`,
    };

    socket.emit("move", source);
    draggedPiece = null;
    sourceSquare = null;
};

// Receive board state from the server
socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
    const turn = chess.turn() === "w" ? "White" : "Black";
    document.getElementById("turn-info").textContent = `Turn: ${turn}`;
});

// Display invalid move message
socket.on("invalidMove", () => {
    showNotification("Invalid move. Please try again!");
});

// Get Unicode for chess pieces
const getPieceUnicode = (type, color) => {
    const pieces = {
        p: "♟",
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
    };
    return color === "w" ? pieces[type].toUpperCase() : pieces[type];
};

// Show notification
const showNotification = (message) => {
    notificationElement.textContent = message;
    notificationElement.classList.remove("hidden");
    setTimeout(() => notificationElement.classList.add("hidden"), 3000);
};

// Initial board render
renderBoard();
