const chalk = require("chalk")

let types = {
	log: {
		callback: console.log,
		color1: chalk.bold.cyan,
		color2: chalk.white
	},
	warn: {
		callback: console.warn,
		color1: chalk.bold.yellow,
		color2: chalk.white
	},
	error: {
		callback: console.error,
		color1: chalk.bold.red,
		color2: chalk.white
	}
}
let log = function(type, cat, msg, ...args) {
	let logger = types[type]
	if (logger) {
		if (msg) {
			logger.callback(logger.color1(`[${cat}]`), logger.color2(msg), ...args)
		} else {
			logger.callback(logger.color2(cat))
		}
	}
}
module.exports = class Logger {
	static log(cat, msg) {
		log("log", cat, msg)
	}
	static warn(cat, msg) {
		log("warn", cat, msg)
	}
	static error(cat, msg) {
		log("error", cat, msg)
	}
}

