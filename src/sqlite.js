const bot = require("./index.js")
bot.logger.working("sqlite", "Loading...")

const sequelize = require("sequelize")
const fs = require("fs")
const path = require("path")

bot.db = {
    sequelize: new sequelize({
        database: "dr-breerb",
        dialect: "sqlite",
        storage: "./database.sqlite",
        logging: false
    }),
    Sequelize: sequelize
}

fs.readdirSync(path.join(__dirname, "models")).forEach(file => {
    let filePath = path.join(__dirname, "models", file)
    if (fs.statSync(filePath).isFile() && path.extname(filePath) == ".js") {
        let model = bot.db.sequelize.import(filePath)
        bot.db[model.name] = model
    }
})
