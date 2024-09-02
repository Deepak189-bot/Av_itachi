const axios = require('axios');

const boards = new Map(); 

const BOARD_SIZE = 3;
const EMPTY_CELL = ' ';
const PLAYER_X = '❌';
const PLAYER_O = '⭕';

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY_CELL));
}

function printBoard(board) {
  return board.map((row, i) => 
    row.map(cell => cell === EMPTY_CELL ? '⬜' : cell).join(' | ')
  ).join('\n━━━━━━\n') + '\n';
}

function checkWin(board, player) {
  // Check rows and columns
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (board[i].every(cell => cell === player) ||
        board.every(row => row[i] === player)) {
      return true;
    }
  }

  // Check diagonals
  return (board[0][0] === player && board[1][1] === player && board[2][2] === player) ||
         (board[0][2] === player && board[1][1] === player && board[2][0] === player);
}

module.exports = {
  config: {
    name: "tictactoev2",
    aliases: ["tttv2", "t"], 
    version: "1.0.9",
    author: "Gauxy (fixed by Dymyrius/AceGerome)",
    countDown: 10,
    role: 0,
    description: {
      en: "Play a Tic-Tac-Toe game with another player!"
    }, 
    category: "game", 
    guide: {
      en: "{pn}"
    } 
  },

  onStart: async function({ message, args, usersData, event }) {
    let tictac;
    try {
      tictac = (await axios.get("https://i.imgur.com/rcJsD9X.png", { responseType: "stream" })).data;
    } catch (error) {
      return message.reply("[🎮] » Failed to load game image.");
    }

    const board = boards.get(event.threadID) || createEmptyBoard();

    switch (args[0]) {
      case "create":
        if (boards.has(event.threadID)) {
          return message.reply("[🎮] » A game is already in progress in this group.");
        }

        const betAmount = parseInt(args[1]);
        if (isNaN(betAmount) || betAmount < 500) {
          return message.reply("[🎮] » You need to enter a valid bet amount (minimum 500$).");
        }

        const userMoney = await usersData.getMoney(event.senderID);
        if (userMoney < betAmount) {
          return message.reply(`[🎮] » You don't have enough money to create a game with a bet of ${betAmount}$.`);
        }

        boards.set(event.threadID, {
          board,
          players: [event.senderID],
          host: event.senderID,
          currentPlayer: event.senderID,
          betAmount,
          started: false,
        });

        return message.reply(`[🎮] » A Tic-Tac-Toe game with a bet of ${betAmount}$ has been created. Use /t join to join the game.`);

      case "join":
        if (!boards.has(event.threadID)) {
          return message.reply("[🎮] » There is no ongoing Tic-Tac-Toe game in this group. Use /t create to start one.");
        }

        const room = boards.get(event.threadID);
        if (room.started || room.players.length >= 2) {
          return message.reply("[🎮] » The game has already started or is full.");
        }

        if (room.players.includes(event.senderID)) {
          return message.reply("[🎮] » You have already joined the game.");
        }

        const userMoneyJoin = await usersData.getMoney(event.senderID);
        if (userMoneyJoin < room.betAmount) {
          return message.reply(`[🎮] » You don't have enough money to join the game. You need ${room.betAmount}$ to join.`);
        }

        room.players.push(event.senderID);
        boards.set(event.threadID, room);

        const playerInfo = await usersData.get(event.senderID);
        const playerName = playerInfo?.name || event.senderID;

        return message.reply(`[🎮] » ${playerName} has joined the Tic-Tac-Toe game.`);

      case "start":
        if (!boards.has(event.threadID)) {
          return message.reply("[🎮] » There is no ongoing Tic-Tac-Toe game in this group. Use /t create to start one.");
        }

        const startRoom = boards.get(event.threadID);
        if (startRoom.host !== event.senderID || startRoom.players.length !== 2) {
          return message.reply("[🎮] » Only the host can start the game and it requires two players.");
        }

        if (startRoom.started) {
          return message.reply("[🎮] » The game has already started.");
        }

        startRoom.currentPlayer = startRoom.players[Math.floor(Math.random() * 2)];
        startRoom.started = true;

        boards.set(event.threadID, startRoom);
        const firstPlayerInfo = await usersData.get(startRoom.currentPlayer);
        const firstPlayerName = firstPlayerInfo?.name || startRoom.currentPlayer;

        return message.reply(`[🎮] » The Tic-Tac-Toe game has started! ${firstPlayerName} will make the first move.`);

      case "play":
        if (!boards.has(event.threadID)) {
          return message.reply("[🎮] » There is no ongoing Tic-Tac-Toe game in this group. Use /t create to start one.");
        }

        const playRoom = boards.get(event.threadID);
        if (!playRoom.started || !playRoom.players.includes(event.senderID)) {
          return message.reply("[🎮] » The game has not started yet or you are not part of the game.");
        }

        if (event.senderID !== playRoom.currentPlayer) {
          return message.reply("[🎮] » It's not your turn to play.");
        }

        const currentPlayerSymbol = event.senderID === playRoom.players[0] ? PLAYER_X : PLAYER_O;
        const row = parseInt(args[1]) - 1;
        const col = parseInt(args[2]) - 1;

        if (isNaN(row) || isNaN(col) || row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
          return message.reply("[🎮] » Invalid move. Please enter a valid row and column number.");
        }

        if (playRoom.board[row][col] !== EMPTY_CELL) {
          return message.reply("[🎮] » The cell is already occupied. Choose an empty cell.");
        }

        playRoom.board[row][col] = currentPlayerSymbol;
        const currentBoard = printBoard(playRoom.board);
        message.reply(currentBoard);

        if (checkWin(playRoom.board, currentPlayerSymbol)) {
          const playerInfo = await usersData.get(event.senderID);
          const playerName = playerInfo?.name || event.senderID;

          const winnings = playRoom.betAmount * 2; // Winnings based on the bet amount

          message.reply(`[🎮 🏆] » ${playerName} has won the Tic-Tac-Toe game and received ${winnings}$.`);

          await usersData.addMoney(event.senderID, winnings);

          const opponentID = playRoom.players.find(playerID => playerID !== event.senderID);
          await usersData.subtractMoney(opponentID, playRoom.betAmount);

          boards.delete(event.threadID);

        } else if (playRoom.board.every(row => row.every(cell => cell !== EMPTY_CELL))) {
          message.reply("[🎮 🤝] » The game ended in a draw!");
          boards.delete(event.threadID);

        } else {
          playRoom.currentPlayer = playRoom.players[(playRoom.players.indexOf(event.senderID) + 1) % 2];
          boards.set(event.threadID, playRoom);
        }

        return;

      case "end":
        if (!boards.has(event.threadID)) {
          return message.reply("[🎮] » There is no ongoing Tic-Tac-Toe game in this group.");
        }

        const endRoom = boards.get(event.threadID);
        if (endRoom.host !== event.senderID) {
          return message.reply("[🎮] » Only the host can end the game.");
        }

        message.reply("[🎮] » The game has been ended by the host.");
        boards.delete(event.threadID);
        return;

      default:
        return message.reply({
          body: "»〘 𝐓𝐈𝐂-𝐓𝐀𝐂-𝐓𝐎𝐄 〙«\n1. *t create <bet amount> => Create a new Tic-Tac-Toe game with a bet.\n2. *t join => Join an ongoing Tic-Tac-Toe game.\n3. *t start => Start the game (only the host can start).\n4. *t play <row> <column> => Make a move in the game.\n5. *t end => End the game (only the host can end).\nNote: The game can only be started by the host.",
          attachment: tictac,
        });
    }
  }
};
