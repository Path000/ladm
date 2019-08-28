const fs = require('fs')

const appendFile = require('../common/utils').appendFile
const execCommand = require('../common/utils').execCommand
const escapeXml = require('../common/utils').escapeXml
const readFile = require('../common/utils').readFile

const moment = require('moment')
moment.locale('en')
const DATE_RFC2822 = 'ddd, DD MMM YYYY HH:mm:ss ZZ'

const replaceAll = (chaine, expression, valeur) => {

	let returned = chaine

	while (returned.search(expression) >= 0) {

		returned = returned.replace(expression, valeur)
	}
	return returned
}



const composeTop = async (date) => {

	let top = await readFile(`${process.env.RSS_DIR}/rss-top.xml`)

	return replaceAll(top, '##date##', date)
}

const composeItem = async (data) => {

	let item = await readFile(`${process.env.RSS_DIR}/rss-item.xml`)

	item = replaceAll(item, '##num##', data.episode)
	item = replaceAll(item, '##title##', data.title)
	item = replaceAll(item, '##auteur##', data.author)
	item = replaceAll(item, '##body##', data.description)
	item = replaceAll(item, '##link##', `https://lavis-des-moutons.fr/?episode=${data.episode}`)
	item = replaceAll(item, '##guid##', data.guid)
	item = replaceAll(item, '##date##', moment(data.pubDate).format(DATE_RFC2822))
	// l'ep hs-txt-1 n'a pas de media associé.
	if (data.mediaType) {
		item = replaceAll(item, '##url##', `https://lavis-des-moutons.fr/media/episode/${data.episode}`)
	} else {
		item = replaceAll(item, '##url##', '')
	}
	item = replaceAll(item, '##size##', data.mediaSize)
	item = replaceAll(item, '##mimetype##', data.mediaType)
	item = replaceAll(item, '##duration##', data.mediaDuration)

	if (data.imageUrl) {
		item = replaceAll(item, '##img##', `https://lavis-des-moutons.fr/${data.imageUrl}`)
	} else {
		item = replaceAll(item, '##img##', 'https://lavis-des-moutons.fr/img/LADM2017.png')
	}

	return item
}

const composeBottom = async () => {

	return await readFile(`${process.env.RSS_DIR}/rss-bottom.xml`)
}

const createRSS = async (cursor) => {

	const now = moment().format(DATE_RFC2822)

	const RSSFile = `${process.env.RSS_DIR}/cc-by-nc-nd.xml`

	try {
		await execCommand(`rm ${RSSFile}`)
	} catch (e) {
		// osef
	}

	await appendFile(RSSFile, await composeTop(now))

	while (await cursor.hasNext()) {
		const episode = await cursor.next()
		await appendFile(RSSFile, await composeItem(episode))
	}

	await appendFile(RSSFile, await composeBottom(now))

	return RSSFile

}

module.exports = createRSS