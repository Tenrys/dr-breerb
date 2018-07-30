const InvalidArgumentException = require("classes/InvalidArgumentException.js")
const Command = require("./Command.js")

module.exports = class CommandStore {
    add(cmd) {
        if (!(cmd instanceof Command)) throw new InvalidArgumentException("cmd", "Command")
        this[cmd.name] = cmd
    }
    remove(name) {
        if (typeof name !== "string") throw new InvalidArgumentException("name", "string")
        delete this[name]
    }
    get(name) {
        if (name === undefined) return this
        for (const _name in this) {
            if (this.hasOwnProperty(_name)) {
                const cmd = this[_name]
                if (cmd.name === name || cmd.aliases.includes(name)) return cmd
            }
        }
    }
}