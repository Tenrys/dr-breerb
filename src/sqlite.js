const logger = require("./logging.js")
logger.working("sqlite", "Loading...")

const bot = require("./index.js")
const sequelize = require("sequelize")
const fs = require("fs")

bot.db = new sequelize({
    database: "dr-breerb",
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
})

