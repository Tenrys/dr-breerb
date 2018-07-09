module.exports = (category, bot) => {
    category.addCommand("feed", function(msg, line, action, ...str) {
        action = action.toLowerCase()
    }, {
        help: "Perform actions related to RSS feeds.",
        permissions: {
            user: [ "MANAGE_GUILD" ]
        },
        guildOnly: true,
    })
}
