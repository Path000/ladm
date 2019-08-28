const router = require('express').Router()
const uuid = require('uuid/v4') // random
const mailer = require('../services/mailSender')

const log = require('../services/logger').log
const debug = require('../services/logger').debug

const db = require('../services/db').getDB()

const resetSession = (session) => {
	if (session) {
		session.auth = false
		session.admin = false
	}
}

const setSession = (session, data) => {
	session.auth = data.auth
	session.admin = data.admin
}

router.get('/current', (req, res) => {

	let data = {}
	data.auth = false
	data.admin = false

	if (req.session.auth &&
		req.session.auth == true) {
		data.auth = true
		if (req.session.admin && req.session.admin == true) {
			data.admin = true
		}
	}
	res.send(data)
})

router.post('/login', async (req, res) => {

	let responseData = {
		ok: false
	}

	const data = req.body

	if (!data.email || data.email.length < 3 || data.email.length > 200) {
		debug('bad input : ' + data.email)
		res.status(200).send(responseData)
		return
	}

	const users = db.collection('users')
	const user = await users.findOne({
		email: data.email
	}).catch((e) => {
		log(e)
		return
	})
	if (!user) {
		debug('user not found : ' + data.email)
		res.status(200).send(responseData)
		return
	}

	const token = uuid()

	await users.updateOne({
		_id: user._id
	}, {
		$set: {
			token: token
		}
	}).catch((e) => {
		log(e)
		return
	})

	const url = `${process.env.URL_BASE}/?token=${token}`

	const mail = {
		to: data.email,
		subject: "Login ✔",
		text: url,
		html: `<a href="${url}">${url}</a>`
	}

	await mailer.send(mail).catch((e) => {
		log(e)
		res.status(200).send(responseData)
		return
	})

	responseData.ok = true
	res.status(200).send(responseData)
})

router.get('/loginback/:token', async (req, res) => {
	const token = req.params.token

	let responseData = {}
	responseData.auth = false
	responseData.admin = false

	if (!token || token.length != 36) {
		debug('bad input : ' + token)
		res.status(200).send(responseData)
		return
	}

	const users = db.collection('users')
	const user = await users.findOne({
		token: token
	}).catch((e) => {
		log(e)
		return
	})

	if (!user) {
		debug('token not found : ' + token)
		resetSession(req.session)
		res.status(200).send(responseData)
		return
	}

	await users.updateOne({
		_id: user._id
	}, {
		$set: {
			token: '',
			lastLogin: new Date().toISOString()
		}
	}).catch((e) => {
		log(e)
		res.status(200).send(responseData)
		return
	})

	responseData.auth = true
	if (user.admin) {
		responseData.admin = true
	}

	setSession(req.session, responseData)

	res.status(200).send(responseData)
})

router.get('/logout', (req, res) => {

	let data = {}
	data.auth = false
	data.admin = false

	resetSession(req.session)

	res.send(data)
})

module.exports = router;