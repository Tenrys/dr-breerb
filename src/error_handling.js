const logger = require("@utils/classes/Logger.js")

const fs = require("fs")

module.exports = bot => {
    process.on("uncaughtException", err => {
        logger.error("critical", `JavaScript unhandled exception: ${err.stack || err}`)

        fs.writeFileSync("restart_info.json", JSON.stringify({
            type: "unhandled_exception",
            error: err.message,
            stack: err.stack
        }))

        logger.error("critical", "Quitting to avoid unforeseen consequences.")
        process.exit()
    })
}
