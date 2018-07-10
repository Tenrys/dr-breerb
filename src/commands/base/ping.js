module.exports = (category, bot) => {
    category.addCommand("ping", (msg, line, ...args) => {
        msg.reply("pong!")
    }, { help: "Pings the bot" })
}