const ftp = require("basic-ftp")

const upload = async (param) => {

	return new Promise(async (resolve, reject) => {

		let client = undefined
		try {

			client = new ftp.Client()
			client.ftp.verbose = false
			await client.access(param.configFTP)

			await client.uploadDir(param.localPath, param.remotePath)

			resolve()

		} catch (e) {
			reject(e)
		} finally {
			if (client) client.close()
		}
	})
}

module.exports = upload