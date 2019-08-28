const fs = require('fs')
const sax = require("sax")
const http = require('http')
const moment = require('moment')
moment.locale('en')




const itemTemplate = {
	episode: '',
	status: 'PUBLISHED',
	title: '',
	description: '',
	guid: '',
	pubDate: '',
	mediaFileName: '',
	mediaSize: '',
	mediaDuration: '',
	mediaType: '',
	imageUrl: '',
	explicit: '',
	author: '',
	creator: '',
	downloadTotal: 0
}

const items = []

const saxStream = sax.createStream(false, {
	trim: true,
	normalize: true,
	lowercase: true
})
saxStream.on('error', (e) => {
	// unhandled errors will throw, since this is a proper node
	// event emitter.
	console.error("error!", e)
	// clear the error
	this._parser.error = null
	this._parser.resume()
})

let currentItem = undefined
let currentTag = undefined
saxStream.on('opentag', (node) => {

	//console.log(node.name)
	currentTag = node.name

	if (currentTag == 'item') {

		//console.log('new item')
		currentItem = Object.assign({}, itemTemplate)
		items.push(currentItem)
	}

	if (!currentItem) return

	if (currentTag == 'enclosure') {

		currentItem.mediaFileName = node.attributes.url
		currentItem.mediaSize = node.attributes.length
		currentItem.mediaType = node.attributes.type
	}
})

const setData = (data) => {

	//console.log(`[${currentTag}]: ${data}`)

	if (!currentItem) return

	if (currentTag == 'title') {
		currentItem.title = data
	}
	if (currentTag == 'description') {
		currentItem.description = data
	}
	if (currentTag == 'guid') {
		currentItem.guid = data
	}
	if (currentTag == 'dc:creator') {
		currentItem.creator = data
	}
	if (currentTag == 'pubdate') {
		//RSS format : RFC 2822
		//mongo format : ISO
		currentItem.pubDate = moment(data).toISOString()
	}
	if (currentTag == 'itunes:explicit') {
		currentItem.explicit = data
	}
	if (currentTag == 'itunes:duration') {
		currentItem.mediaDuration = data
	}
	if (currentTag == 'itunes:author') {
		currentItem.author = data
	}
	if (currentTag == 'itunes:episode') {
		currentItem.episode = data
	}
}
saxStream.on('cdata', (data) => {
	setData(data)
})
saxStream.on('text', (data) => {
	setData(data)
})

const wait = (ms) => {
	return new Promise((resolve, reject) => {
		return setTimeout(() => resolve(), ms)
	})
}

const getPodCloudRedirection = (url) => {
	return new Promise((resolve, reject) => {
		try {
			http.get(url, (res) => {
				const {
					statusCode
				} = res;
				if (statusCode != 302) {
					reject(statusCode)
					return
				}
				resolve(res.headers.location)
			})
		} catch (e) {
			reject(e)
		}
	})
}

saxStream.on('end', async () => {

	//"mediaFileName": "http://stats.podcloud.fr/lavis-des-moutons/lavis-des-moutons-ep-081-bonjour-mathilde-linterview-live-at-podrennes/enclosure.mp3?p=f",

	console.log('Guess missing episode number')

	for (let item of items) {
		//console.log(item.mediaFileName)

		//console.log(item.episode)

		if (item.mediaFileName == '') {
			if (item.episode == '') item.episode = 'hs-txt-1'
		} else {
			//http://stats.podcloud.fr/lavis-des-moutons/lavis-des-moutons-ep-083-1-y-croire-ou-etre-lucide/enclosure.mp3?p=f
			//http://stats.podcloud.fr/lavis-des-moutons/lavis-des-moutons-ep-180-b-au-fond-je-crois-que-la-terre-est-ronde/enclosure.mp3?p=f
			//http://stats.podcloud.fr/lavis-des-moutons/lavis-des-moutons-ep-066-audio-opinion-1-app-de-podcastage-ios/enclosure.mp3?p=f
			//http://stats.podcloud.fr/lavis-des-moutons/lavis-des-moutons-ep-066-video-opinion-1-app-de-podcastage-ios/enclosure.m4v?p=f
			let stringToRemove = 'http://stats.podcloud.fr/lavis-des-moutons/lavis-des-moutons-ep-'
			if (item.mediaFileName.startsWith(stringToRemove)) {
				let start = stringToRemove.length
				let end = item.mediaFileName.indexOf('-', start + 1)
				let num = item.mediaFileName.substring(start, end)
				if (num.charAt(0) == '0') num = num.substring(1)
				if (num.charAt(0) == '0') num = num.substring(1)

				// cas particuliers
				if (item.mediaFileName.substring(start, start + 5) == '083-1') {
					num = '83b'
				}
				if (item.mediaFileName.substring(start, start + 5) == '180-b') {
					num = '180b'
				}
				if (item.mediaFileName.substring(start, start + 9) == '066-audio') {
					num = '66'
				}
				if (item.mediaFileName.substring(start, start + 9) == '066-video') {
					num = '66b'
				}

				if (item.episode == '') {
					item.episode = num
				} else {
					if (item.episode != num) {
						console.log(' Warning. episode: ' + item.episode + ' num:' + num)
						item.episode = num
					}
				}
			} else {
				console.log(' !!!!!!!!!!!!!!!!!! WRONG start string')
			}
		}
	}

	console.log('Get original media url')

	for (let item of items) {

		//console.log(item.mediaFileName)
		if (item.mediaFileName) {

			try {
				let url = await getPodCloudRedirection(item.mediaFileName)
				let stringToRemove = 'http://lavis-des-moutons.fr/mp3/'
				if (url.startsWith(stringToRemove)) {
					item.mediaFileName = url.substring(stringToRemove.length)
					//console.log(item.mediaFileName)
				} else {
					console.log(' !!!!!!!!!!!!!!!!!! WRONG start string')
				}
			} catch (e) {
				console.log(e)
			} finally {
				await wait(0)
			}
		}
	}


	fs.writeFileSync('ladm-db.json', JSON.stringify(items, null, '    '))
})

const filename = "rss-podcloud.xml"
console.log('Parsing ' + filename)
fs.createReadStream(filename).pipe(saxStream)