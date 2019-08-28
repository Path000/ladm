const MongoClient = require('mongodb').MongoClient

const run = async () => {
	let client
	client = new MongoClient('mongodb://localhost:27017', {
		useNewUrlParser: true
	})

	await client.connect()
	console.log('Connected successfully to MongoDB')

	const db = client.db('ladmdb')

	const episodes = await db.collection('episodes')

	await episodes.createIndex({
		episode: 1
	}, {
		unique: true
	})

	await episodes.createIndex({
		pubDate: -1
	})

	await episodes.createIndex({
		status: 1
	})

	const users = await db.collection('users')

	await users.createIndex({
		email: 1
	}, {
		unique: true
	})

	await users.createIndex({
		token: 1
	})

	const sessions = await db.collection('sessions')

	await sessions.createIndex({
		expires: 1
	})

	const counter = await db.collection('counter')

	await counter.createIndex({
		monthYYYYMM: 1
	}, {
		unique: true
	})

}


run().catch((e) => {
	console.log(e)
})