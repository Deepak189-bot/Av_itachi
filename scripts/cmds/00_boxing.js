const axios = require('axios');
const boxes = new Map();

module.exports = {
  config: {
    name: "boxing",
    aliases: ["bx"],
    version: "0.0.1",
    author: "Dymyrius",
    countDown: 10,
    role: 0,
    description: {
      en: "Play a boxing game with another player!"
    },
    category: "game",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function({ message, args, event, usersData }) {
    const box = boxes.get(event.threadID);
    const boxingGif = await axios.get("https://i.imgur.com/AmuVh7a.gif", { responseType: "stream" });
    const ringImage = await axios.get("https://i.imgur.com/OWd9m1i.jpg", { responseType: "stream" });

    if (args[0] === "create") {
      if (box) return message.reply("🥊 The boxing ring is already created in this group.");

      const betAmount = parseInt(args[1]);
      if (!betAmount || isNaN(betAmount) || betAmount < 500) {
        return message.reply("🥊 You need to enter a valid bet amount (minimum 500$).");
      }

      const userMoney = await usersData.getMoney(event.senderID);
      if (userMoney < betAmount) {
        return message.reply(`🥊 You don't have enough money to create a boxing ring with a bet of ${betAmount}$.\n𝗬𝗼𝘂𝗿 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: ${userMoney}`);
      }

      await usersData.subtractMoney(event.senderID, betAmount);
      const { name } = await usersData.get(event.senderID);

      boxes.set(event.threadID, {
        host: { name, userID: event.senderID, choose: null },
        bet: betAmount,
        status: "waiting",
        players: 1,
      });

      return message.reply(`🥊 Boxing ring created with a bet of ${betAmount}$. Waiting for another player to join...`);
    }

    if (args[0] === "join") {
      if (!box || box.status !== "waiting") return message.reply("🥊 There is no boxing ring available to join.");
      if (box.players >= 2) return message.reply("🥊 The boxing ring is already full. You cannot join.");
      if (box.host.userID === event.senderID) return message.reply("🥊 You cannot join the ring you've created.");

      const betAmount = box.bet;
      const playerMoney = await usersData.getMoney(event.senderID);
      if (playerMoney < betAmount) {
        return message.reply(`🥊 You don't have enough money to join this boxing ring with a bet of ${betAmount}$.\n𝗬𝗼𝘂𝗿 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: ${playerMoney}`);
      }

      await usersData.subtractMoney(event.senderID, betAmount);
      const { name } = await usersData.get(event.senderID);

      box.players += 1;
      box.player = { name, userID: event.senderID, choose: null };
      boxes.set(event.threadID, box);

      return message.reply(`🥊 ${name} has joined the boxing ring. Waiting for the host to start the game...`);
    }

    if (args[0] === "fight") {
      if (!box || box.status !== "waiting") return message.reply("🥊 There is no boxing ring available to start the game.");
      if (box.host.userID !== event.senderID) return message.reply("🥊 Only the host can start the game.");
      if (box.players !== 2) return message.reply("🥊 The boxing ring must have exactly 2 players to start the game.");

      box.status = "playing";
      boxes.set(event.threadID, box);

      const choices = ["punch", "block"];
      const hostChoice = choices[Math.floor(Math.random() * choices.length)];
      const playerChoice = choices[Math.floor(Math.random() * choices.length)];

      box.host.choose = hostChoice;
      box.player.choose = playerChoice;

      const sent = await message.reply({
        body: `The boxing match is starting!\n━━━━━━━━━━━━━━━\n${box.host.name} chose: ${hostChoice}\n${box.player.name} chose: ${playerChoice}`,
        attachment: boxingGif.data,
      });

      setTimeout(async () => {
        message.unsend(sent.messageID);

        let winner, loser;
        if ((hostChoice === "punch" && playerChoice === "block") || (hostChoice === "block" && playerChoice === "punch")) {
          winner = box.host;
          loser = box.player;
        } else {
          winner = box.player;
          loser = box.host;
        }

        const winnings = box.bet * 2;
        await usersData.addMoney(winner.userID, winnings);

        const resultMsg = `🥊 The fight is over! ${winner.name} won and earned ₱${winnings}! 🪙`;

        message.reply(resultMsg, event.threadID);
        boxes.delete(event.threadID);
      }, 4000);
    }

    if (args[0] === "end") {
      if (!box || box.status !== "waiting") return message.reply("🥊 There is no boxing ring available to end the game.");
      if (box.host.userID !== event.senderID) return message.reply("🥊 Only the host can end the game.");

      message.reply("🥊 The host has ended the boxing ring.", event.threadID);
      boxes.delete(event.threadID);
    }

    if (!args[0]) {
      message.reply({
        body: "==【 🥊 ❰ Boxing Game ❱ 🥊 】==\n- Step into the ring and show off your boxing skills!\n\n𝗬𝗼𝘂𝗿 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:\n1. `/bx create <bet amount>` => Create a boxing ring with a bet. 🥊💵\n2. `/bx join` => Join an existing boxing ring. 🥊👊\n3. `/bx fight` => Start the boxing match (only for the host). 🥊🔔\n4. `/bx end` => End the boxing ring (only for the host). 🥊🛑\n\n━━━━━━━━━━━━━\nChallenge your opponents, prove your skills, and emerge victorious in the ring! 🏆🥊",
        attachment: ringImage.data,
      });
    }
  }
};
