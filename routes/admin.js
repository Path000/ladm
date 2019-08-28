const router = require('express').Router()
const log = require('../services/logger').log
const debug = require('../services/logger').debug
const uuid = require('uuid/v4') // random

const dbService = require('../services/db')
const db = dbService.getDB()
const ObjectID = dbService.ObjectID

const mail = require('../services/mailReader')

const createRSS = require('../services/createRSS')
const sendFile = require('../services/sendFileRemoteFTP')
const sendDir = require('../services/sendDirRemoteFTP')
const renameFile = require('../services/renameFileRemoteFTP')

const execCommand = require('../common/utils').execCommand
const writeFile = require('../common/utils').writeFile

const httpReq = require('../common/utils').httpReq

const tweet = require('../services/tweet')

const configFTP = {
	host: process.env.FTP_MEDIA_HOST,
	user: process.env.FTP_MEDIA_USER,
	password: process.env.FTP_MEDIA_PASS,
	secure: true
}

router.use((req, res, next) => {
	if (!req.session.auth ||
		req.session.auth == false ||
		req.session.admin == false) {

		return res.status(403).send('Le loup est dans la bergerie !')
	}
	next()
})

router.get('/backupDB', async (req, res) => {
	try {
		await execCommand(`mongodump --db=ladmdb --out=${process.env.DB_DUMP_DIR}`)

		const param = {}
		param.localPath = process.env.DB_DUMP_DIR
		param.remotePath = process.env.DB_DUMP_REMOTE_DIR
		param.configFTP = {
			host: process.env.FTP_MEDIA_HOST,
			user: process.env.FTP_MEDIA_USER,
			password: process.env.FTP_MEDIA_PASS,
			secure: true
		}
		await sendDir(param)

		res.send({
			ok: true
		})

	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}

})

router.get('/genRSS', async (req, res) => {

	try {

		const cursor = await db.collection('episodes').find({
			status: 'PUBLISHED'
		}).sort({
			pubDate: -1
		})

		const RSSFile = await createRSS(cursor)

		const param = {}
		param.localFile = RSSFile
		param.remoteFile = '/rss/cc-by-nc-nd.xml'
		param.rejectIfExists = false
		param.configFTP = configFTP

		await sendFile(param)

		res.send({
			ok: true
		})

	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}

})

router.delete('/soumission/:id', async (req, res) => {

	const soumissionId = req.params.id

	if (!soumissionId || soumissionId == '') {
		res.status(404).send('Sorry cant find that!')
		return
	}

	const soumissions = db.collection('soumissions')
	try {
		const soumission = await soumissions.findOne({
			_id: ObjectID(soumissionId)
		})

		if (!soumission) {
			res.status(404).send('Sorry cant find that!')
			return
		}

		const token = uuid()
		const soumissionTrashFilename = `${process.env.TRASH_DIR}/${token}-soumission.json`
		const mediaTrashFilename = `${process.env.TRASH_DIR}/${token}-media`
		const mediaFilename = `${process.env.UPLOAD_DIR}/${soumission.fileName}`

		await writeFile(soumissionTrashFilename, JSON.stringify(soumission, null, '    '))

		await execCommand(`mv ${mediaFilename} ${mediaTrashFilename}`)

		await soumissions.deleteOne({
			_id: ObjectID(soumissionId)
		})

		res.send({
			ok: true
		})

	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

router.put('/publish/:id', async (req, res) => {

	const soumissionId = req.params.id

	if (!soumissionId || soumissionId == '') {
		res.status(404).send('Sorry cant find that!')
		return
	}

	const data = req.body

	await db.collection('soumissions').updateOne({
		_id: ObjectID(soumissionId)
	}, {
		$set: {
			status: 'TO_PUBLISH',
			modifiedValues: {
				episode: data.episode,
				author: data.author,
				title: data.title,
				description: data.description
			}
		}
	})

	await httpReq({
		hostname: '127.0.0.1',
		port: process.env.PORT_WORKER,
		path: '/wakeup',
		method: 'GET'
	})

	res.send({
		ok: true
	})

})

router.get('/soumission/id/:id', async (req, res) => {

	const soumissionId = req.params.id

	if (!soumissionId || soumissionId == '') {
		res.status(404).send('Sorry cant find that!')
		return
	}

	const soumissions = db.collection('soumissions')
	try {
		const item = await soumissions.findOne({
			_id: ObjectID(soumissionId)
		})
		if (item) {
			res.send(item)
		} else {
			res.status(404).send('Sorry cant find that!')
		}
	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

router.get('/soumission/list/', async (req, res) => {

	try {
		const soumissions = db.collection('soumissions')

		res.send(await soumissions.find({}).sort({
			postDate: -1
		}).toArray())

	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}

})

router.get('/checkMail', async (req, res) => {

	try {

		const soumissions = await mail.createSoumissionsFromMail()

		for (const soumission of soumissions) {

			const soumissionEntity = dbService.getSoumissionEntity()
			soumissionEntity.postDate = (new Date()).toISOString()
			soumissionEntity.status = 'POSTED'
			soumissionEntity.origin = 'MAIL'
			soumissionEntity.title = soumission.titre
			soumissionEntity.description = soumission.body
			soumissionEntity.author = ''
			soumissionEntity.contact = soumission.contact
			soumissionEntity.fileName = soumission.fileName
			soumissionEntity.originalFileName = soumission.originalFileName
			soumissionEntity.size = soumission.size
			soumissionEntity.mimetype = soumission.ext
			await db.collection('soumissions').insertOne(soumissionEntity)
		}

		res.status(200).send({
			nb: soumissions.length
		})

	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

router.get('/episode/:episode', async (req, res) => {

	if (!req.params.episode || req.params.episode == '') {
		res.status(404).send('Sorry cant find that!')
		return
	}

	const episodes = db.collection('episodes')
	try {
		const item = await episodes.findOne({
			episode: req.params.episode
		})
		if (item) {
			res.send(item)
		} else {
			res.status(404).send('Sorry cant find that!')
		}
	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

router.put('/episode/:episode', async (req, res) => {

	try {
		const data = req.body
		const episodes = db.collection('episodes')
		await episodes.updateOne({
			episode: req.params.episode
		}, {
			$set: {
				author: data.author,
				title: data.title,
				description: data.description
			}
		})
		res.send({
			ok: true
		})
	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

router.delete('/episode/:episode', async (req, res) => {

	if (!req.params.episode || req.params.episode == '') {
		res.status(404).send({
			ok: false,
			msg: 'Sorry cant find that!'
		})
		return
	}

	const episodes = db.collection('episodes')
	try {

		const episode = await episodes.findOne({
			episode: req.params.episode,
			status: 'HIDDEN'
		})

		if (!episode) {
			res.status(404).send({
				ok: false,
				msg: 'Sorry cant find that!'
			})
			return
		}

		const token = uuid()
		const episodeTrashFilename = `${process.env.TRASH_DIR}/${token}-episode-${episode.episode}.json`

		await writeFile(episodeTrashFilename, JSON.stringify(episode, null, '    '))

		await renameFile({
			remotePath: `/mp3/${episode.mediaFileName}`,
			newRemotePAth: `/poubelle/${token}-media-${episode.mediaFileName}`,
			configFTP: configFTP
		})

		await episodes.deleteOne({
			episode: req.params.episode,
			status: 'HIDDEN'
		})

		res.send({
			ok: true
		})

	} catch (e) {
		log(e)
		res.status(500).send({
			ok: false,
			msg: 'Sorry we have a pb!'
		})
	}
})

router.get('/hideEpisode/:episode', async (req, res) => {

	if (!req.params.episode || req.params.episode == '') {
		res.status(404).send('Sorry cant find that!')
		return
	}

	const episodes = db.collection('episodes')
	try {
		await episodes.updateOne({
			episode: req.params.episode
		}, {
			$set: {
				status: 'HIDDEN'
			}
		})
		res.send({
			ok: true
		})
	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

router.get('/showEpisode/:episode', async (req, res) => {

	if (!req.params.episode || req.params.episode == '') {
		res.status(404).send('Sorry cant find that!')
		return
	}

	const episodes = db.collection('episodes')
	try {
		await episodes.updateOne({
			episode: req.params.episode
		}, {
			$set: {
				status: 'PUBLISHED'
			}
		})

		const episode = await episodes.findOne({
			episode: req.params.episode
		})

		await tweet(episode.episode, episode.title, episode.author, `https://lavis-des-moutons.fr/?episode=${episode.episode}`)

		res.send({
			ok: true
		})
	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

router.get('/', (req, res) => {

	req.session.views++
	res.setHeader('Content-Type', 'text/html')
	res.write('<p>Auth: ' + req.session.auth + '</p>')
	res.write('<p>Admin: ' + req.session.admin + '</p>')
	res.end()

})

module.exports = router;