const fs = require("fs")
const path = require("path")

const sequelize = require("sequelize")

module.exports = bot => {
    bot.logger.working("sqlite", "Initializing...")

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
        if (fs.statSync(filePath).isFile() && path.extname(filePath) === ".js") {
            let model = bot.db.sequelize.import(filePath)
            bot.db[model.name] = model
        }
    })

    bot.logger.success("sqlite", "Ready.")
}
