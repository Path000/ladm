require('./services/env')

process.title = 'BATCH LADM'

const log = require('./services/logger').log
log(`Starting ${process.title}`)

const debug = require('./services/logger').debug
debug('Debug activé')

const createMediaFile = require('./services/createMediaFile')
const sendFile = require('./services/sendFileRemoteFTP')

const mongo = require('./services/db')
const ObjectID = mongo.ObjectID

let db = undefined

const uuid = require('uuid/v4') // random

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

const publish = async (soumission) => {

	const data = soumission.modifiedValues

	const episodeEntity = mongo.getEpisodeEntity()

	const mediaFileName = `LADMEp${data.episode}.mp3`

	const {
		duration,
		size,
		mediaFile
	} = await createMediaFile({
		sourceFileName: soumission.fileName,
		destFileName: mediaFileName,
		author: data.author,
		title: data.title,
		episode: data.episode
	})

	const param = {}
	param.localFile = mediaFile
	param.remoteFile = `/mp3/${mediaFileName}`
	param.rejectIfExists = true
	param.removeAfter = true
	param.configFTP = {
		host: process.env.FTP_MEDIA_HOST,
		user: process.env.FTP_MEDIA_USER,
		password: process.env.FTP_MEDIA_PASS,
		secure: true
	}

	await sendFile(param)

	episodeEntity.status = 'HIDDEN' // PUBLISHED | HIDDEN

	episodeEntity.episode = data.episode
	episodeEntity.title = data.title
	episodeEntity.description = data.description
	episodeEntity.author = data.author

	episodeEntity.imageUrl = undefined

	episodeEntity.guid = uuid()
	episodeEntity.pubDate = soumission.postDate
	episodeEntity.mediaFileName = mediaFileName
	episodeEntity.mediaSize = size
	episodeEntity.mediaDuration = duration
	episodeEntity.mediaType = 'audio/mpeg'
	episodeEntity.explicit = 'yes'
	episodeEntity.creator = 'Path'
	episodeEntity.downloadTotal = 0

	await db.collection('episodes').insertOne(episodeEntity)

	await db.collection('soumissions').updateOne({
		_id: ObjectID(soumission._id)
	}, {
		$set: {
			status: 'PUBLISHED'
		}
	})

	log(`Soumission ${soumission.modifiedValues.episode} published`)
}

const STATE_IDLE = 0
const STATE_RUNNING = 1
let state = STATE_IDLE

const findSoumissionToPublish = async () => {

	state = STATE_RUNNING

	try {

		const soumission = await db.collection('soumissions').findOne({
			status: 'TO_PUBLISH'
		})

		if (soumission) {

			log(`Found soumission ${soumission.modifiedValues.episode} to publish`)
			await publish(soumission)

			setTimeout(findSoumissionToPublish, 0)

		} else {

			state = STATE_IDLE

			log('Worker is in idle mode')
		}

	} catch (e) {
		log(e)
		state = STATE_IDLE
	}
}

const startServer = async () => {
	try {

		await mongo.connect()
		log('Connected successfully to MongoDB')

		db = mongo.getDB()

		const app = express()

		app.get('/wakeup', (req, res) => {

			if (state == STATE_IDLE) {

				log('Worker waked up')
				findSoumissionToPublish()
			}
			res.send({})
		})

		server = app.listen(process.env.PORT_WORKER, '127.0.0.1', 512, () => {

			log(`${process.title} app is listening localhost on port ${process.env.PORT_WORKER}!`)
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