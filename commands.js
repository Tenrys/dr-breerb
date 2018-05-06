
const fs = require("fs")

let commands = {}
let commandsSrc = fs.readdirSync("./commands")
commandsSrc.forEach(function(file) {
	let category = require("./commands/" + file)
	commands[category.name] = category
})

module.exports = commands

