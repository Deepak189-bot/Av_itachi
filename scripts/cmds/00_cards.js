const cards = [
  "A♥", "2♥", "3♥", "4♥", "5♥", "6♥", "7♥", "8♥", "9♥", "10♥", "J♥", "Q♥", "K♥",
  "A♠", "2♠", "3♠", "4♠", "5♠", "6♠", "7♠", "8♠", "9♠", "10♠", "J♠", "Q♠", "K♠",
  "A♦", "2♦", "3♦", "4♦", "5♦", "6♦", "7♦", "8♦", "9♦", "10♦", "J♦", "Q♦", "K♦",
  "A♣", "2♣", "3♣", "4♣", "5♣", "6♣", "7♣", "8♣", "9♣", "10♣", "J♣", "Q♣", "K♣"
];

const cardValues = {
  "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 10, "Q": 10, "K": 10
};

module.exports = {
  config: {
    name: "card",
    version: "1.0.0",
    author: "WaifuCat",
    countDown: 10,
    role: 0,
    description: {
      en: "Play a card game against the bot and bet money!"
    },
    category: "game",
    guide: {
      en: "{pn} <bet>"
    }
  },

  onStart: async function ({ message, args, usersData, event }) {
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0) {
      return message.reply("Please enter a valid bet amount.");
    }

    const userBalance = await usersData.getMoney(event.senderID);

    if (userBalance == null || userBalance < amount) {
      return message.reply("Sorry, not enough funds to place the bet.\n𝗬𝗼𝘂𝗿 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: " + userBalance);
    }

    const userCards = drawCards(3);
    const botCards = drawCards(3);

    const userScore = calculateScore(userCards);
    const botScore = calculateScore(botCards);

    const result = determineResult(userScore, botScore);

    let winnings = 0;
    if (result === "Win") {
      winnings = amount * 2;
    } else if (result === "Lose") {
      winnings = -amount;
    }

    await usersData.addMoney(event.senderID, winnings);

    const response = formatResponse(userCards, botCards, userScore, botScore, result, winnings);
    message.reply(response);
  }
};

function drawCards(count) {
  return cards.sort(() => 0.5 - Math.random()).slice(0, count);
}

function calculateScore(cards) {
  return cards.reduce((total, card) => {
    const value = cardValues[card.slice(0, -1)];
    return total + value;
  }, 0);
}

function determineResult(userScore, botScore) {
  if (userScore > botScore) {
    return "Win";
  } else if (userScore === botScore) {
    return "Tie";
  } else {
    return "Lose";
  }
}

function formatResponse(userCards, botCards, userScore, botScore, result, winnings) {
  const winMessage = winnings > 0 ? `― You Won $${winnings}! 💵` : winnings < 0 ? `― You Lost $${Math.abs(winnings)}. 💸` : "It's A Tie.";
  return `🎴 𝗬𝗼𝘂𝗿 𝗖𝗮𝗿𝗱𝘀: ${userCards.join(", ")} - 𝗧𝗼𝘁𝗮𝗹 𝗦𝗰𝗼𝗿𝗲: ${userScore}\n🤖 𝗕𝗼𝘁'𝘀 𝗖𝗮𝗿𝗱𝘀: ${botCards.join(", ")} - 𝗧𝗼𝘁𝗮𝗹 𝗦𝗰𝗼𝗿𝗲: ${botScore}\n\n📊 𝗥𝗲𝘀𝘂𝗹𝘁: ${result}\n━━━━━━━━━━━━━━━\n${winMessage}`;
}
