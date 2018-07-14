// Convenience functions
Object.defineProperty(Array.prototype, "random", {
    value() {
        return this[Math.floor(Math.random() * this.length)]
    }
})

const logger = require("./src/classes/Logger.js")

logger.working("status", "Starting...")

require("./src/error_handling.js")
let config = require("./config.json")
if (typeof config.ownerId === "string") config.ownerId = [ config.ownerId ]
let bot = require("./src")(config)
bot.login()

logger.success("status", "Started.")
