const multer = require('multer')
const uuid = require('uuid/v4') // random
const fs = require('fs')

const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, process.env.UPLOAD_DIR)
	},
	filename: function(req, file, cb) {
		cb(null, `${uuid()}`)
	}
})

const fileFilter = (req, file, cb) => {

	//cb(null, false)
	cb(null, true)
	//cb(new Error('I don\'t have a clue!'))
}

const limits = {
	fieldNameSize: 200, //integer - Max field name size (in bytes) (Default: 100 bytes).
	fieldSize: 10000, // integer - Max field value size (in bytes) (Default: 1MB).
	fields: 10, // integer - Max number of non-file fields (Default: Infinity).
	fileSize: 1000000000, // integer - For multipart forms, the max file size (in bytes) (Default: Infinity).
	files: 1, // integer - For multipart forms, the max number of file fields (Default: Infinity).
	parts: 20, // integer - For multipart forms, the max number of parts (fields + files) (Default: Infinity).
	headerPairs: 2000 //integer - For multipart forms, the max number of header key=>value pairs to parse Default: 2000 (same as node's http).
}

const upload = multer({ // Body parser for content type : multipart/form-data (includes files)
	storage: storage,
	preservePath: false,
	fileFilter: fileFilter,
	limits: limits
})
const uploadMedia = upload.single('audio')


const parse = (req, res) => {

	return new Promise((resolve, reject) => {

		uploadMedia(req, res, (err) => {

			if (err) {
				if (req.file && req.file.path) fs.unlink(req.file.path)
				reject(err)
			} else {
				resolve()
			}
		})

	})
}

module.exports.parse = parse
