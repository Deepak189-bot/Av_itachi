const config = {
 name: 'spin',
 aliases: ['s'],
 description: 'Spin the wheel and get rich with dignity!',
 guide: '{pn}',
 role: 0,
 author: "WaifuCat | AceGerome",
 timeRestriction: 600000
};

async function onStart({ message, event, usersData }) {
 try {
 const { senderID } = event;
 const userData = await usersData.get(senderID);

 const lastSpinTime = userData.data.lastSpinTime || 0;
 const currentTime = Date.now();

 if (currentTime - lastSpinTime < config.timeRestriction) {
 const timeLeft = ((config.timeRestriction - (currentTime - lastSpinTime)) / 1000).toFixed(1);
 return message.reply(`⏳ Please wait ${timeLeft} more seconds before spinning again.`);
 }

 const randomAmount = Math.floor(Math.random() * 100001);
 const jackpotChance = Math.random();
 const isJackpot = jackpotChance < 0.01;
 const winnings = isJackpot ? 1000000 : randomAmount;
 const jackpotMessage = isJackpot ? "🎉 JACKPOT! 🎉" : '';
 const responseMessage = `🎰 ${jackpotMessage} Congratulations! You won: $${winnings.toLocaleString()}. 💰`;

 message.reply(responseMessage);

 userData.data.lastSpinTime = currentTime;
 await usersData.set(senderID, {
 money: userData.money + winnings,
 data: userData.data
 });

 } catch (error) {
 console.error(error);
 message.reply("😔 An error occurred while spinning the wheel. Please try again later!");
 }
}

module.exports = {
 config,
 onStart
};