module.exports = {
  config: {
    name: "top",
    version: "1.1",
    author: "AceGerome",
    role: 0,
    description: {
      en: "Displays the top 10 richest users in the group."
    },
    category: "game",
    guide: {
      en: "{pn} - Displays the top 10 richest users in the group."
    }
  },

  onStart: async function ({ message, usersData }) {
    try {
      const allUsers = await usersData.getAll();
      
      if (allUsers.length === 0) {
        return message.reply("No users found.");
      }

      const topUsers = allUsers.sort((a, b) => b.money - a.money).slice(0, 10);
      
      const topUsersList = topUsers.map((user, index) => `${index + 1}. ${user.name || "Unknown User"}: $${user.money.toLocaleString()}`);

      const messageText = `Top 10 Richest Users:\n${topUsersList.join('\n')}`;
      
      // Send the message
      message.reply(messageText);

    } catch (error) {
      console.error(error);
      message.reply("An error occurred while retrieving the top 10 richest users.");
    }
  }
};
