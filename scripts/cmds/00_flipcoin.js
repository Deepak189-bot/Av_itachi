const crypto = require("crypto");

module.exports = {
  config: {
    name: "flip",
    aliases: ["f", "flipcoin"], 
    version: "1.0.9",
    author: "Rue",
    countDown: 15,
    role: 0,
    description: {
        en: "Flipcoin game where you can win or lose!"
    }, 
    category: "game", 
    guide: {
      en: "{pn} [head/tails] [bet amount]"
    } 
  },
 
  langs: {
    en: {
      invalid_choice: "Invalid Choices! VALID CHOICES: \n%1.",
      not_enough_money: "You don't have enough money to place this bet.\n𝗬𝗼𝘂𝗿 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: %1",
      min_bet: "The minimum bet amount is ₱%1. 💵",
      result_win: "【 The Coin Landed on 『 %1 』】 ― You won ₱%2! 💵",
      result_lose: "【 The Coin Landed on 『 %1 』】\n― You Lost ₱%2. 💸",
    }, 
  },

  onStart: async function({ message, args, getLang, usersData, event }) {
    const minBet = 100;
    const validChoices = ["heads", "h", "tails", "t"];

    const choice = args[0]?.toLowerCase();
    const bet = parseInt(args[1]);

    if (!choice || !validChoices.includes(choice)) {
      const validStr = validChoices.join(", ");
      return message.reply(getLang("invalid_choice", validStr));
    }

    try {
      const userMoney = await usersData.getMoney(event.senderID);
      if (userMoney === null) {
        return message.reply("Your Data cannot be retrieved.");
      }
      if (userMoney < bet) {
        return message.reply(getLang("not_enough_money", userMoney));
      }
      if (bet < minBet) {
        return message.reply(getLang("min_bet", minBet));
      }

      await usersData.subtractMoney(event.senderID, bet);

      // Generate a cryptographically secure random number
      const buffer = crypto.randomBytes(1);
      const randomByte = buffer[0];
      const isHeads = randomByte % 2 === 0; // Heads if even, Tails if odd

      const result = isHeads ? "heads" : "tails";
      const didWin = (choice === "h" || choice === "heads") ? isHeads : !isHeads;

      const winnings = didWin ? bet * 2 : 0; // Removed unnecessary parseInt
      if (didWin) {
        await usersData.addMoney(event.senderID, winnings);
        return message.reply(getLang("result_win", result, winnings));
      } else {
        return message.reply(getLang("result_lose", result, bet));
      }
    } catch (error) {
      console.error(error);
      return message.reply(error.message);
    }
  }
};
