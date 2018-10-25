# dr-breerb

## Installation

Requires [NodeJS](http://nodejs.org/) v8/v10 and [npm](http://npmjs.com/).

1. Clone or [download](https://github.com/Tenrys/dr-breerb/archive/master.zip) this repository.
2. Open a command prompt inside of the directory you cloned or extracted.
3. Run `npm i` to install the bot's dependencies.
    - Optionally, run `npm i discordapp/erlpack` *for significantly faster WebSocket data (de)serialisation*. This requires `node-gyp`, [here](https://github.com/nodejs/node-gyp#on-windows)'s how to install its requirements properly.
4. Run `node index.js` or `npm start` to start the bot.
    - `npm start` uses `start.sh` which is a bash script, expected to run on Linux. Don't expect it to work with Windows... unless you know what you're doing.

## Configuration

See `config.json.example`, and create your own `config.json`. You need to configure 3 fields using the JSON format:

- `token`: The Discord token string for your bot account. Get one from https://discordapp.com/developers/applications/.
- `log`: Whether or not to print stuff console. Boolean defaulting to `true`.
- `ownerId`: A string or array of Discord user account IDs that will be able to run critical commands on the bot such as `eval`, `exec`, ...

---

I'll fill out more information later.

