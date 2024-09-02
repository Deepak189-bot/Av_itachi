const fs = require('fs');
const axios = require('axios');
const { join } = require('path');

let plantOwners = new Map();
const GROWTH_INTERVAL = 2 * 60 * 60 * 1000; 
const WATER_COOLDOWN = 10 * 60 * 1000;
const PATH = join(__dirname, 'plant_owners.json');

function loadPlantOwners() {
  try {
    const data = fs.readFileSync(PATH, 'utf8');
    plantOwners = new Map(JSON.parse(data));
  } catch (err) {
    console.error('Failed to load plant owners:', err);
  }
}

function savePlantOwners() {
  try {
    fs.writeFileSync(PATH, JSON.stringify([...plantOwners]), 'utf8');
  } catch (err) {
    console.error('Failed to save plant owners:', err);
  }
}

function updatePlantGrowth() {
  const currentTime = Date.now();
  plantOwners.forEach((plant, ownerID) => {
    const elapsedTime = currentTime - plant.lastWater;
    const growthCycles = Math.floor(elapsedTime / GROWTH_INTERVAL);

    if (growthCycles > 0) {
      plant.value = Math.floor(plant.value * Math.pow(1 + (plant.growthFactor || 0.01), growthCycles));
      plant.lastWater = currentTime;
    }
  });
}

loadPlantOwners();

module.exports = {
  config: {
    name: "plant",
    version: "1.0.9",
    author: "AceGerome",
    countDown: 10,
    role: 0,
    description: {
      en: "Buy, water, and sell your virtual plant!"
    },
    category: "game",
    guide: {
      en: "{pn} [ buy | water | check | sell ]"
    }
  },

  langs: {
    en: {
      buySuccess: "⌜🌿⌟ : \n— You successfully bought a plant named %1! 🪴 Your plant will grow over time.",
      buyFailure: "⌜🌿⌟ : \n— You already have a plant!",
      waterSuccess: "⌜🌿⌟ : — You watered your plant named %1. It will now grow faster! 💧",
      waterCost: "⌜💰⌟ : \n— Watering your plant costs $%2.",
      waterFailure: "⌜🌿⌟ : \n— You can't water a plant you don't own.",
      waterCooldown: "⌜⏳⌟ : \n— You need to wait %1 before watering your plant again.",
      noPlant: "⌜🌿⌟ : \n— You don't have a plant. Use `/plant buy <plantName> <amount>` to get one.",
      checkInfo: "⌜🌿⌟ : \n— Your plant %1 is worth $%2. Last watered %3 minutes ago.",
      sellSuccess: "⌜💰⌟ : \n— You sold %1 for $%2. Goodbye, little friend!",
      sellFailure: "⌜🌿⌟ : \n— You can't sell a plant you don't own.",
    }
  },

  onStart: async function({ message, getLang, args, event, usersData }) {
    const watering = (await axios.get("https://i.ibb.co/WcTGt0v/xva213.gif", { responseType: "stream" })).data;
    const plant = (await axios.get("https://i.imgur.com/EIcyX4s.png", { responseType: "stream" })).data;

    if (!event || !event.body) {
      console.error('Invalid message object!');
      return;
    }

    const { senderID } = event;

    async function decreaseMoney(ownerID, amount) {
      await usersData.subtractMoney(ownerID, amount);
    }

    updatePlantGrowth();

    if (args.length === 0 || args[0] === "menu") {
      return message.reply({
        body: "【 🌿 ❰ ⪨ 𝗣𝗟𝗔𝗡𝗧 𝗠𝗘𝗡𝗨 ❱ 🌿 】\n— Cultivate your green thumb with our range of plant services. How can I assist you today?\n\n𝗬𝗼𝘂𝗿 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:\n1. `/plant buy <plantName> <amount>` - Buy a new plant. 🌱\n2. `/plant water` - Water your plant to keep it healthy. 💧\n3. `/plant check` - Check your plant’s value and status. 🌿\n4. `/plant sell` - Sell your plant and earn some money. 💸\n━━━━━━━━━━━━━\nPlease select the service you require, and I'll be happy to assist you further. 🌟",
        attachment: plant
      });
    }

    if (args[0] === "buy") {
      if (args.length < 3) {
        return message.reply("⌜🌿⌟ : — Please provide a valid name and amount for your new plant.");
      }

      if (plantOwners.has(senderID)) {
        return message.reply(getLang("buyFailure"));
      }

      const plantName = args[1];
      const amount = parseInt(args[2]);

      if (!plantName || isNaN(amount) || amount <= 0) {
        return message.reply("⌜🌿⌟ : \n— Please provide a valid name and amount for your new plant.");
      }

      const maxPurchaseAmount = 5000000000; 
      const minPurchaseAmount = 300;
      if (amount < minPurchaseAmount) {
        return message.reply(`⌜🙅🏻‍♂️⌟ : \n— The minimum amount to buy a plant is $${MIN_PURCHASE_AMOUNT}.`);
      }
 
      if (amount > maxPurchaseAmount) {
        return message.reply("⌜🙅🏻‍♂️⌟ : \n— You can't buy a plant for more than 5 billion.");
      }

      const userBalance = await usersData.getMoney(senderID);
      if (userBalance < amount) {
        return message.reply("⌜🙅🏻‍♂️⌟ : \n— You don't have enough balance to buy a plant.");
      }

      plantOwners.set(senderID, {
        name: plantName,
        value: amount,
        lastWater: Date.now(),
        growthFactor: 0.01
      });

      await decreaseMoney(senderID, amount);
      savePlantOwners();

      return message.reply(getLang("buySuccess", plantName));
    }

    if (args[0] === "water") {
      if (!plantOwners.has(senderID)) {
        return message.reply(getLang("noPlant"));
      }

      const plantData = plantOwners.get(senderID);
      const lastWaterTime = plantData.lastWater || 0;
      const currentTime = Date.now();

      if (currentTime - lastWaterTime < WATER_COOLDOWN) {
        const remainingTime = Math.ceil((WATER_COOLDOWN - (currentTime - lastWaterTime)) / 1000);
        return message.reply(getLang("waterCooldown", `${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`));
      }

      const waterCost = 100;

      if (await usersData.getMoney(senderID) < waterCost) {
        return message.reply(getLang("waterCost", waterCost));
      }

      await decreaseMoney(senderID, waterCost);
      plantData.value -= waterCost;
      plantData.lastWater = currentTime;
      savePlantOwners();

      return message.reply({
        body: getLang("waterSuccess", plantData.name),
        attachment: watering
      });
    }

    if (args[0] === "check") {
      if (!plantOwners.has(senderID)) {
        return message.reply(getLang("noPlant"));
      }

      const plantData = plantOwners.get(senderID);
      const elapsedTime = Math.floor((Date.now() - plantData.lastWater) / (60 * 1000)); // Minutes
      const plantValue = plantData.value;

      return message.reply(getLang("checkInfo", plantData.name, plantValue, elapsedTime));
    }

    if (args[0] === "sell") {
      if (!plantOwners.has(senderID)) {
        return message.reply(getLang("noPlant"));
      }

      const plantData = plantOwners.get(senderID);
      const plantValue = plantData.value;

      await usersData.addMoney(senderID, plantValue);
      plantOwners.delete(senderID);
      savePlantOwners();

      return message.reply(getLang("sellSuccess", plantData.name, plantValue));
    }

    return message.reply({
      body: "【 🌿 ❰ ⪨ 𝗣𝗟𝗔𝗡𝗧 𝗠𝗘𝗡𝗨 ❱ 🌿 】\n— Cultivate your green thumb with our range of plant services. How can I assist you today?\n\n𝗬𝗼𝘂𝗿 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:\n1. `/plant buy <plantName> <amount>` - Buy a new plant. 🌱\n2. `/plant water` - Water your plant to keep it healthy. 💧\n3. `/plant check` - Check your plant’s value and status. 🌿\n4. `/plant sell` - Sell your plant and earn some money. 💸\n━━━━━━━━━━━━━\nPlease select the service you require, and I'll be happy to assist you further. 🌟",
      attachment: plant
    });
  }
};
