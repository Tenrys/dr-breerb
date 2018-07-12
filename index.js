// Convenience functions
Object.defineProperty(Array.prototype, "random", {
    value() {
        return this[Math.floor(Math.random() * this.length)]
    }
})

const logger = require("./src/classes/Logger.js")

logger.working("status", "Starting...")

require("./src/error_handling.js")
let bot = require("./src")(require("./config.json"))
bot.login()

logger.success("status", "Started.")
