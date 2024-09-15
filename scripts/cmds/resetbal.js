const path = require('path');
const fs = require('fs');

module.exports = {
 config: {
 name: "resetbalance",
 version: "1.0",
 author: "Shikaki",
 countDown: 5,
 role: 2,
 shortDescription: {
 en: "Reset User Balance"
 },
 longDescription: {
 en: "Reset a user's balance to a new value (supports scientific notation)."
 },
 category: "owner",
 guide: {
 en: "Usage: .resetbalance <userUID> <newBalance>"
 },
 },

 onStart: async function ({ message, event, usersData, args }) {
 const { senderID } = event;

 if (args.length < 2) {
 return message.reply("Please provide a valid user UID and the new balance.");
 }

 const targetUID = args[0];
 const newBalanceInput = args[1]; // Keep the new balance input as a string

 // Parse the new balance from the input, supporting scientific notation
 const newBalance = parseFloat(newBalanceInput);

 if (isNaN(newBalance) || newBalance < 0) {
 return message.reply("Invalid new balance. Please provide a valid positive number or scientific notation.");
 }

 // Get the user's data
 const userData = await usersData.get(targetUID);

 if (!userData) {
 return message.reply("User not found in the database.");
 }

 // Update the user's balance
 userData.money = newBalance;

 // Ensure the balance is within the valid range
 if (userData.money > 1e104) {
 userData.money = 1e104; // Set it to the maximum allowed value
 }

 // Save the updated user data
 await usersData.set(targetUID, userData);

 message.reply(`Successfully updated ${targetUID}'s balance to ${userData.money.toExponential()}.`);
 }
};