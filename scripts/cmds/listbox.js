module.exports = {
  config: {
    name: "listbox",
    aliases: [],
    version: "1.0.0",
    author: "Unknown | AceGerome",
    countDown: 15,
    role: 2,
    shortDescription: {
      vi: "",
      en: "List thread bot participated"
    },
    longDescription: {
      vi: "",
      en: "Listing the thread in we're the bot participated."
    },
    category: "owner",
    guide: {
      en: "   {pn}"
    } 
  },
  
  onStart: async function({ api, event, message, commandName }) {
  var inbox = await api.getThreadList(100, null, ['INBOX']);
  let list = [...inbox].filter(group => group.isSubscribed && group.isGroup);

  var listthread = [];

  for (var groupInfo of list) {
    let data = (await api.getThreadInfo(groupInfo.threadID));

    listthread.push({
      id: groupInfo.threadID,
      name: groupInfo.name,
      sotv: data.userInfo.length,
    });

  } //for

  var listbox = listthread.sort((a, b) => {
    if (a.sotv > b.sotv) return -1;
    if (a.sotv < b.sotv) return 1;
  });

  let msg = '',
    i = 1;
  var groupid = [];
  for (var group of listbox) {
    msg += `${i++}. ${group.name}\n» TID: ${group.id}\n» Member: ${group.sotv}\n`;
    groupid.push(group.id);
  }

  message.reply(msg + '\nReply "out" or "join" the number of order to out that thread!', (e, info) =>
    global.GoatBot.onReply.set(info.messageID, {
      commandName: this.config.name,
      author: event.senderID,
      messageID: info.messageID,
      groupid,
      type: 'reply'
    })
  );
}, 

  onReply: async function({ api, event, args, threadsData, Reply, message }) {

  if (parseInt(event.senderID) !== parseInt(Reply.author)) return;

  var arg = event.body.split(" ");
  var idgr = Reply.groupid[arg[1] - 1];


  switch (Reply.type) {

    case "reply":
      {
        if (arg[0] == "out" || arg[0] == "Out") {
          api.removeUserFromGroup(`${api.getCurrentUserID()}`, idgr);
          message.reply("Out the thread with id: " + idgr + "\nName: " + (await threadsData.get(idgr)).threadName);
          break;
        }
       if (arg[0] == "join" || arg[0] == "Join") {
          api.addUserToGroup(event.senderID, idgr);
          message.reply("Added you in the approval of thread with ID: " + idgr + "\nName: " + (await threadsData.get(idgr)).threadName);
          break;
        }

      }
    }
  }
};
