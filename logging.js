const chalk = require("chalk")

let loggers = {
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
	},
	success: {
		callback: console.log,
		color1: chalk.bold.green,
		color2: chalk.white
	}
}
function makeLogger(name) {
	return function(cat, msg, ...args) {
		let logger = loggers[name]
		if (logger && logger.callback && logger.color1 && logger.color2) {
			if (msg) {
				logger.callback(logger.color1(`[${cat}]`), logger.color2(msg), ...args)
			} else {
				logger.callback(logger.color2(cat))
			}
		} else {
			throw new Error("invalid logger")
		}
	}
}

class Logger {} // Lol this is stupid
Logger.log = makeLogger("log")
Logger.warn = makeLogger("warn")
Logger.error = makeLogger("error")
Logger.success = makeLogger("success")
module.exports = Logger

