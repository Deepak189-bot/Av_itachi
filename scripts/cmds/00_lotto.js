const userLastInputTime = new Map();
const userWinLossData = new Map();

module.exports = {
  config: {
    name: "lotto",
    //aliases: ["lottery"],
    version: "1.1.0",
    author: "Ariél Violét",
    countDown: 10,
    role: 0,
    description: {
        en: "Play the Lottery Game!"
    },
    category: "game",
    guide: {
      en: "e.g., {pn} 5 10 15 20 "
    }
  },

  onStart: async function({ message, usersData, event, args }) {
    try {
      const bet = 5000000;
      const userMoney = await usersData.getMoney(event.senderID);

      if (userMoney < bet) {
        return message.reply(`You don't have enough balance to play this.\nRequired Money: ${bet}\nYour Balance: ${userMoney}`);
      }

      const result = args.slice(0, 4).map(Number);

      if (result.length < 1) {
        return await message.reply("Welcome to the lottery game!\n\n" +
          "To Play, enter 4 numbers between 1 and 75, separated by spaces, like this: `/lotto 5 10 15 20`.\n━━━━━━━━━━━━━\n" +
          "- If you guess 1 number, you win 1 Trillion/1,000,000,000,000 $\n" +
          "- If you guess 2 numbers, you win 10 Trillion/10,000,000,000,000 $\n" +
          "- If you guess 3 numbers, you win 100 Trillion/100,000,000,000,000 $\n" +
          "- If you guess all 4 numbers, you win 10 Quadrillion/100,000,000,000,000,000 $\n\n" +
          "Each play costs 5,000,000$ credits. Good luck!");
      }

      if (result.length < 4) {
        return await message.reply("Please Enter 4 numbers.");
      }

      if (result.length > 4) {
        return await message.reply("Please Enter exactly 4 numbers!!");
      }

      if (new Set(result).size !== result.length) {
        return await message.reply("You have repeat numbers. Please enter 4 unique numbers.");
      }

      if (result.some(num => num < 1 || num > 75)) {
        return await message.reply("Accepted numbers are between 1 - 75.");
      }

      const currentTime = Date.now();
      const lastInputTime = userLastInputTime.get(event.senderID) || 0;
      const timeSinceLastInput = currentTime - lastInputTime;

      if (timeSinceLastInput < 120000) {
        const remainingTime = 120 - Math.floor(timeSinceLastInput / 1000);
        return await message.reply(`Lotto results are every 120s. Please wait ${remainingTime} seconds.`);
      }

      userLastInputTime.set(event.senderID, currentTime);

      const lottoNumbers = [];
      while (lottoNumbers.length < 4) {
        const randomNumber = Math.floor(Math.random() * 75) + 1;
        if (!lottoNumbers.includes(randomNumber)) {
          lottoNumbers.push(randomNumber);
        }
      }

      await usersData.subtractMoney(event.senderID, bet);

      const matchedNumbers = result.filter(number => lottoNumbers.includes(number));
      const winLossRecord = userWinLossData.get(event.senderID) || { wins: 0, losses: 0 };

      if (matchedNumbers.length > 0) {
        let prize = 0;
        let messageContent = "";

        if (matchedNumbers.length === 1) {
          prize = 1000000000000;
          messageContent = "🎉 𝐂𝐎𝐍𝐆𝐑𝐀𝐓𝐔𝐋𝐀𝐓𝐈𝐎𝐍𝐒! You've matched 1 number and won 1,000,000,000,000$! 🎉";
        } else if (matchedNumbers.length === 2) {
          prize = 10000000000000;
          messageContent = "🎉 𝐂𝐎𝐍𝐆𝐑𝐀𝐓𝐔𝐋𝐀𝐓𝐈𝐎𝐍𝐒! You've matched 2 numbers and won 10,000,000,000,000$! 🎉";
        } else if (matchedNumbers.length === 3) {
          prize = 100000000000000;
          messageContent = "🎉 𝐂𝐎𝐍𝐆𝐑𝐀𝐓𝐔𝐋𝐀𝐓𝐈𝐎𝐍𝐒! You've matched 3 numbers and won 100,000,000,000,000$! 🎉";
        } else if (matchedNumbers.length === 4) {
          prize = 10000000000000000;
          messageContent = "🎉 𝐂𝐎𝐍𝐆𝐑𝐀𝐓𝐔𝐋𝐀𝐓𝐈𝐎𝐍𝐒! You've matched all 4 numbers and won 100,000,000,000,000,000$! 🎉";
        }

        winLossRecord.wins += 1;
        await usersData.addMoney(event.senderID, prize);
        await message.reply(`${messageContent}\n━━━━━━━━━━━━━\nYour Numbers: ${result.join(" - ")}\n━━━━━━━━━━━━━\nLottery Result: ${lottoNumbers.join(" - ")}`);
      } else {
        winLossRecord.losses += 1;
        await message.reply(`You didn't match any numbers.\n━━━━━━━━━━━━━\nYour Numbers: ${result.join(" - ")}\n━━━━━━━━━━━━━\nLottery Result: ${lottoNumbers.join(" - ")}`);
      }

      userWinLossData.set(event.senderID, winLossRecord);

    } catch (error) {
      console.error("An error occurred in the lotto command:", error);
      await message.reply("Something went wrong. Please try again later.");
    }
  }
};
