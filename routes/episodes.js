const router = require('express').Router()
const mailer = require('../services/mailSender')
const upload = require('../services/upload')

const log = require('../services/logger').log
const debug = require('../services/logger').debug

const dbService = require('../services/db')
const db = dbService.getDB()

const splitLinesToArray = require('../common/utils').splitLinesToArray

// TODO:  des projections ou des DTO

router.post('/', async (req, res) => {

	try {

		await upload.parse(req, res)

		debug(req.body)
		debug(req.file)

		const soumissionEntity = dbService.getSoumissionEntity()
		soumissionEntity.postDate = (new Date()).toISOString()
		soumissionEntity.status = 'POSTED'
		soumissionEntity.origin = 'FORM'
		soumissionEntity.title = req.body.titre
		soumissionEntity.description = splitLinesToArray(req.body.desc)
		soumissionEntity.author = req.body.pseudo
		soumissionEntity.contact = req.body.contact
		soumissionEntity.fileName = req.file.filename
		soumissionEntity.originalFileName = req.file.originalname
		soumissionEntity.size = req.file.size
		soumissionEntity.mimetype = req.file.mimetype
		await db.collection('soumissions').insertOne(soumissionEntity)

		const url = `${process.env.URL_BASE}/`
		await mailer.send({
			to: process.env.EMAIL_NOTIF,
			subject: 'LADM Nouvelle participation !!',
			text: url,
			html: `<a href="${url}">${url}</a>`
		})

		res.send({
			ok: 'ok'
		})

	} catch (e) {
		log(e)
		if (!res.headersSent) {
			res.status(500).send('Sorry we have a pb!')
		}
	}

})

router.get('/id/:episode', async (req, res) => {

	if (!req.params.episode || req.params.episode == '') {
		res.status(404).send('Sorry cant find that!')
		return
	}

	const episodes = db.collection('episodes')
	try {
		const item = await episodes.findOne({
			episode: req.params.episode,
			status: 'PUBLISHED'
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

router.get('/last', async (req, res) => {

	try {

		const episodes = db.collection('episodes')

		// TODO projection

		const items = await episodes.find({
				status: 'PUBLISHED'
			}).sort({
				pubDate: -1
			})
			.limit(1)
			.toArray()
		if (items[0]) {
			res.send(items[0])
		} else {
			res.status(404).send('Sorry cant find that!')
		}
	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

router.get('/count', async (req, res) => {

	try {
		const episodes = db.collection('episodes')
		const tatalItems = await episodes.countDocuments({
			status: 'PUBLISHED'
		})
		res.send({
			tatalItems: tatalItems
		})
	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

router.get('/counter/months', async (req, res) => {

	try {
		const counter = db.collection('counter')
		const counters = await counter.find({})
			.sort({
				monthYYYYMM: -1
			})
			.limit(12)
			.toArray()
		res.send({
			counters: counters
		})
	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

router.get('/page/:page', async (req, res) => {

	let page = req.params.page

	page = Number.parseInt(page, 10)

	if (!Number.isInteger(page) || page < 1) page = 1

	const pagesize = 10

	const episodes = db.collection('episodes')
	try {

		let query = {
			status: 'PUBLISHED'
		}

		if (req.session.auth &&
			req.session.auth == true &&
			req.session.admin == true) {

			query = {}
		}

		res.send(
			await episodes
			.find(query)
			.sort({
				pubDate: -1
			})
			.skip(pagesize * (page - 1))
			.limit(pagesize)
			.toArray())
	} catch (e) {
		log(e)
		res.status(500).send('Sorry we have a pb!')
	}
})

module.exports = router;