const CommandCategory = require.main.require("./src/classes/CommandCategory.js")

let guild = new CommandCategory("guild", ":two_men_holding_hands: Server", "Select the prefix this bot will use for your server, setup RSS feeds in channels of your choosing, disable commands, and more.")

module.exports = guild
