module.exports = {
  config: {
    name: "animalhunt",
    aliases: ['hunt'],
    version: "2.1.0",
    author: "AceGerome",
    countDown: 10,
    role: 0,
    description: {
      en: "Embark on an animal hunting adventure and collect rare animals and treasures."
    },
    category: "Game",
    guide: {
      en: "{pn} <bet_amount>"
    }
  },

  langs: {  
    en: {
      animalhuntUserNoData: "Your data is not ready yet.",
      animalhuntNotEnoughMoney: "Not enough money.",
      animalhuntMinMoney: "Minimum bet is %1. 💵",
      animalhuntFail: "You didn't find any animals or treasures. Better luck next time!",
      animalhuntSuccessAnimal: "You hunted down a %1 (%2) worth %3! 💵",
      animalhuntSuccessTreasure: "You discovered a treasure chest worth $50,000! 💰", 
      error: "Please provide a valid bet amount to start."
    }
  }, 

  onStart: async function({ message, args, getLang, usersData, event }) { 
    const bet = parseInt(args[0]);
    const minBet = 100;

    if (isNaN(bet) || bet <= 0) {
      return message.reply(getLang("error"));
    }

    try {
      const userData = await usersData.get(event.senderID);
      if (!userData) return message.reply(getLang("animalhuntUserNoData"));
      if (userData.money < bet) return message.reply(getLang("animalhuntNotEnoughMoney"));
      if (bet < minBet) return message.reply(getLang("animalhuntMinMoney", minBet));

      await usersData.set(event.senderID, {
        money: userData.money - bet,
        data: userData.data,
      });

      const huntSuccessful = Math.random() < 0.6;
      if (huntSuccessful) {
        const isTreasureFound = Math.random() < 0.1; // 10% chance for treasure
        if (isTreasureFound) {
          await usersData.set(event.senderID, {
            money: userData.money + 50000,
            data: userData.data,
          });
          message.reply(getLang("animalhuntSuccessTreasure"));
        } else {
          const minAnimalValue = 800;
          const maxAnimalValue = 10000;

          const animals = [
            { emoji: "🐂", name: "Wild Bull" },
            { emoji: "🐍", name: "King Cobra" },
            { emoji: "🐕‍🦺", name: "Guard Dog" },
            { emoji: "🦓", name: "Zebra" },
            { emoji: "🦜", name: "Parrot" },
            { emoji: "🐅", name: "Bengal Tiger" },
            { emoji: "🦔", name: "Hedgehog" },
            { emoji: "🦘", name: "Kangaroo" },
            { emoji: "🦧", name: "Orangutan" },
            { emoji: "🦏", name: "Rhinoceros" },
            { emoji: "🐆", name: "Leopard" },
            { emoji: "🦛", name: "Hippopotamus" }
          ];

          const animal = animals[Math.floor(Math.random() * animals.length)];
          const animalValue = Math.floor(Math.random() * (maxAnimalValue - minAnimalValue + 1)) + minAnimalValue;

          await usersData.set(event.senderID, {
            money: userData.money + animalValue,
            data: userData.data,
          });

          message.reply(getLang("animalhuntSuccessAnimal", animal.emoji, animal.name, animalValue.toString()));
        }
      } else {
        message.reply(getLang("animalhuntFail"));
      }
    } catch (error) {
      console.error(error);
      return message.reply(getLang("error"));
    }
  },
};
