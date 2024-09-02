const fs = require('fs');
const axios = require('axios');
const { join } = require('path');

let petOwners = new Map();
const GROWTH_INTERVAL = 2 * 60 * 60 * 1000; // Slower growth interval (2 hours)
const PATH = join(__dirname, 'pet_owners.json');

function loadPetOwners() {
  try {
    const data = fs.readFileSync(PATH, 'utf8');
    const parsedData = JSON.parse(data);
    petOwners = new Map(parsedData);
  } catch (err) {
    console.error('Failed to load pet owners:', err);
  }
}

function savePetOwners() {
  try {
    const data = JSON.stringify([...petOwners]);
    fs.writeFileSync(PATH, data, 'utf8');
  } catch (err) {
    console.error('Failed to save pet owners:', err);
  }
}

function updatePetGrowth() {
  const currentTime = Date.now();
  petOwners.forEach((pet, ownerID) => {
    const growthPercentage = pet.growthFactor || 0.01;
    const elapsedTime = currentTime - pet.lastFed;
    const growthCycles = Math.floor(elapsedTime / GROWTH_INTERVAL);

    if (growthCycles > 0) {
      const newPetValue = Math.floor(pet.value * Math.pow(1 + growthPercentage, growthCycles));
      pet.value = newPetValue;
      pet.lastFed = currentTime;
    }
  });
}

loadPetOwners();

module.exports = {
  config: {
    name: "petv2",
    version: "1.0.9",
    author: "Gauxy",
    countDown: 10,
    role: 0,
    description: {
      en: "Buy, feed, and sell your virtual pet!"
    },
    category: "game",
    guide: {
      en: "{pn} <buy/feed/check/sell>"
    }
  },

  langs: {
    en: {
      buySuccess: "⌜🎊⌟ : \n—  Congratulations, you've adopted a new pet named {petName}!",
      buyFailure: "⌜😼⌟ : \n—  You already have a pet. Take care of it!",
      feedSuccess: "⌜🍖⌟ : \n—  You fed {petName}. It looks happier now! 💕",
      feedCost: "⌜💰⌟ : \n— Feeding {petName} costs ${feedCost}.",
      feedFailure: "⌜🐶⌟ : \n— You can't feed a pet you don't own.",
      noPet: "⌜🐶⌟ : \n— You don't have a pet. Use `pet buy` to get one.",
      checkInfo: "⌜🐶⌟ : \n— Your pet {petName} has grown worth ${petValue}💰. Don't forget to feed it.",
      sellSuccess: "⌜💰⌟ : \n— You sold {petName} for ${amount}. Goodbye, little friend!",
      sellFailure: "⌜🐶⌟ : \n—  You can't sell a pet."
    }
  },

  onStart: async function({ message, getLang, args, event, usersData }) {
    const feeding = (await axios.get("https://i.imgur.com/82Knrjb.gif", {
      responseType: "stream"
    })).data;
    const pets = (await axios.get("https://i.imgur.com/uiq7lEw.png", {
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

    updatePetGrowth();

    if (args.length === 0 || args[0] === "menu") {
      return message.reply({
        body: "『 🐾 ❰ 𝗣𝗘𝗧 ❱ 🐾 』\n\n𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝘁𝗼 𝘁𝗵𝗲 𝗣𝗲𝘁 𝗦𝗵𝗼𝗽!   \nFind your furry companion and experience the joy of pet ownership. 🐶🐱\n\n𝗬𝗼𝘂𝗿 𝗢𝗽𝘁𝗶𝗼𝗻𝘀: \n1.  `/𝗽𝗲𝘁𝘃2 𝗯𝘂𝘆 <𝗽𝗲𝘁𝗻𝗮𝗺𝗲> <𝗮𝗺𝗼𝘂𝗻𝘁>`  - Adopt a new pet! Choose from a variety of adorable creatures. 🐾\n2.  `/𝗽𝗲𝘁𝘃2 𝗳𝗲𝗲𝗱`  -  Nourish your pet and keep them happy. 🍲\n3.  `/𝗽𝗲𝘁𝘃2 𝗰𝗵𝗲𝗰𝗸`  -  See how your pet is doing and learn its value. 📈\n4.  `/𝗽𝗲𝘁𝘃2 𝘀𝗲𝗹𝗹`  -  Part ways with your pet and earn some coins. 💰\n𝗣𝗹𝗲𝗮𝘀𝗲 𝘀𝗲𝗹𝗲𝗰𝘁 𝘁𝗵𝗲 𝘀𝗲𝗿𝘃𝗶𝗰𝗲 𝘆𝗼𝘂 𝗻𝗲𝗲𝗱, 𝗮𝗻𝗱 𝗹𝗲𝘁'𝘀 𝗴𝗲𝘁 𝘆𝗼𝘂 𝘀𝘁𝗮𝗿𝘁𝗲𝗱 𝗼𝗻 𝘆𝗼𝘂𝗿 𝗽𝗲𝘁 𝗷𝗼𝘂𝗿𝗻𝗲𝘆!  😄",
        attachment: pets
      });
    }

    if (args[0] === "buy") {
      if (args.length < 3) {
        return message.reply("⌜💁🏻‍♂️⌟ : \n— Please provide a valid name and amount for your new pet.");
      }

      if (petOwners.has(senderID)) {
        return message.reply(getLang("buyFailure"));
      }

      const petName = args[1];
      const amount = parseInt(args[2]);

      if (!petName || isNaN(amount) || amount <= 0) {
        return message.reply("⌜💁🏻‍♂️⌟ : \n— Please provide a valid name and amount for your new pet.");
      }

      // Limit the purchase amount to 5 billion
      const maxPurchaseAmount = 5000000000; // 5 billion
      if (amount > maxPurchaseAmount) {
        return message.reply("⌜🙅🏻‍♂️⌟ : \n— You can't buy a pet for more than 5 billion.");
      }

      const userBalance = await usersData.getMoney(senderID);

      if (userBalance < amount) {
        return message.reply("⌜🙅🏻‍♂️⌟ : \n— You don't have enough balance to buy a pet.");
      }

      petOwners.set(senderID, {
        name: petName,
        value: amount,
        lastFed: Date.now()
      });

      await decreaseMoney(senderID, amount); // Decrease user's money
      savePetOwners();

      const buySuccessMessage = getLang("buySuccess").replace("{petName}", petName);
      return message.reply(buySuccessMessage);
    }

    if (args[0] === "feed") {
      if (!petOwners.has(senderID)) {
        return message.reply(getLang("noPet"));
      }

      const petData = petOwners.get(senderID);
      const petValue = petData.value;
      const feedCost = 100; // Replace with the actual feed cost value

      if (petValue < feedCost) {
        return message.reply("⌜🤦🏻‍♂️⌟ : \n— You don't have enough value to feed your pet.");
      }

      await decreaseMoney(senderID, feedCost);
      petData.value -= feedCost;
      petData.lastFed = Date.now();

      savePetOwners();

      const feedSuccessMessage = getLang("feedSuccess")
        .replace("{petName}", petData.name)
        .replace("{amount}", feedCost);
      return message.reply({
        body: feedSuccessMessage,
        attachment: feeding
      });
    }

    if (args[0] === "check") {
      if (!petOwners.has(senderID)) {
        return message.reply(getLang("noPet"));
      }

      const petData = petOwners.get(senderID);
      const petValue = petData.value;

      const currentTime = Date.now();
      const elapsedTime = currentTime - petData.lastFed;
      const growthCycles = Math.floor(elapsedTime / GROWTH_INTERVAL);

      const growthFactor = petData.growthFactor || 0.01; // Retrieve growthFactor from petData
      const newPetValue = Math.floor(petValue * Math.pow(1 + growthFactor, growthCycles));

      const ageInMinutes = Math.floor(elapsedTime / (60 * 1000));

      const checkMessage = getLang("checkInfo")
        .replace("{petName}", petData.name)
        .replace("{petValue}", newPetValue)
        .replace("{ageInMinutes}", ageInMinutes)
        .replace("{growthFactor}", growthFactor)
        .replace("{growthCycles}", growthCycles); // Replace the placeholder with the actual value
      return message.reply(checkMessage);
    }

    if (args[0] === "sell") {
      if (!petOwners.has(senderID)) {
        return message.reply(getLang("noPet"));
      }

      const petData = petOwners.get(senderID);
      const petValue = petData.value;

      await usersData.addMoney(senderID, petValue);
      petOwners.delete(senderID);
      savePetOwners();

      return message.reply(getLang("sellSuccess").replace("{petName}", petData.name).replace("{amount}", petValue));
    }

    return message.reply({
      body: "『 🐾 ❰ 𝗣𝗘𝗧 ❱ 🐾 』\n\n𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝘁𝗼 𝘁𝗵𝗲 𝗣𝗲𝘁 𝗦𝗵𝗼𝗽!   \nFind your furry companion and experience the joy of pet ownership. 🐶🐱\n\n𝗬𝗼𝘂𝗿 𝗢𝗽𝘁𝗶𝗼𝗻𝘀: \n1.  `/𝗽𝗲𝘁𝘃2 𝗯𝘂𝘆 <𝗽𝗲𝘁𝗻𝗮𝗺𝗲> <𝗮𝗺𝗼𝘂𝗻𝘁>`  - Adopt a new pet! Choose from a variety of adorable creatures. 🐾\n2.  `/𝗽𝗲𝘁𝘃2 𝗳𝗲𝗲𝗱`  -  Nourish your pet and keep them happy. 🍲\n3.  `/𝗽𝗲𝘁𝘃2 𝗰𝗵𝗲𝗰𝗸`  -  See how your pet is doing and learn its value. 📈\n4.  `/𝗽𝗲𝘁𝘃2 𝘀𝗲𝗹𝗹`  -  Part ways with your pet and earn some coins. 💰\n𝗣𝗹𝗲𝗮𝘀𝗲 𝘀𝗲𝗹𝗲𝗰𝘁 𝘁𝗵𝗲 𝘀𝗲𝗿𝘃𝗶𝗰𝗲 𝘆𝗼𝘂 𝗻𝗲𝗲𝗱, 𝗮𝗻𝗱 𝗹𝗲𝘁'𝘀 𝗴𝗲𝘁 𝘆𝗼𝘂 𝘀𝘁𝗮𝗿𝘁𝗲𝗱 𝗼𝗻 𝘆𝗼𝘂𝗿 𝗽𝗲𝘁 𝗷𝗼𝘂𝗿𝗻𝗲𝘆!  😄",
    });
  }
};
