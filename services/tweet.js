const fs = require('fs')

const Twitter = require('twitter')

const verifyCredentials = async (client) => {

	return new Promise((resolve, reject) => {

		client.get('account/verify_credentials', function(error, responseAccount) {

			if (error) return reject(error)

			resolve(responseAccount.id)
		})
	})
}

const readFileAsBuffer = async (file) => {

	return new Promise((resolve, reject) => {

		fs.readFile(file, (err, data) => {

			if (err) return reject(err)

			resolve(data)
		})
	})
}

const uploadMedia = async (client, buffer) => {

	return new Promise((resolve, reject) => {

		client.post('media/upload', {

			media: buffer

		}, function(error, responseMedia) {

			if (error) return reject(error)

			resolve(responseMedia.media_id_string)
		})
	})
}

const updateStatus = async (client, status, mediaId) => {

	return new Promise((resolve, reject) => {

		client.post('statuses/update', {

			status: status,
			media_ids: mediaId

		}, function(error, tweet) {

			if (error) return reject(error)

			resolve(tweet.id_str)
		})
	})
}

const retweet = async (client, tweetId) => {

	return new Promise((resolve, reject) => {

		client.post('statuses/retweet', {

			id: tweetId

		}, function(error, tweet) {

			if (error) return reject(error)

			resolve()
		})
	})
}

const tweet = async (episode, titre, auteur, link) => {
	// @Aurelie_LADM
	const clientAurelie = new Twitter({
		consumer_key: process.env.TWIT_AURELIE_CONS_KEY,
		consumer_secret: process.env.TWIT_AURELIE_CONS_SECRET,
		access_token_key: process.env.TWIT_AURELIE_TOKEN_KEY,
		access_token_secret: process.env.TWIT_AURELIE_TOKEN_SECRET
	})

	// @LAvisDesMoutons
	const clientLADM = new Twitter({
		consumer_key: process.env.TWIT_LADM_CONS_KEY,
		consumer_secret: process.env.TWIT_LADM_CONS_SECRET,
		access_token_key: process.env.TWIT_LADM_TOKEN_KEY,
		access_token_secret: process.env.TWIT_LADM_TOKEN_SECRET
	})

	const aurelieId = await verifyCredentials(clientAurelie)

	const LADMId = await verifyCredentials(clientLADM)

	const mediaBuffer = await readFileAsBuffer(`${process.env.IMG_DIR}/LADM2017.png`)

	const mediaId = await uploadMedia(clientLADM, mediaBuffer)

	const status = `#LAvisDesMoutons - Ep ${episode}
${titre}
Par ${auteur}
${link}`

	const tweetId = await updateStatus(clientLADM, status, mediaId)

	await retweet(clientAurelie, tweetId)
}

module.exports = tweet