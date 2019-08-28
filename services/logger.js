const doDebug = (process.env.DEBUG == 'true') ? true : false

module.exports.log = console.log

module.exports.debug = (msg) => {
	if (doDebug) console.log('[DEBUG]', msg)
}
