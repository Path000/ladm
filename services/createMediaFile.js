const moment = require('moment')
const execCommand = require('../common/utils').execCommand
const getDuration = require('../common/utils').getDuration
const getSize = require('../common/utils').getSize
const fileExists = require('../common/utils').fileExists

const createFile = async (param) => {

	return new Promise(async (resolve, reject) => {

		try {
			const episodeFile = `${process.env.MEDIA_DIR}/${param.destFileName}`
			//if (await fileExists(episodeFile)) {
			//	return reject(`File already exists : ${episodeFile}`)
			//}

			const uploadedFile = `${process.env.UPLOAD_DIR}/${param.sourceFileName}`
			const step1 = `${process.env.TEMP_DIR}/step1.wav`
			const step2 = `${process.env.TEMP_DIR}/step2.wav`
			const step3 = `${process.env.TEMP_DIR}/step3.wav`
			const step4 = `${process.env.TEMP_DIR}/step4.mp3`
			const silenceOutro = `${process.env.TEMP_DIR}/silence-outro.wav`

			await execCommand(`ffmpeg -y -i ${uploadedFile} -acodec pcm_s16le -ac 2 -ar 48000 ${step1}`)

			await execCommand(`sox ${step1} ${step2} norm`)

			await execCommand(`sox ${step2} ${silenceOutro} ${step3}`)

			await execCommand(`lame -m s --cbr -b 192 ${step3} ${step4}`)

			await execCommand(`id3v2 --year ${moment().format('YYYY')} --genre 12 --artist '${param.author}' --album "L'Avis Des Moutons" --song "LADMEp${param.episode} - ${param.title}" ${step4}`)

			const duration = await getDuration(step4)
			const size = await getSize(step4)

			await execCommand(`cp ${step4} ${episodeFile}`)

			await execCommand(`rm ${step1}`)
			await execCommand(`rm ${step2}`)
			await execCommand(`rm ${step3}`)
			await execCommand(`rm ${step4}`)

			resolve({
				duration: duration,
				size: size,
				mediaFile: episodeFile
			})
		} catch (e) {
			reject(e)
		}
	})
}

module.exports = createFile