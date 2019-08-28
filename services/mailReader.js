const imaps = require('imap-simple')
const path = require('path')
const uuid = require('uuid/v4') // random
const splitLinesToArray = require('../common/utils').splitLinesToArray
const writeFile = require('../common/utils').writeFile

const parse = (message, connection) => {
	return new Promise(async (resolve, reject) => {
		try {
			// Get subject
			let headers = message.parts.filter(function(part) {
				return part.which === 'HEADER'
			})

			const from = headers[0].body.from[0]

			const subject = headers[0].body.subject[0]

			var parts = imaps.getParts(message.attributes.struct);

			// Get body
			const bodyParts = parts.filter((part) => {
				return (part.disposition == null || part.disposition == undefined) &&
					part.type && part.type.toUpperCase() == 'TEXT' &&
					part.subtype && part.subtype.toUpperCase() == 'PLAIN'
			})

			const rawBodyData = await connection.getPartData(message, bodyParts[0])

			// Get attachement
			const attachmentParts = parts.filter((part) => {
				return part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
			})
			if (attachmentParts.length == 0) {
				return resole(undefined)
			}

			const attachmentData = await connection.getPartData(message, attachmentParts[0])

			const originalName = attachmentParts[0].disposition.params.filename

			const fileName = uuid()
			const uploadPath = `${process.env.UPLOAD_DIR}/${fileName}`
			await writeFile(uploadPath, attachmentData)

			const messageData = {
				titre: subject,
				fileName: fileName,
				originalFileName: originalName,
				contact: from,
				body: splitLinesToArray(rawBodyData),
				size: attachmentData.length,
				ext: path.extname(originalName)
			}
			resolve(messageData)
		} catch (e) {
			reject(e)
		}
	})
}

const createSoumissionsFromMail = () => {

	return new Promise(async (resolve, reject) => {

		let connection = undefined

		try {
			connection = await imaps.connect({
				imap: {
					user: process.env.INC_MAIL_USER,
					password: process.env.INC_MAIL_PASS,
					host: process.env.INC_MAIL_HOST,
					port: process.env.INC_MAIL_PORT,
					tls: true,
					tlsOptions: {
						rejectUnauthorized: false
					},
					authTimeout: 5000
				}
			})

			await connection.openBox('INBOX')

			// Fetch emails from the last 24h
			const delay = 24 * 3600 * 1000;
			let yesterday = new Date();
			yesterday.setTime(Date.now() - delay);
			yesterday = yesterday.toISOString();
			const searchCriteria = ['UNSEEN', ['SINCE', yesterday]];
			const fetchOptions = {
				bodies: ['HEADER', 'HEADER.FIELDS (FROM TO SUBJECT DATE)'],
				struct: true,
				markSeen: true
			}

			const messages = await connection.search(searchCriteria, fetchOptions)

			const parsedMessages = []

			for (const message of messages) {

				const parsedMessage = await parse(message, connection);

				if (parsedMessage != undefined) {
					parsedMessages.push(parsedMessage)
				}
			}

			resolve(parsedMessages)

		} catch (e) {
			reject(e)
		} finally {
			if (connection) connection.end()
		}
	})
}

module.exports.createSoumissionsFromMail = createSoumissionsFromMail