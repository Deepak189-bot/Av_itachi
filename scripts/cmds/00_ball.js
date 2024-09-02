const crypto = require("crypto");

module.exports = {
  config: {
    name: "shoot",
    aliases: ["ballshoot", "ballshot"],
    version: "1.0.9",
    author: "Rue",
    countDown: 15,
    role: 0,
    description: {
      en: "Shoot a ball and try your luck to win or lose!"
    },
    category: "game",
    guide: {
      en: "{pn} <bet>"
    }
  },

  langs: {
    en: {
      not_enough_money: "You don't have enough money to place this bet.\nYour Balance: %1",
      min_bet: "The minimum bet amount is ₱%1. 🪙",
      max_bet: "The maximum bet amount is ₱%1. 🪙",
      result_win: "【 🏀 The Ball Was Shot 】\n━━━━━━━━━━━━━━━\n🎉 Congratulations! You Won %1💵",
      result_lose: "【 🏀 The Ball Wasn't Shot 】\n━━━━━━━━━━━━━━━\nYou Missed The Shot and Lost %1💵",
      error: "An error occurred."
    }
  },

  onStart: async function({ message, args, getLang, usersData, event }) {
    const minbet = 100;
    const maxbet = 5000000;
    const bet = parseInt(args[0]);

    try {
      const userMoney = await usersData.getMoney(event.senderID);
      if (userMoney === null || isNaN(userMoney)) {
        return message.reply(getLang("error"));
      }
      if (parseInt(userMoney) < bet) {
        return message.reply(getLang("not_enough_money", userMoney));
      }
      if (bet < minbet) {
        return message.reply(getLang("min_bet", minbet));
      }
      if (bet > maxbet) {
        return message.reply(getLang("max_bet", maxbet));
      }

      await usersData.subtractMoney(event.senderID, bet);

      const randomValue = crypto.randomInt(3);
      if (randomValue === 0) {
        const winnings = bet * 2;
        await usersData.addMoney(event.senderID, winnings);
        return message.reply(getLang("result_win", winnings));
      } else {
        return message.reply(getLang("result_lose", bet));
      }
    } catch (error) {
      console.error(error);
      return message.reply(getLang("error"));
    }
  }
}
