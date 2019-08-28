const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)


const sessionStore = new MongoDBStore({
	uri: process.env.MONGO_URL,
	databaseName: process.env.DB_NAME,
	collection: 'sessions'
})

sessionStore.on('error', (error) => {
	log(error)
	closeAll()
})

module.exports = session({
	secret: process.env.SESSION_SECRET,
	cookie: {
		path: '/',
		httpOnly: true,
		secure: false,
		expires: new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000)) //10 ans
	},
	name: 'ladm.session.id',
	store: sessionStore,
	resave: false,
	saveUninitialized: false
})
