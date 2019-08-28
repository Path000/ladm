const dotenv = require('dotenv')

console.log(`Reading .env file in dir : ${process.cwd()}`)

dotenv.config()

const checkEnvVar = (varName) => {
	if (!process.env.hasOwnProperty(varName)) {
		console.log(`missing ${varName} env var`)
		process.exit(1)
	}
}

checkEnvVar('PORT_PCLOUD')
checkEnvVar('PORT_WORKER')
checkEnvVar('PORT_MEDIA')
checkEnvVar('PORT_SITE')

checkEnvVar('DEBUG')
checkEnvVar('REQ_PROFILE')
checkEnvVar('NODE_ENV')

checkEnvVar('MONGO_URL')
checkEnvVar('DB_NAME')

checkEnvVar('KEEP_ALIVE')
checkEnvVar('SESSION_SECRET')

checkEnvVar('MAIL_HOST')
checkEnvVar('MAIL_USER')
checkEnvVar('MAIL_PASS')
checkEnvVar('MAIL_FROM')

checkEnvVar('URL_BASE')

checkEnvVar('UPLOAD_DIR')
checkEnvVar('TEMP_DIR')
checkEnvVar('MEDIA_DIR')
checkEnvVar('IMG_DIR')
checkEnvVar('TRASH_DIR')
checkEnvVar('DB_DUMP_DIR')
checkEnvVar('DB_DUMP_REMOTE_DIR')
checkEnvVar('RSS_DIR')

checkEnvVar('EMAIL_NOTIF')

checkEnvVar('INC_MAIL_HOST')
checkEnvVar('INC_MAIL_PORT')
checkEnvVar('INC_MAIL_USER')
checkEnvVar('INC_MAIL_PASS')

checkEnvVar('FTP_MEDIA_HOST')
checkEnvVar('FTP_MEDIA_USER')
checkEnvVar('FTP_MEDIA_PASS')

checkEnvVar('URL_BASE_MEDIA')

checkEnvVar('TWIT_AURELIE_CONS_KEY')
checkEnvVar('TWIT_AURELIE_CONS_SECRET')
checkEnvVar('TWIT_AURELIE_TOKEN_KEY')
checkEnvVar('TWIT_AURELIE_TOKEN_SECRET')
checkEnvVar('TWIT_LADM_CONS_KEY')
checkEnvVar('TWIT_LADM_CONS_SECRET')
checkEnvVar('TWIT_LADM_TOKEN_KEY')
checkEnvVar('TWIT_LADM_TOKEN_SECRET')