const ftp = require("basic-ftp")
const fs = require('fs')

const execCommand = require('../common/utils').execCommand
const getHash = require('../common/utils').getHash

const upload = async (param) => {
	return new Promise(async (resolve, reject) => {
		let client = undefined
		try {

			const initialHash = await getHash(param.localFile)

			client = new ftp.Client()
			client.ftp.verbose = false
			await client.access(param.configFTP)

			if (param.rejectIfExists) {

				try {

					await client.size(param.remoteFile)
					client.close()
					reject(`${param.remoteFile} already exists`)
					return

				} catch (e) {
					// doit être ignorée.
				}
			}

			await client.upload(fs.createReadStream(param.localFile), param.remoteFile)

			const controlCopy = `${process.env.TEMP_DIR}/controlCopy.mp3`
			await client.download(fs.createWriteStream(controlCopy), param.remoteFile)
			const backupHash = await getHash(controlCopy)

			await execCommand(`rm ${controlCopy}`)

			if (param.removeAfter) {
				await execCommand(`rm ${param.localFile}`)
			}

			if (initialHash !== backupHash) {
				reject("Hash control fails")
			} else {
				resolve()
			}

		} catch (e) {
			reject(e)
		} finally {
			if (client) client.close()
		}
	})
}

module.exports = upload