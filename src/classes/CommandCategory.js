const InvalidArgumentException = require("./InvalidArgumentException.js")
const CommandStore = require("./CommandStore.js")
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
        this.commands = new CommandStore()
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
        this.commands.add(command)
        return command
    }
}
