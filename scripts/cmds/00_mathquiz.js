module.exports = {
  config: {
    name: "mathquiz",
    aliases: ["mq"], 
    version: "1.0.0",
    author: "Rue / AceGerome",
    countDown: 10,
    role: 0,
    description: {
        en: "Answer a challenging math question to win money."
    }, 
    category: "Game", 
    guide: {
      en: "To use this command, type {pn} - To Play."
    } 
  },
  
  langs: {
      en: {
          showAnswer: "Wrong! ❌ The correct answer is %1. Better luck next time! 🍀 Try again!", 
          correct: "🎉 Congratulations! You won \n₱%1! 💵", 
          mathQuiz: "%1\n━━━━━━━━━━━━━━━\nTime Limit: %2 seconds. ⏱\nReply this message to answer!"
      }
  }, 

  onReply: async function({ event, message, Reply, getLang, usersData }) {
    if (event.senderID !== Reply.author || Reply.type !== "reply") return;
    
    const prize = Reply.userBet * 2;
    const userReply = event.body.toLowerCase();
    const userData = await usersData.get(event.senderID);
    const correctAnswer = `${Reply.correctAnswer}`;
    if (isNaN(userReply)) {
      message.reply("Please enter a valid number.");
      return;
    } 
    
    if (userReply === correctAnswer.toString()) {
        await usersData.set(event.senderID, {
		     	money: userData.money + prize,
	     		data: userData.data
	     	});
	     	message.reply(getLang("correct", prize))
	     	message.unsend(Reply.messageID);
    } else {
        message.reply(getLang("showAnswer", correctAnswer));
        message.unsend(Reply.messageID);
    }
  },
    
  onStart: async function({ message, event, getLang, usersData, args }) {
    const { threadID, messageID } = event;
    const userBet = parseInt(args[0]);
    const timeLimit = 25; // 25 Seconds(s)
    
    if (isNaN(userBet) || userBet <= 0) {
      return message.reply("Please enter a valid bet amount.");
    }
    
    if (userBet > 5000000) {
      return message.reply("The maximum bet is 50,000,00$.");
    }
    
    const userBalance = await usersData.getMoney(event.senderID);
    
    if (userBalance < userBet) {
      return message.reply("You don't have enough money to place this bet.\nYour Balance: " + userBalance);
    }
    
    await usersData.subtractMoney(event.senderID, userBet);

    try {
      const [question, correctAnswer] = generateMathQuestion();
      
      message.reply(getLang("mathQuiz", question, timeLimit), async (error, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          type: "reply",
          commandName: this.config.name,
          author: event.senderID,
          messageID: info.messageID,
          correctAnswer,
          userBet, 
        });
        
        setTimeout(() => {
            const replyData = global.GoatBot.onReply.get(info.messageID);
            if (replyData) {
              const { messageID } = replyData;
              global.GoatBot.onReply.delete(messageID);
              message.unsend(messageID);
            }
          }, timeLimit * 1000); //60 sec deleteee
      });
    } catch (error) {
      console.error("Error Occurred:", error);
      message.reply("[ERR]:", error.message);
    }
  }
};

function generateMathQuestion() {
  const min = 1;
  const max = 100;  
  const num1 = getRandomNumber(min, max);
  const num2 = getRandomNumber(min, max);
  const randomOperator = getRandomOperator();
  
  const question = `What is ${num1} ${randomOperator} ${num2}?`;

  const correctAnswer = eval(`${num1} ${randomOperator} ${num2}`);

  return [question, correctAnswer];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}


function getRandomOperator() {
  const operators = ['+', '-', '*', '/'];
  const randomIndex = Math.floor(Math.random() * operators.length);
  return operators[randomIndex];
}
 
