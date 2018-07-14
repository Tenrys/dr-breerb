module.exports = (category, bot) => {
    category.addCommand("ping", (msg, line) => {
        msg.reply("pong!")
    }, { help: "Pings the bot" })
}