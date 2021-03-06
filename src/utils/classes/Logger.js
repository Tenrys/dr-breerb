
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
    let y = date.getUTCFullYear(),
        M = padNum(date.getUTCMonth() + 1, 2),
        d = padNum(date.getUTCDate(), 2),
        h = padNum(date.getUTCHours(), 2),
        m = padNum(date.getUTCMinutes(), 2),
        s = padNum(date.getUTCSeconds(), 2)
        ms = padNum(date.getUTCMilliseconds(), 2)

    let formatted = `${y}-${M}-${d} ${h}:${m}:${s}.${ms}`
    return formatted
}

const chalk = require("chalk")

class Logger {}

function logMethod(name, callback, color1, color2=chalk.white) {
    Logger[name] = (cat, msg, ...args) => {
        if (msg) return callback(getCurrentTime(), color1(`[${cat}]:`), color2(msg), ...args)
        else return callback(getCurrentTime(), color2(cat))
    }
}
logMethod("log", console.log, chalk.cyan)
logMethod("warn", console.warn, chalk.yellow)
logMethod("error", console.error, chalk.red)
logMethod("success", console.log, chalk.green)
logMethod("working", console.log, chalk.magenta)

Logger.detail = function(name, details) {
    this.log(` ${chalk.magentaBright('*')} ${name}: ${details}`)
}

module.exports = Logger
