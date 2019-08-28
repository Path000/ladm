const MongoClient = require('mongodb').MongoClient
const fs = require('fs')

const run = async () => {
	let client
	try {
		client = new MongoClient('mongodb://localhost:27017', {
			useNewUrlParser: true
		})

		await client.connect()
		console.log('Connected successfully to MongoDB')

		const db = client.db('ladmdb')

		try {
			await db.dropCollection('episodes')
		} catch (e) {
			// don't care
		}

		const episodes = await db.createCollection('episodes')

		const items = JSON.parse(fs.readFileSync('ladm-db.json'))

		for (let item of items) {
			await episodes.insertOne(item)
		}
	} catch (e) {
		throw e
	} finally {
		if (client) client.close()
	}
}


run().catch((e) => {
	console.log(e)
})