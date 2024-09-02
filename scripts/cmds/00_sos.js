const axios = require('axios');

const BOARD_SIZE = 5;
const EMPTY_CELL = ' ';
const PLAYER_X = '🆂';
const PLAYER_O = '🇴';

let boards = new Map();

function createEmptyBoard() {
  return Array.from(Array(BOARD_SIZE), () => Array(BOARD_SIZE).fill(EMPTY_CELL));
}

function printBoard(board) {
  return board.map(row => row.map(cell => cell === EMPTY_CELL ? '⬜' : cell).join(' | ')).join('\n━━━━━━━━━━\n') + '\n';
}

function checkWin(board, player) {
  let sosCount = 0;

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === PLAYER_X) {
        if (j + 2 < BOARD_SIZE && board[i][j + 1] === PLAYER_O && board[i][j + 2] === PLAYER_X) sosCount++;
        if (i + 2 < BOARD_SIZE && board[i + 1][j] === PLAYER_O && board[i + 2][j] === PLAYER_X) sosCount++;
        if (i + 2 < BOARD_SIZE && j + 2 < BOARD_SIZE && board[i + 1][j + 1] === PLAYER_O && board[i + 2][j + 2] === PLAYER_X) sosCount++;
        if (i + 2 < BOARD_SIZE && j - 2 >= 0 && board[i + 1][j - 1] === PLAYER_O && board[i + 2][j - 2] === PLAYER_X) sosCount++;
      }
    }
  }

  return sosCount;
}

module.exports = {
  config: {
    name: "sos",
    version: "1.0.9",
    author: "Dymyrius", //	Ace Gerome Use Switch Mode, Change from else if function
    countDown: 10,
    role: 0,
    description: {
        en: "Play S-O-S game with another player!"
    }, 
    category: "game", 
    guide: {
      en: "{pn}"
    } 
  },

  onStart: async function({ message, args, usersData, event }) {
    const sosImage = (await axios.get("https://i.imgur.com/AdT0qyK.png", { responseType: "stream" })).data;
    const board = boards.get(event.threadID) || createEmptyBoard();

    switch (args[0]) {
      case "create":
      case "c":
        if (boards.has(event.threadID)) {
          return message.reply("[🎮] » A game is already in progress.");
        }

        const betAmount = parseInt(args[1]);
        if (isNaN(betAmount) || betAmount < 500) {
          return message.reply("[🎮] » Enter a valid bet amount (minimum ₱500).");
        }

        const userMoney = await usersData.getMoney(event.senderID);
        if (userMoney < betAmount) {
          return message.reply(`[🎮] » Insufficient funds for a bet of ₱${betAmount}.`);
        }

        boards.set(event.threadID, {
          board,
          players: [event.senderID],
          host: event.senderID,
          currentPlayer: event.senderID,
          betAmount,
          started: false,
        });

        return message.reply(`[🎮] » Game created with a bet of ₱${betAmount}. Use "/sos join" to participate.`);

      case "join":
      case "j":
        if (!boards.has(event.threadID)) {
          return message.reply('[🎮] » No ongoing game. Use "/sos create" to start one.');
        }

        const room = boards.get(event.threadID);
        if (room.started) {
          return message.reply("[🎮] » The game has already started.");
        }

        if (room.players.length >= 2) {
          return message.reply("[🎮] » The game is full.");
        }

        if (room.players.includes(event.senderID)) {
          return message.reply("[🎮] » You have already joined.");
        }

        if ((await usersData.getMoney(event.senderID)) < room.betAmount) {
          return message.reply(`[🎮] » Insufficient funds to join. You need ₱${room.betAmount}.`);
        }

        room.players.push(event.senderID);
        boards.set(event.threadID, room);

        return message.reply(`[🎮] » You have joined the game.`);

      case "start":
      case "s":
        if (!boards.has(event.threadID)) {
          return message.reply('[🎮] » No ongoing game. Use "/sos create" to start one.');
        }

        const startRoom = boards.get(event.threadID);
        if (startRoom.host !== event.senderID) {
          return message.reply("[🎮] » Only the host can start the game.");
        }

        if (startRoom.players.length !== 2) {
          return message.reply("[🎮] » Two players are required to start.");
        }

        if (startRoom.started) {
          return message.reply("[🎮] » The game has already started.");
        }

        startRoom.currentPlayer = startRoom.players[Math.floor(Math.random() * 2)];
        startRoom.started = true;

        boards.set(event.threadID, startRoom);
        const firstPlayerName = (await usersData.get(startRoom.currentPlayer))?.name || startRoom.currentPlayer;

        return message.reply(`[🎮] » Game started! ${firstPlayerName} goes first.`);

      case "move":
      case "m":
        if (!boards.has(event.threadID)) {
          return message.reply('[🎮] » No ongoing game. Use "create" to start one.');
        }

        const moveRoom = boards.get(event.threadID);
        if (!moveRoom.started) {
          return message.reply("[🎮] » The game has not started.");
        }

        if (!moveRoom.players.includes(event.senderID)) {
          return message.reply('[🎮] » You are not part of the game. Use "/sos join" to join.');
        }

        if (event.senderID !== moveRoom.currentPlayer) {
          return message.reply("[🎮] » It's not your turn.");
        }

        const currentPlayerSymbol = moveRoom.players[0] === event.senderID ? PLAYER_X : PLAYER_O;
        const row = parseInt(args[1]) - 1;
        const col = parseInt(args[2]) - 1;

        if (isNaN(row) || isNaN(col) || row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
          return message.reply("[🎮] » Invalid move. Enter valid row and column numbers.");
        }

        if (moveRoom.board[row][col] !== EMPTY_CELL) {
          return message.reply("[🎮] » Cell already occupied.");
        }

        moveRoom.board[row][col] = currentPlayerSymbol;
        const currentBoard = printBoard(moveRoom.board);
        message.reply(currentBoard, event.threadID);

        const sosFormations = checkWin(moveRoom.board, currentPlayerSymbol);
        if (sosFormations > 0) {
          const winnings = moveRoom.betAmount * sosFormations;
          const playerName = (await usersData.get(event.senderID))?.name || event.senderID;
          
          message.reply(`[🎮 🏆] » ${playerName} won with ${sosFormations} SOS formations and received ₱${winnings}!`);
          
          await usersData.addMoney(event.senderID, winnings);
          const opponentID = moveRoom.players.find(player => player !== event.senderID);
          await usersData.subtractMoney(opponentID, moveRoom.betAmount);
          
          boards.delete(event.threadID);
        } else if (moveRoom.board.flat().every(cell => cell !== EMPTY_CELL)) {
          message.reply("[🎮 🤝] » The game ended in a draw!");
          boards.delete(event.threadID);
        } else {
          moveRoom.currentPlayer = moveRoom.players.find(player => player !== moveRoom.currentPlayer);
          boards.set(event.threadID, moveRoom);
        }

        return;

      case "end":
      case "e":
        if (!boards.has(event.threadID)) {
          return message.reply("[🎮] » No ongoing game.");
        }

        const endRoom = boards.get(event.threadID);
        if (endRoom.host !== event.senderID) {
          return message.reply("[🎮] » Only the host can end the game.");
        }

        message.reply("[🎮] » Game ended by host.");
        boards.delete(event.threadID);
        return;

      default:
        message.reply({
          body: "»〘 𝐒 - 𝐎 - 𝐒 〙«\n1. /sos create <bet amount> => Create a new game with a bet.\n2. /sos join => Join an ongoing game.\n3. /sos start => Start the game (host only).\n4. /sos move / m <row> <column> => Make a move.\n5. /sos end => End the game (host only).",
          attachment: sosImage,
        });
    }
  }
};
