const { CommandCategory } = require("../../commands.js")

let audio = new CommandCategory("audio", ":speaker: Audio", "Voice channel stuff.")

/*
 * TODO: Add support for Valve game sounds (https://github.com/PAC3-Server/chatsounds-valve-games, msgpack lib)
 * TODO: Allow overlapping chatsounds on top of another (https://www.npmjs.com/package/audio-mixer)
 * TODO: Play chatsounds one after another, try using the same folder for them (prioritize long chatsounds over short ones) (queueing)
 * TODO: Allow assigning channel to play anything said as a chatsound if it exists (#chatsounds)
 * TODO: Add modifiers somehow (manually use ffmpeg for this shite?)
 * TODO: Make volume command persist through voice channel connection
 * TODO: Allow to search chatsounds by their residing folder / category
 */

module.exports = audio
