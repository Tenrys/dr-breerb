const CommandCategory = require.main.require("./src/classes/CommandCategory.js")

let utility = new CommandCategory("utility", ":wrench: Utility", "Commands that may or may not be useful..!")

module.exports = utility
