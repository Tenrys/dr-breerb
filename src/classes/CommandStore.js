const InvalidArgumentException = require("./InvalidArgumentException.js")
const Command = require("./Command.js")

module.exports = class CommandStore {
    constructor() {
        this._commands = {}
    }
    add(command) {
        if (!(command instanceof Command)) throw new InvalidArgumentException("command", "Command")
        this._commands[command.name] = command
    }
    remove(name) {
        if (typeof name !== "string") throw new InvalidArgumentException("name", "string")
        delete this._commands[name]
    }
    get(name) {
        if (name === undefined) return this._commands
        for (const _name in this._commands) {
            if (this._commands.hasOwnProperty(_name)) {
                const command = this._commands[_name]
                if (command.name === name || command.aliases.includes(name)) return command
            }
        }
    }
}