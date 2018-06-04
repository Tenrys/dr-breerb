module.exports = (category, bot) => {
    category.addCommand("ping", function(msg, line, ...args) {
        msg.reply("pong!")
    }, { help: "Pings the bot" })
}