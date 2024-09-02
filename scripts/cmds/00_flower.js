const fs = require('fs');
const { join } = require('path');

let plantOwners = new Map();
const GROWTH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
const GROWTH_RATE = 0.56; // Adjust the growth rate to a lower value
const PATH = join(__dirname, 'flowerOwner.json');

// Load plant owners from file
function loadPlantOwners() {
  try {
    const data = fs.readFileSync(PATH, 'utf8');
    plantOwners = new Map(JSON.parse(data));
  } catch (err) {
    console.error('Failed to load plant owners:', err);
  }
}

// Save plant owners to file
function savePlantOwners() {
  try {
    const data = JSON.stringify(Array.from(plantOwners.entries()), null, 2);
    fs.writeFileSync(PATH, data, 'utf8');
  } catch (err) {
    console.error('Failed to save plant owners:', err);
  }
}

// Load plant owners at the start
loadPlantOwners();

module.exports = {
  config: {
    name: "flower",
    version: "1.0.9",
    author: "Ariél Violét",
    countDown: 10,
    role: 0,
    description: {
      en: "Buy and Grow Plant!"
    },
    category: "game",
    guide: {
      en: "{pn} <buy/check/sell>"
    }
  },

  langs: {
    en: {
      buySuccess: "⌜🌻⌟ : — You've successfully bought a flower! Revisit later to observe your flower's growth.",
      buyFailure: "⌜🌻⌟ : — You already have a flower.",
      sellSuccess: "⌜🎍⌟ : — You sold your flower for ${amount} 💵",
      noPlant: "⌜🌻⌟ : —  You don't have a flower. Use `flower buy` to get one.",
      growthInfo: "Your flower has grown! Its current value is %1 💵.",
      checkInfo: "⌜🌻⌟  : — Your flower has grown and is now worth ${value} 💵. (Growth: +${growthValue} 💵)"
    }
  },

  onStart: async function({ message, getLang, args, event, usersData }) {
    if (!event || !event.body) {
      console.error('Invalid message object!');
      return;
    }

    async function updatePlantGrowth() {
      const currentTime = Date.now();
      let changesMade = false;

      for (const [ownerID, plant] of plantOwners.entries()) {
        const elapsedTime = currentTime - plant.lastUpdated;
        const growthCycles = Math.floor(elapsedTime / GROWTH_INTERVAL);
        
        if (growthCycles > 0) {
          const newPlantValue = Math.floor(plant.value * Math.pow(1 + GROWTH_RATE, growthCycles));
          plant.value = newPlantValue;
          plant.lastUpdated = currentTime;
          changesMade = true;
          
          const growthMessage = getLang("growthInfo").replace("%1", newPlantValue);
          message.reply(growthMessage);
        }
      }

      if (changesMade) savePlantOwners(); // Save only if changes were made
    }

    const { senderID } = event;

    await updatePlantGrowth();

    if (args.length === 0 || args[0] === "menu") {
      return message.reply({
        body: "⪨ 𝗙𝗟𝗢𝗪𝗘𝗥 𝗠𝗘𝗡𝗨 🌻⪩\n\n1. `/flower buy <amount>` » Buy a flower.\n2. `/flower water` » Water your flower to grow it faster.\n3. `/flower check` » Check your flower's growth.\n4. `/flower sell` » Sell your flower.\n\n🌸 Enjoy the serene world of flowers! 🌺🌼 Let your garden bloom! 🌷"
      });
    }

    if (args[0] === "buy") {
      if (plantOwners.has(senderID)) {
        return message.reply(getLang("buyFailure"));
      }

      const plantPrice = parseInt(args[1]);

      if (isNaN(plantPrice) || plantPrice <= 0) {
        return message.reply("Invalid amount. Please provide a valid amount of money to buy a flower.");
      }
      
      const MINIMUM_BET = 300;
      const MAXIMUM_BET = 100000000; // 100 million
      
      if (plantPrice < MINIMUM_BET) {
        return message.reply(`The maximum amount to buy a flower is ${MINIMUM_BET} 💵.`);
      }

      if (plantPrice > MAXIMUM_BET) {
        return message.reply(`The maximum amount to buy a flower is ${MAXIMUM_BET} 💵.`);
      }

      const userBalance = await usersData.getMoney(senderID);

      if (userBalance < plantPrice) {
        return message.reply("You don't have enough balance to buy a flower.\n𝗬𝗼𝘂𝗿 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: " + userBalance);
      }

      await usersData.subtractMoney(senderID, plantPrice);
      plantOwners.set(senderID, {
        name: event.senderName, 
        value: plantPrice, 
        lastUpdated: Date.now() 
      });
      savePlantOwners();
      return message.reply(getLang("buySuccess"));
    }

    if (args[0] === "water") {
      return message.reply({
        body: "⌜🌻⌟ : — You watered your flower, it will now grow faster."
      });
    }

    if (args[0] === "check") {
      if (!plantOwners.has(senderID)) {
        return message.reply(getLang("noPlant"));
      }

      const plantData = plantOwners.get(senderID);
      const plantValue = plantData.value;
      const growthValue = Math.floor(plantValue * GROWTH_RATE); 
      const checkMessage = getLang("checkInfo")
        .replace('${value}', plantValue)
        .replace('${growthValue}', growthValue);
      return message.reply(checkMessage);
    }

    if (args[0] === "sell") {
      if (!plantOwners.has(senderID)) {
        return message.reply(getLang("noPlant"));
      }

      const plantValue = plantOwners.get(senderID).value;
      await usersData.addMoney(senderID, plantValue);
      plantOwners.delete(senderID);
      savePlantOwners();
      return message.reply(getLang("sellSuccess").replace('${amount}', plantValue));
    }
  }
};
