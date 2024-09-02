const axios = require('axios');

let chanle = new Map();

module.exports = {
  config: {
    name: "colorgame",
    version: "1.0.9",
    author: "Dymyrius",
    countDown: 15,
    role: 0,
    description: {
      en: "Play color-color game with betting!"
    }, 
    category: "game", 
    guide: {
      en: "{pn} [red/🔴] | [blue/🔵] | [yellow/🟡] [bet]"
    } 
  },

  onStart: async function({ message, args, usersData, event, api }) {
    try {
      const { senderID, threadID } = event;
      const colors = [
        { emoji: '🔴', word: 'red' },
        { emoji: '🔵', word: 'blue' },
        { emoji: '🟡', word: 'yellow' }
      ];
      const chosenColor = args[0]?.toLowerCase();
      const betAmount = parseInt(args[1]);

      if (!chosenColor || isNaN(betAmount) || betAmount < 500) {
        return message.reply("[COLORGAME ⚠] » Invalid command usage! Please use it like this:\n➜ /colorgame <chosen color> <bet amount> and the bet amount should be at least ₱500.");
      }

      const chosenColorData = colors.find(color => color.emoji === chosenColor || color.word === chosenColor);

      if (!chosenColorData) {
        return message.reply("[COLORGAME ⚠] » Invalid color! Please choose either 🔴 (red), 🔵 (blue), or 🟡 (yellow).");
      }

      const userMoney = await usersData.getMoney(senderID);

      if (userMoney < betAmount) {
        return message.reply(`[COLORGAME ⚠] » You don't have enough money to place a bet of ₱${betAmount}!\nYour Balance: ${userMoney}`);
      }

      const { name } = await usersData.get(senderID);

      // Retrieve or initialize game data
      const gameData = chanle.get(threadID) || {
        box: threadID,
        start: false,
        players: [],
        results: []
      };

      if (gameData.players.find(player => player.userID === senderID)) {
        return message.reply("[COLORGAME ⚠] » You have already placed your bet for this game!");
      }

      gameData.players.push({
        name: name,
        userID: senderID,
        color: chosenColorData,
        betAmount: betAmount
      });

      chanle.set(threadID, gameData);

      if (!gameData.start) {
        gameData.start = true;
        chanle.set(threadID, gameData);

        setTimeout(async () => {
          try {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const roll = (await axios.get("https://i.imgur.com/cktTbbH.gif", {
              responseType: "stream"
            })).data;

            const checkresult = await message.reply({
              body: "Checking result...",
              attachment: roll
            });

            setTimeout(async () => {
              api.unsendMessage(checkresult.messageID);

              const resultMessage = generateResultMessage(randomColor, gameData.players);

              for (const player of gameData.players) {
                let moneyChange = 0;

                if (player.color.word === randomColor.word) {
                  moneyChange = player.betAmount; // Player wins
                } else {
                  moneyChange = -player.betAmount; // Player loses
                }

                await usersData.addMoney(player.userID, moneyChange);
              }

              chanle.delete(threadID);
              message.reply(resultMessage);
            }, 5000); // Wait 5 seconds before sending the result message
          } catch (error) {
            console.error(error);
            message.reply("An error occurred while processing the result.");
          }
        }, 20000); // Wait 20 seconds before generating result
      }
    } catch (e) {
      console.error(e);
      message.reply(e.message + "\n\nAn error occurred while processing the command.");
    }
  }
}

function generateResultMessage(randomColor, players) {
  let resultMessage = "=== 𝙲𝙾𝙻𝙾𝚁𝙶𝙰𝙼𝙴 𝚁𝙴𝚂𝚄𝙻𝚃 ===\n\n";
  resultMessage += `Result: ${randomColor.emoji} (${randomColor.word})\n\n`;
  resultMessage += "=== 𝙿𝙻𝙰𝚈𝙴𝚁 𝚁𝙴𝚂𝚄𝙻𝚃𝚂 ===\n";

  players.forEach((player, index) => {
    const playerResult = (player.color.word === randomColor.word) ? "Win" : "Lose";
    const moneyChange = playerResult === "Win" ? player.betAmount : -player.betAmount;
    const moneyChangeString = moneyChange >= 0 ? `+₱${moneyChange}` : `-₱${Math.abs(moneyChange)}`;
    resultMessage += `${index + 1}. ${player.name}: ${playerResult} (${moneyChangeString})\n`;
  });
  return resultMessage;
}
