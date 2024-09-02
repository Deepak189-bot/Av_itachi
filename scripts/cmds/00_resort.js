const fs = require('fs');
const axios = require('axios');
const { join } = require('path');

const resortImages = [
  "https://i.imgur.com/SOA08ZY.png",
  "https://i.imgur.com/TJjSR0b.jpg",
  "https://i.imgur.com/2rbIdig.jpg",
  "https://i.imgur.com/B4LfB3N.png",
  "https://i.imgur.com/rAp1ht1.png",
  "https://i.imgur.com/m0U81MX.jpg",
  "https://i.imgur.com/cAYBO5u.jpg",
  "https://i.imgur.com/TlA5ses.jpg",
  "https://i.imgur.com/hHIw2Ay.jpg",
  "https://i.imgur.com/Sgj79Gi.jpg",
  "https://i.imgur.com/ZoldXIQ.png",
  "https://i.imgur.com/CZD4GrY.jpg",
  "https://i.imgur.com/kJciB1v.jpg",
  "https://i.imgur.com/8dbenRw.png",
  "https://i.imgur.com/OHpHq2I.png",
  "https://i.imgur.com/54iBcHP.jpg",
  "https://i.imgur.com/Hgr4MDD.jpg",
  "https://i.imgur.com/qUqWSMD.jpg",
  "https://i.imgur.com/8LtPOT9.jpg",
  "https://i.imgur.com/zokGGXP.jpg",
  "https://i.imgur.com/OxfHFlI.jpg",
  "https://i.imgur.com/c3Q7gxt.jpg",
  "https://i.imgur.com/4KvBgkQ.jpg",
  "https://i.imgur.com/AJikYqr.jpg"
];

const valueIncreaseInterval = 7 * 60 * 1000; 
const cleanCooldownDuration = 2 * 60 * 60 * 1000; 
const maxResortLevel = 24; 

setInterval(() => {
  for (const [userID, userResort] of userResorts.entries()) {
    const { valueIncrease, imageURL } = calculateResortValue(userResort.level);
    userResort.value = (userResort.value || 0) + valueIncrease;

    const cleanlinessDecrease = 2;
    userResort.cleanliness = Math.max(userResort.cleanliness - cleanlinessDecrease, 0);

    userResort.imageURL = imageURL; 
  }

  const currentTime = Date.now();
  for (const [userID, lastCleanTime] of cleanlinessCooldowns.entries()) {
    if (currentTime - lastCleanTime >= cleanCooldownDuration) {
      cleanlinessCooldowns.delete(userID); 
    }
  }

  saveUserData();
}, valueIncreaseInterval);

let cleanlinessCooldowns = new Map();
let userResorts = new Map();
const PATH = join(__dirname, 'user_resorts.json');


module.exports = {
  config: {
    name: "resort",
    //aliases: [""], 
    version: "1.0.9",
    author: "Dymyrius",
    countDown: 10,
    role: 0,
    description: {
        en: "Manage Your Resort!"
    }, 
    category: "game", 
    guide: {
      en: "{pn}"
    } 
  },
 
  langs: {
    en: {
    noResort: "You don't have a resort. Use `resort buy` to get one.",
    buySuccess: "Congratulations! You've purchased a resort named {resortName}!",
    buyFailure: "You don't have enough credits to buy a resort.",
    menuOptions: "◦❭❯❱【 𝗥𝗘𝗦𝗢𝗥𝗧 𝗠𝗘𝗡𝗨 】❰❮❬◦\n\nWelcome to the Casino Resort Management System! 🌴\n\nGet ready to create and manage your dream resort.\n\n𝗖𝗵𝗼𝗼𝘀𝗲 𝗮𝗻 𝗢𝗽𝘁𝗶𝗼𝗻:\n➜ /resort buy <name> » Purchase a new resort.\n➜ /resort check » Check the status of your resort.\n➜ /resort clean » Clean your resort.\n➜ /resort upgrade » Upgrade your resort.\n➜ /resort collect » Collect value from your resort.\n➜ /resort rename <newName> » Rename your resort."
   }
  }, 


onStart: async function({ message, getLang, args, event, usersData }) {
  const resortimage = (await axios.get("https://i.imgur.com/kKP3G5t.png", {
    responseType: "stream"
  })).data;

  if (!event || !event.body) {
    console.error('Invalid Message or Message Body!');
    return;
  }

  const { senderID } = event;

  if (args.length === 0 || args[0] === "menu") {
    const menuOptions = getLang("menuOptions");
    return message.reply({
      body: menuOptions,
      attachment: resortimage
    });
  }

  if (args[0] === "buy") {
    if (userResorts.has(senderID)) {
      return message.reply("You already own a resort. If you want a new one, you can sell your current resort using `resort sell`.");
    }

    const resortPrice = 1000000; 
    const userBalance = await usersData.getMoney(senderID);

    if (userBalance < resortPrice) {
      return message.reply("You don't have enough credits to buy a resort.\nRequired Money: " + resortPrice.toLocaleString());
    }


    if (args.length < 2) {
      return message.reply("Please provide a name for your resort.");
    }

    const newResort = {
      name: args.slice(1).join(" "),
      level: 1,
      cleanliness: 100,
      value: calculateResortValue(1).value, 
      imageURL: resortImages[0] 
    };

    userResorts.set(senderID, newResort);
    saveUserData();

    await usersData.subtractMoney(senderID, resortPrice);
    const buySuccessMessage = `Congratulations! You've purchased a resort named ${newResort.name}! 🏖`;
    const imageResponse = await axios.get(resortImages[0], {
      responseType: 'stream'
    });

    return message.reply({
      body: buySuccessMessage,
      attachment: imageResponse.data
    });
  }

  if (args[0] === "clean") {
    if (!userResorts.has(senderID)) {
      return message.reply("You don't own a resort. Use `/resort buy` to purchase one.");
    }

    const cleanlinessCooldownDuration = 1 * 60 * 60 * 1000;
    const lastCleanTime = cleanlinessCooldowns.get(senderID) || 0;
    const currentTime = Date.now();

    if (currentTime - lastCleanTime < cleanlinessCooldownDuration) {
      const remainingCooldown = cleanlinessCooldownDuration - (currentTime - lastCleanTime);
      const remainingCooldownHours = Math.ceil(remainingCooldown / (60 * 60 * 1000));

      return message.reply(`Your resort is already clean. It can be cleaned again in ${remainingCooldownHours} hour. ⏱`);
    }

    cleanlinessCooldowns.set(senderID, currentTime);
    userResorts.get(senderID).cleanliness = 100;
    saveUserData();

    return message.reply("You've cleaned your resort! It's now sparkling clean. 🧹");
  }

  if (args[0] === "check") {
    if (!userResorts.has(senderID)) {
      return message.reply("You don't own a resort. Use `resort buy` to purchase one.");
    }

    const userResort = userResorts.get(senderID);
    const resortCleanliness = userResort.cleanliness; 

    const resortStatusMessage = `🏨 | 𝗥𝗲𝘀𝗼𝗿𝘁 𝗡𝗮𝗺𝗲: ${userResort.name}\n⬆️ | 𝗥𝗲𝘀𝗼𝗿𝘁 𝗟𝗲𝘃𝗲𝗹: ${userResort.level}\n🧹 | 𝗖𝗹𝗲𝗮𝗻𝗹𝗶𝗻𝗲𝘀𝘀: ${resortCleanliness}%\n📈 | 𝗜𝗻𝗰𝗼𝗺𝗲: ₱${userResort.value}`;

    if (userResort.imageURL) {
      const imageResponse = await axios.get(userResort.imageURL, {
        responseType: "stream"
      });

      return message.reply({
        body: resortStatusMessage,
        attachment: imageResponse.data
      });
    } else {
      return message.reply(resortStatusMessage);
    }
  }

  if (args[0] === "upgrade") {
    if (!userResorts.has(senderID)) {
      return message.reply("You don't own a resort. Use `/resort buy` to purchase one.");
    }

    const userResort = userResorts.get(senderID);
    const currentLevel = userResort.level;

    if (currentLevel >= maxResortLevel) {
      return message.reply("Your resort is already at the maximum level.");
    }

    const currentTime = Date.now(); 

    const timeSinceLastUpgrade = currentTime - (userResort.lastUpgradeTime || 0);
    const upgradeCooldownDuration = 5 * 60 * 60 * 1000;

    if (timeSinceLastUpgrade < upgradeCooldownDuration) {
      const remainingCooldown = upgradeCooldownDuration - timeSinceLastUpgrade;
      const remainingCooldownHours = Math.ceil(remainingCooldown / (60 * 60 * 1000));

      return message.reply(`You can't upgrade your resort yet. Please wait for ${remainingCooldownHours} hours before upgrading again. ⏱`);
    }

    const baseUpgradePrice = 50000; 
    const upgradeMultiplier = 2 ** (currentLevel - 1); 
    const upgradePrice = baseUpgradePrice * upgradeMultiplier;

    const userBalance = await usersData.getMoney(senderID);

    if (userBalance < upgradePrice) {
      return message.reply(`You don't have enough credits to upgrade your resort. The upgrade costs is ${upgradePrice}.`);
    }

    try {
      await usersData.subtractMoney(senderID, upgradePrice);
    } catch (error) {
      console.error('Failed to deduct balance:', error);
      return message.reply("An error occurred while deducting your balance.");
    }

    const nextLevel = Math.min(currentLevel + 1, maxResortLevel); 
    const { value: nextValue, imageURL: nextImageURL } = calculateResortValue(nextLevel);

    userResort.level = nextLevel;
    userResort.value = nextValue;
    userResort.lastUpgradeTime = currentTime; 
    userResort.imageURL = nextImageURL; 

    saveUserData();

    const upgradeSuccessMessage = `Congratulations! Your resort has been upgraded to level ${nextLevel}. Its value has increased to ₱${nextValue}. The upgrade cost you ₱${upgradePrice}. ⬆`;

    if (nextLevel === maxResortLevel) {
      return message.reply(upgradeSuccessMessage + "Your resort is now at the maximum level!");
    }

    return message.reply(upgradeSuccessMessage);
  }

  if (args[0] === "collect") {
    if (!userResorts.has(senderID)) {
      return message.reply("You don't own a resort. Use `resort buy` to purchase one.");
    }

    const userResort = userResorts.get(senderID);
    const collectedAmount = userResort.value;

    if (collectedAmount <= 0) {
      return message.reply("There's no value to collect from your resort.");
    }

    await usersData.addMoney(senderID, collectedAmount);
    userResort.value = 0;
    saveUserData();

    const collectMessage = `You've collected ₱${collectedAmount} value from your resort! 💰`;
    return message.reply(collectMessage);
  }

  if (args[0] === "rename") {
    if (!userResorts.has(senderID)) {
      return message.reply("You don't own a resort. Use `resort buy` to purchase one");
    }

    if (args.length < 2) {
      return message.reply("Please provide a new name for your Resort.");
    }

    const newResortName = args.slice(1).join(" ");
    userResorts.get(senderID).name = newResortName;
    saveUserData();

    return message.reply(`Your Resort has been renamed to "${newResortName}". 🏨`);
  }

  const menuOptions = getLang("menuOptions");
  return message.reply(menuOptions);
  }
};


function loadUserData() {
  try {
    const data = fs.readFileSync(PATH, 'utf8');
    const parsedData = JSON.parse(data);

    userResorts = new Map(parsedData.userResorts.map(([userID, userData]) => {
      const { lastUpgradeTime = 0, ...restData } = userData;
      return [userID, { ...restData, name: restData.name || "", lastUpgradeTime }];
    }));
    cleanlinessCooldowns = new Map(parsedData.cleanlinessCooldowns);
  } catch (err) {
    console.error('Failed to load user resorts:', err);
  }
}

function saveUserData() {
  try {
    const data = JSON.stringify({
      userResorts: Array.from(userResorts).map(([userID, userData]) => {
        const { lastUpgradeTime, ...restData } = userData;
        return [userID, { ...restData, name: restData.name || "", lastUpgradeTime }];
      }),
      cleanlinessCooldowns: Array.from(cleanlinessCooldowns)
    }, null, 2); 
    fs.writeFileSync(PATH, data, 'utf8');
  } catch (err) {
    console.error('Failed to save user resorts:', err);
  }
}

function calculateResortValue(level) {
  const value = level * 10000; 
  const valueIncrease = level * 3000 * level;
  const imageURL = resortImages[level - 1]; 

  return { value, valueIncrease, imageURL };
}

loadUserData();
