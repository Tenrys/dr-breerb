const InvalidArgumentException = require("./InvalidArgumentException.js")
const Command = require("./Command.js")

/**
 * Stores Commands, used for sorting by their name and description.
 */
module.exports = class CommandCategory {
    /**
     * @param {string} name The CommandCategory's internal name.
     * @param {string} [printName=Unnamed] The command category's display name.
     * @param {string} [desc=No information provided.] The command category's description.
     */
    constructor(name, printName="Unnamed", desc="No information provided.") {
        this._commands = []
        this.description = desc
        this.name = name
        this.printName = printName
    }

    /**
     * Adds a command to the CommandCategory.
     * @param {string} name The command's name.
     * @param {function} callback The command's callback.
     * @param {object} [options] Additional options.
     */
    addCommand(name, callback, options) {
        let command = new Command(name, callback, options)
        command.category = this
        this._commands.push(command)
        return command
    }

    /**
     * The list of commands in the CommandCategory.
     */
    get commands() {
        let commands = this._commands
        commands.__proto__.get = name => {
            if (name === undefined) {
                return commands
            }
            return commands.filter(x => {
                return x.name == name || x.aliases.includes(name)
            })[0]
        }
        return commands
    }
    set commands(a) {
        if (typeof a !== "object") { throw new InvalidArgumentException("aliases", "object") }

        this._commands = a
    }
}
