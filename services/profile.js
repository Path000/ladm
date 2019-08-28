const {
	EventEmitter
} = require('events')

const profiles = new EventEmitter();

profiles.on('responseEnded', ({
	method,
	url,
	status,
	elapsedMS
}) => {
	console.log(`[${elapsedMS}ms] ${method} ${url} ${status}`)
});

const middleWare = (req, res, next) => {
	const start = Date.now()
	res.once('finish', () => {
		const duration = Date.now() - start
		//if (duration > 1000) {
		profiles.emit('responseEnded', {
			method: req.method,
			url: req.originalUrl,
			status: res.statusCode,
			elapsedMS: duration
		})
		//}
	})
	next()
}

module.exports = middleWare;