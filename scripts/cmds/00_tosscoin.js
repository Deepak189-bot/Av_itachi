module.exports = {
  config: {
    name: "tosscoin",
    version: "1.1.0",
    author: "Xavia Team",
    countDown: 10,
    role: 0,
    description: {
      en: "Challenge the computer to a coin toss and win rewards!"
    }, 
    category: "game", 
    guide: {
      en: "{pn} <choice> <bet>"
    } 
  },

  langs: {
    en: {
      invalidChoice: "Invalid choice! Please choose either 'upside' or 'downside'.",
      notEnoughMoney: "You don't have enough money to place this bet.",
      minmoney: "Minimum bet is $%1 💵. Please try again.",
      win: "🎉 Congratulations! You won $%1 💵\nThe coin was %2.",
      lose: "😞 Oops! You lost $%1 💸\nThe coin was %2. Better luck next time!",
      error: "An unexpected error occurred. Please try again later."
    }
  },

  onStart: async function({ message, args, getLang, usersData, event }) {
    const minBet = 50;
    const validChoices = ["u", "upside", "d", "downside"];
    
    if (args.length < 2) {
      return message.reply(getLang("invalidChoice"));
    }

    const choice = args[0]?.toLowerCase();
    const bet = parseInt(args[1]);

    if (!validChoices.includes(choice)) {
      return message.reply(getLang("invalidChoice"));
    }

    if (isNaN(bet) || bet < minBet) {
      return message.reply(getLang("minmoney", minBet));
    }

    try {
      const userMoney = await usersData.getMoney(event.senderID);
      if (userMoney < bet) {
        return message.reply(getLang("notEnoughMoney"));
      }

      await usersData.subtractMoney(event.senderID, bet);

      const isUpside = Math.random() < 0.5;
      const result = isUpside ? "upside" : "downside";
      const didWin = (choice === "u" || choice === "upside") ? isUpside : !isUpside;

      if (didWin) {
        const winnings = bet * 2;
        await usersData.addMoney(event.senderID, winnings);
        return message.reply(getLang("win", winnings, result));
      } else {
        return message.reply(getLang("lose", bet, result));
      }
    } catch (error) {
      console.error(error);
      return message.reply(getLang("error"));
    }
  }
};
