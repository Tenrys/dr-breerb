module.exports = (category, bot) => {
    category.addCommand("pick", function(msg, line, ...str) { // This is stupidly easy but Kabus wanted it
        if (!str) { return }
        if (str.length < 1) { return }

        msg.reply(str.random())
    }, { help: "Picks a random argument from the ones you provide." })
}
