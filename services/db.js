const MongoClient = require('mongodb').MongoClient

module.exports.ObjectID = require('mongodb').ObjectID

const mongoClient = new MongoClient(process.env.MONGO_URL, {
	useNewUrlParser: true,
	poolSize: 20
})

const getClient = () => {
	return mongoClient
}

module.exports.getClient = getClient

let db = undefined

const connect = async () => {

	if (db == undefined) {

		await mongoClient.connect()

		db = mongoClient.db(process.env.DB_NAME)
	}
}


const getDB = () => {

	return db
}

module.exports.getDB = getDB
module.exports.connect = connect

module.exports.getCounterEntity = () => {

	return Object.preventExtensions(

		Object.seal(

			Object.assign({}, {

				_id: undefined,
				monthYYYYMM: undefined,
				downloadTotal: 0
			})
		)
	)
}

module.exports.getUserEntity = () => {

	return Object.preventExtensions(

		Object.seal(

			Object.assign({}, {

				_id: undefined,
				email: undefined,
				admin: undefined,
				token: undefined,
				lastLogin: undefined
			})
		)
	)
}

module.exports.getSoumissionEntity = () => {

	return Object.preventExtensions(

		Object.seal(

			Object.assign({}, {

				_id: undefined,
				postDate: undefined,
				status: undefined, // POSTED | TO_PUBLISH | PUBLISHED
				origin: undefined,
				title: undefined,
				description: undefined,
				author: undefined,
				contact: undefined,
				fileName: undefined,
				originalFileName: undefined,
				size: undefined,
				mimetype: undefined
			})
		)
	)
}

module.exports.getEpisodeEntity = () => {

	return Object.preventExtensions(

		Object.seal(

			Object.assign({}, {

				_id: undefined,
				episode: undefined,
				status: undefined, // PUBLISHED | HIDDEN
				title: undefined,
				description: undefined,
				guid: undefined,
				pubDate: undefined,
				mediaFileName: undefined,
				mediaSize: undefined,
				mediaDuration: undefined,
				mediaType: undefined,
				imageUrl: undefined,
				explicit: undefined,
				author: undefined,
				creator: undefined,
				downloadTotal: undefined
			})
		)
	)
}