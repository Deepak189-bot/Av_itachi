const fishTypes = [
  { name: "Salmon", emoji: "🐟" },
  { name: "Clownfish", emoji: "🐠" },
  { name: "Shark", emoji: "🦈" },
  { name: "Octopus", emoji: "🐙" },
  { name: "Squid", emoji: "🦑" },
  { name: "Lobster", emoji: "🦞" },
  { name: "Crab", emoji: "🦀" },
  { name: "Tuna", emoji: "🐟" },
  { name: "Eel", emoji: "🐍" },
  { name: "Seahorse", emoji: "🐠" },
  { name: "Manta Ray", emoji: "🛶" },
  { name: "Whale", emoji: "🐋" },
  { name: "Dolphin", emoji: "🐬" },
  { name: "Jellyfish", emoji: "🌊" },
  { name: "Anglerfish", emoji: "🦷" },
  { name: "Starfish", emoji: "⭐" },
  { name: "Penguin", emoji: "🐧" },
  { name: "Shrimp", emoji: "🦐" },
  { name: "Sea Turtle", emoji: "🐢" },
  { name: "Pufferfish", emoji: "🐡" },
  { name: "Sea Urchin", emoji: "🌊" },
  { name: "Swordfish", emoji: "⚔️" },
  { name: "Catfish", emoji: "🐟" },
  { name: "Mackerel", emoji: "🐟" },
  { name: "Herring", emoji: "🐟" },
  { name: "Carp", emoji: "🐟" },
  { name: "Tilapia", emoji: "🐟" },
  { name: "Bass", emoji: "🐟" },
  { name: "Trout", emoji: "🐟" },
  { name: "Halibut", emoji: "🐟" },
  { name: "Walleye", emoji: "🐟" },
  { name: "Perch", emoji: "🐟" },
  { name: "Cod", emoji: "🐟" },
  { name: "Snapper", emoji: "🐟" },
  { name: "Grouper", emoji: "🐟" },
  { name: "Sea Bass", emoji: "🐟" },
  { name: "Lingcod", emoji: "🐟" },
  { name: "Goby", emoji: "🐟" },
  { name: "Anchovy", emoji: "🐟" },
  { name: "Flounder", emoji: "🐟" },
  { name: "Plaice", emoji: "🐟" },
  { name: "Pike", emoji: "🐟" },
  { name: "Zander", emoji: "🐟" },
  { name: "Mudfish", emoji: "🐟" },
  { name: "Sturgeon", emoji: "🐟" },
  { name: "Arowana", emoji: "🐟" },
  { name: "Betta", emoji: "🐟" },
  { name: "Guppy", emoji: "🐟" },
  { name: "Swordtail", emoji: "🐟" },
  { name: "Molly", emoji: "🐟" },
  { name: "Platies", emoji: "🐟" },
  { name: "Rainbowfish", emoji: "🐟" },
  { name: "Barb", emoji: "🐟" },
  { name: "Danio", emoji: "🐟" },
  { name: "Tetra", emoji: "🐟" },
  { name: "Neon Tetra", emoji: "🐟" },
  { name: "Corydoras", emoji: "🐟" },
  { name: "Loach", emoji: "🐟" },
  { name: "Rainbow Trout", emoji: "🐟" },
  { name: "Sunfish", emoji: "🐟" },
  { name: "Devilfish", emoji: "🐟" },
  { name: "Hogfish", emoji: "🐟" },
  { name: "Triggerfish", emoji: "🐟" },
  { name: "Butterfly Fish", emoji: "🐟" },
  { name: "Lionfish", emoji: "🐟" },
  { name: "Parrotfish", emoji: "🐟" },
  { name: "Napoleonfish", emoji: "🐟" },
  { name: "Pangasius", emoji: "🐟" },
  { name: "Ocellaris", emoji: "🐟" },
  { name: "Glassfish", emoji: "🐟" },
  { name: "Goblin Shark", emoji: "🐟" },
  { name: "Humpback Whale", emoji: "🐋" },
  { name: "Beluga Whale", emoji: "🐋" },
  { name: "Narwhal", emoji: "🐋" },
  { name: "Orca", emoji: "🐋" },
  { name: "Killer Whale", emoji: "🐋" },
  { name: "Manatee", emoji: "🐋" },
  { name: "Sea Lion", emoji: "🦭" },
  { name: "Walrus", emoji: "🦭" }
];


const minFishValue = 3000;
const maxFishValue = 8000;

module.exports = {
  config: {
    name: "fish",
    // aliases: ["fishing"], 
    version: "1.0.9",
    author: "Dymyrius | AceGerome (Added More Fish, Upgraded)",
    countDown: 15,
    role: 0,
    description: {
      en: "Go fishing and try to catch a fish or a treasure chest!"
    }, 
    category: "game", 
    guide: {
      en: "{pn} <bet>"
    } 
  },

  langs: {
    en: {
      notEnoughMoney: "Not Enough Money.\n\nCurrent Money: $%1",
      provideBet: "Please provide your bet", 
      minMoney: "Minimum Bet is $%1.",
      maxMoney: "Maximum Bet is $%1",
      fail: "You didn't catch anything. Better luck next time! 💸",
      fail2: "You catch a BlowFish 🐡 worth nothing.",
      success: "You catch a %1 worth $%2! 💵",
      successTreasure: "You caught a treasure chest worth $50,000! 💰"
    }
  },

  onStart: async function({ message, args, usersData, getLang, event }) {
    const bet = parseInt(args[0]);
    const minbet = 300;
    const maxbet = 10000;

    try {
      const userMoney = await usersData.getMoney(event.senderID);
      if (!bet) return message.reply(getLang("provideBet"))
      if (parseInt(userMoney) < bet) return message.reply(getLang("notEnoughMoney", userMoney));
      if (bet < parseInt(minbet)) return message.reply(getLang("minMoney", minbet));
      if (bet > parseInt(maxbet)) return message.reply(getLang("maxMoney", maxbet));

      await usersData.subtractMoney(event.senderID, bet);

      const fishCaught = Math.random() < 0.6;
      if (fishCaught) {
        const isTreasureChest = Math.random() < 0.1;
        if (isTreasureChest) {
          await usersData.addMoney(event.senderID, 50000);
          message.reply(getLang("successTreasure"));
        } else {
          const fish = fishTypes[Math.floor(Math.random() * fishTypes.length)];
          const fishValue = Math.floor(Math.random() * (maxFishValue - minFishValue + 1) + minFishValue);
          await usersData.addMoney(event.senderID, fishValue);
          message.reply(getLang("success", `${fish.name} ${fish.emoji}`, String(fishValue)));
        }
      } else {
        message.reply(getLang("fail") || getLang("fail2"));
      }
      
    } catch (error) {
      console.error(error);
      return message.reply(error.message);
    }
  }
};
