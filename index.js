require('./services/env')

process.title = 'SITE LADM'

const log = require('./services/logger').log
log(`Starting ${process.title}`)

const debug = require('./services/logger').debug
debug('Debug activé')

const mongo = require('./services/db')

const express = require('express')

let server = undefined

const closeAll = () => {

	const mongoClient = mongo.getClient()
	if (mongoClient != undefined) mongoClient.close()

	if (server != undefined) server.close(() => {
		log('Http server closed.')
		process.exit(0)
	})

}

process.on('SIGINT', () => {
	log('SIGINT signal received.')
	closeAll()
})

process.on('SIGTERM', () => {
	log('SIGTERM signal received.')
	closeAll()
})

const startServer = async () => {
	try {

		await mongo.connect()
		log('Connected successfully to MongoDB')

		const app = express()
		app.set('trust proxy', 1)


		if (process.env.REQ_PROFILE == 'true') {
			app.use(require('./services/profile'))
		}

		app.use(require('helmet')())

		app.use(require('./services/session'))

		app.use(express.json()) // Body parser for content type : application/json

		app.use('/episode', require('./routes/episodes'))
		app.use('/admin', require('./routes/admin'))
		app.use('/user', require('./routes/user'))

		app.use((req, res) => {
			res.status(404).send('Sorry cant find that!')
		})

		server = app.listen(process.env.PORT_SITE, '127.0.0.1', 512, () => {

			log(`${process.title} app is listening localhost on port ${process.env.PORT_SITE}!`)
		})

		server.on('connection', (socket) => {
			socket.setTimeout(process.env.KEEP_ALIVE * 1000)
		})

	} catch (e) {
		log(e)
		closeAll()
	}
}

startServer()