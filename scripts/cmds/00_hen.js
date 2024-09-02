const fs = require('fs');
const axios = require('axios');
const { join } = require('path');

let henOwners = new Map();

const EGG_INTERVAL = 8 * 60 * 1000;
const EGG_VALUE = 12345670;
const HEN_COST = 100000;
const HEN_SELL_VALUE = 7500000;
const FEED_COST = 10000;
const FEED_COOLDOWN = 60 * 60 * 1000; 
const PATH = join(__dirname, 'hen_owners.json');

function loadHenOwners() {
  try {
    const data = fs.readFileSync(PATH, 'utf8');
    henOwners = new Map(JSON.parse(data));
  } catch (err) {
    console.error('Failed to load hen owners:', err);
  }
}

function saveHenOwners() {
  try {
    const data = JSON.stringify([...henOwners], null, 2);
    fs.writeFileSync(PATH, data, 'utf8');
  } catch (err) {
    console.error('Failed to save hen owners:', err);
  }
}

function calculateCollectedEggValue(eggCount) {
  return eggCount * EGG_VALUE;
}

function updateEggGeneration() {
  const currentTime = Date.now();
  henOwners.forEach((hen, ownerID) => {
    const elapsedTime = currentTime - hen.lastCollected;
    const eggCount = Math.floor(elapsedTime / EGG_INTERVAL);
    hen.eggCount += eggCount;
    hen.lastCollected = currentTime;
  });
}

loadHenOwners();

module.exports = {
  config: {
    name: "hen",
    version: "1.1.0",
    author: "Ariél Violét",
    countDown: 10,
    role: 0,
    description: {
      en: "Buy hens, feed them, collect eggs, and sell your hens!"
    },
    category: "game",
    guide: {
      en: "{pn} [ buy | feed | check | collect | sell ]"
    }
  },

  langs: {
    en: {
      buySuccess: "Congratulations, you've bought a hen 🐔!",
      buyFailure: "You already have a hen. Take care of it!",
      feedSuccess: "You've fed your hen 🐔! It will lay eggs faster now.",
      feedFailure: "You don't have a hen to feed!",
      feedCooldown: "Your hen is already fed. Please wait before feeding again.",
      checkInfo: "Your hen info:\n━━━━━━━━━━━━\nEgg count: %1 🥚 \nWorth: %2 💰",
      collectSuccess: "You collected %1 eggs\nWorth %2 💰",
      sellSuccess: "You sold your hen for %1. Goodbye, hen friend! 🐔",
      noHen: "You don't have a hen. Use `/hen buy` to get one."
    }
  },

  onStart: async function({ message, getLang, args, usersData, event }) {
    const eggCollecting = (await axios.get("https://i.pinimg.com/564x/ac/f4/78/acf478df0337c976d3db91d13aeb348a.jpg", {
      responseType: "stream"
    })).data;
    const henImage = (await axios.get("https://i.pinimg.com/564x/ac/f4/78/acf478df0337c976d3db91d13aeb348a.jpg", {
      responseType: "stream"
    })).data;

    if (!event || !event.body) {
      console.error('Invalid message object!');
      return;
    }

    const { senderID } = event;

    async function decreaseMoney(ownerID, amount) {
      await usersData.subtractMoney(ownerID, amount);
    }

    updateEggGeneration();

    if (args.length === 0 || args[0] === "menu") {
      return message.reply({
        body: "【 🐓 ❰ 𝐇𝐄𝐍 𝐄𝐆𝐆 𝐅𝐀𝐑𝐌𝐈𝐍𝐆 𝐆𝐀𝐌𝐄 ❱ 🐓 】\n- Welcome to the Hen Egg Farming Game! Start your egg-citing journey today!\n\n𝗬𝗼𝘂𝗿 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:\n1. `/hen buy` » Buy a hen. 🐔\n2. `/hen check` » Check your hen's info. 📋\n3. `/hen collect` » Collect eggs from your hen. 🥚\n4. `/hen sell` » Sell your hen and earn money. 💰\n5. `/hen feed` » Feed your hen to make it lay eggs faster. 🍗\n\nFeel the thrill of farming with hens! 🌾🚜 Let's get cracking! 🥚",
        attachment: henImage
      });
    }

    if (args[0] === "buy") {
      if (henOwners.has(senderID)) {
        return message.reply(getLang("buyFailure"));
      }

      const userBalance = await usersData.getMoney(senderID);

      if (userBalance < HEN_COST) {
        return message.reply(`You don't have enough balance to buy a hen.\n𝗠𝗼𝗻𝗲𝘆 𝗥𝗲𝗾𝘂𝗶𝗿𝗲𝗱: ${HEN_COST}\n𝗬𝗼𝘂𝗿 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: ${userBalance}`);
      }

      henOwners.set(senderID, {
        value: HEN_COST,
        eggCount: 0,
        lastCollected: Date.now(),
        lastFed: 0, 
        eggMultiplier: 1 
      });

      await decreaseMoney(senderID, HEN_COST); // Decrease user's money
      saveHenOwners();

      return message.reply(getLang("buySuccess"));
    }

    if (args[0] === "feed") {
      if (!henOwners.has(senderID)) {
        return message.reply(getLang("feedFailure"));
      }

      const henData = henOwners.get(senderID);
      const currentTime = Date.now();

      if (currentTime - henData.lastFed < FEED_COOLDOWN) {
        return message.reply(getLang("feedCooldown"));
      }

      const userBalance = await usersData.getMoney(senderID);

      if (userBalance < FEED_COST) {
        return message.reply(`You don't have enough balance to feed your hen.\n𝗠𝗼𝗻𝗲𝘆 𝗥𝗲𝗾𝘂𝗶𝗿𝗲𝗱: ${FEED_COST}\n𝗬𝗼𝘂𝗿 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: ${userBalance}`);
      }

      henData.eggMultiplier *= 1.2; 
      henData.lastFed = currentTime;
      await decreaseMoney(senderID, FEED_COST);

      saveHenOwners();

      return message.reply(getLang("feedSuccess"));
    }

    if (args[0] === "check") {
      if (!henOwners.has(senderID)) {
        return message.reply(getLang("noHen"));
      }

      const henData = henOwners.get(senderID);
      const eggCount = henData.eggCount;
      const collectedEggValue = calculateCollectedEggValue(eggCount);

      const checkMessage = getLang("checkInfo", eggCount, collectedEggValue);
      return message.reply(checkMessage);
    }

    if (args[0] === "collect") {
      if (!henOwners.has(senderID)) {
        return message.reply(getLang("noHen"));
      }

      const henData = henOwners.get(senderID);
      const eggCount = henData.eggCount;

      if (eggCount === 0) {
        return message.reply("Your hen hasn't laid any eggs yet.");
      }

      const collectedValue = calculateCollectedEggValue(eggCount);

      henData.eggCount = 0;
      saveHenOwners();

      await usersData.addMoney(senderID, collectedValue);

      return message.reply({
        body: getLang("collectSuccess", eggCount, collectedValue),
        attachment: eggCollecting
      });
    }

    if (args[0] === "sell") {
      if (!henOwners.has(senderID)) {
        return message.reply(getLang("noHen"));
      }

      const henData = henOwners.get(senderID);
      const henValue = henData.value;

      await usersData.addMoney(senderID, HEN_SELL_VALUE);
      henOwners.delete(senderID);
      saveHenOwners();

      return message.reply(getLang("sellSuccess", HEN_SELL_VALUE));
    }

    return message.reply({
      body: "【 🐓 ❰ 𝐇𝐄𝐍 𝐄𝐆𝐆 𝐅𝐀𝐑𝐌𝐈𝐍𝐆 𝐆𝐀𝐌𝐄 ❱ 🐓 】\n- Welcome to the Hen Egg Farming Game! Start your egg-citing journey today!\n\n𝗬𝗼𝘂𝗿 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:\n1. `/hen buy` » Buy a hen. 🐔\n2. `/hen check` » Check your hen's info. 📋\n3. `/hen collect` » Collect eggs from your hen. 🥚\n4. `/hen sell` » Sell your hen and earn money. 💰\n5. `/hen feed` » Feed your hen to make it lay eggs faster. 🍗\n\nFeel the thrill of farming with hens! 🌾🚜 Let's get cracking! 🥚",
    });
  }
};
