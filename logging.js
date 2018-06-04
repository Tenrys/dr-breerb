
/**
 * Adds a certain amount of leading zeroes to a string.
 *
 */
function padNum(input, width) {
	return ("0".repeat(width) + input).slice(-width)
}

/**
 * Returns the current time in my prefered format.
 */
function getCurrentTime() {
	let date = new Date()
	let y = date.getFullYear(),
		M = padNum(date.getMonth(), 2),
		d = padNum(date.getDay(), 2),
		h = padNum(date.getHours(), 2),
		m = padNum(date.getMinutes(), 2),
		s = padNum(date.getSeconds(), 2)
		ms = padNum(date.getMilliseconds(), 2)

	let formatted = `${y}-${M}-${d} ${h}:${m}:${s}.${ms}`
	return formatted
}

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

/**
 * Returns a function that will use options from a named logger, if it exists, to log data.
 */
function makeLogger(name) { // TODO: Actually log to files?
	return function(cat, msg, ...args) {
		let logger = loggers[name]
		if (logger && logger.callback && logger.color1 && logger.color2) {
			if (msg) {
				logger.callback(getCurrentTime(), logger.color1(`[${cat}]:`), logger.color2(msg), ...args)
			} else {
				logger.callback(getCurrentTime(), logger.color2(cat))
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

