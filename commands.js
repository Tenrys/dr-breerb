
const fs = require("fs")

// TODO: Command object so we don't have to fucking make a new object manually every time

let commands = {}
let commandsSrc = fs.readdirSync("./commands")
commandsSrc.forEach(function(file) {
	let category = require("./commands/" + file)
	commands[category.name] = category
})

module.exports = commands

