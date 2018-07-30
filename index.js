// Convenience functions
Array.prototype.random = function() { return this[Math.floor(Math.random() * this.length)] }

const logger = require("./src/node_modules/classes/Logger.js")

logger.working("status", "Starting...")

let config = require("./config.json")
if (typeof config.ownerId === "string") config.ownerId = [ config.ownerId ]
let bot = new (require("./src"))(config)
bot.login()

logger.success("status", "Started.")
