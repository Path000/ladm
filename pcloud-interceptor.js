require('./services/env')

process.title = 'PCLOUD INTERCEPTOR LADM'

const log = require('./services/logger').log
log(`Starting ${process.title}`)

const debug = require('./services/logger').debug
debug('Debug activé')

const mongo = require('./services/db')
const express = require('express')
const moment = require('moment')

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

		if (process.env.REQ_PROFILE == 'true') {
			app.use(require('./services/profile'))
		}

		app.use(require('helmet')())

		const db = mongo.getDB()
		app.all('/:filename', async (req, res) => {

			if (!req.params.filename || req.params.filename == '') {
				res.status(404).send('Sorry cant find that!')
				return
			}

			try {

				const episodes = db.collection('episodes')
				const counter = db.collection('counter')

				// inc episode
				await episodes.updateOne({
					mediaFileName: req.params.filename
				}, {
					$inc: {
						downloadTotal: 1
					}
				})

				await counter.updateOne({
					monthYYYYMM: moment().format('YYYYMM')
				}, {
					$inc: {
						downloadTotal: 1 //NumberInt(1)
					}
				}, {
					upsert: true
				})

				res.redirect(`${process.env.URL_BASE_MEDIA}/${req.params.filename}`)



			} catch (e) {

				log(e)
				res.status(500).send('Sorry we have a pb!')
			}
		})

		app.use((req, res) => {
			res.status(404).send('Sorry cant find that!')
		})

		server = app.listen(process.env.PORT_PCLOUD, '127.0.0.1', 512, () => {

			log(`${process.title} app is listening localhost on port ${process.env.PORT_PCLOUD}!`)
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