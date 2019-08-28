const fs = require('fs')
const exec = require('child_process').exec
const crypto = require('crypto')
const http = require('http')
const moment = require('moment')

const httpReq = (options) => {
	return new Promise((resolve, reject) => {
		try {
			let returnedData = ''
			const req = http.request(options, (res) => {
				res.on('data', (data) => {
					returnedData += data
				})
				res.on('end', () => {
					resolve(returnedData)
				})
			})
			req.on('error', error => {
				reject(error)
			})
			req.end()
		} catch (e) {
			reject(e)
		}
	})
}
module.exports.httpReq = httpReq

const getHash = (filename) => {
	return new Promise((resolve, reject) => {
		try {
			const hash = crypto.createHash('sha256');

			hash.on('readable', () => {
				const data = hash.read();
				if (data) {
					resolve(data.toString('hex'));
				}
			})
			const input = fs.createReadStream(filename);
			input.pipe(hash)
		} catch (e) {
			reject(e)
		}
	})
}
module.exports.getHash = getHash

const appendFile = (filename, data) => {
	return new Promise((resolve, reject) => {
		fs.appendFile(filename, data, (err) => {
			if (err) return reject(err)
			resolve()
		})
	})
}
module.exports.appendFile = appendFile

const writeFile = (filename, data) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(filename, data, (err) => {
			if (err) return reject(err)
			resolve()
		})
	})
}
module.exports.writeFile = writeFile

const readFile = (filename) => {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, 'utf8', (err, data) => {
			if (err) return reject(err)
			resolve(data)
		})
	})
}
module.exports.readFile = readFile

const execCommand = (cmd) => {
	return new Promise((resolve, reject) => {
		exec(cmd, {}, (e, stdout, stderr) => {
			if (e) return reject(e)
			if (stdout) return resolve(stdout)
			resolve()
		})
	})
}
module.exports.execCommand = execCommand

const escapeXml = (unsafe) => {
	return unsafe.toString().replace(/[<>&'"]/g, function(c) {
		switch (c) {
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '&':
				return '&amp;';
			case '\'':
				return '&apos;';
			case '"':
				return '&quot;';
		}
	});
}
module.exports.escapeXml = escapeXml

const getDuration = async (file) => {
	const cmd = `sox ${file} -n stat 2>&1 | grep Length`
	const stdout = await execCommand(cmd)
	const pos = stdout.trim().indexOf(':')
	let duration = stdout.substring(pos + 1).trim()
	duration = Math.trunc(duration)
	duration = moment()
		.startOf('day')
		.seconds(duration)
		.format('H:mm:ss')
	return duration
}
module.exports.getDuration = getDuration

const getSize = (file) => {
	return new Promise((resolve, reject) => {
		fs.stat(file, {}, (e, stats) => {
			if (e) return reject(e)
			resolve(stats.size)
		})
	})
}
module.exports.getSize = getSize

const fileExists = (file) => {
	return new Promise((resolve, reject) => {
		fs.access(file, fs.constants.F_OK, (err) => {
			if (err) return resolve(false)
			resolve(true)
		})
	})
}
module.exports.fileExists = fileExists

const splitLinesToArray = (data) => {
	let rawLines = data.split(['\n'])

	for (let i = 0; i < rawLines.length; i++) {
		rawLines[i] = rawLines[i].trim()
	}

	let lines = rawLines.filter((line) => {
		if (line.length > 0) return true
		return false
	})
	return lines
}
module.exports.splitLinesToArray = splitLinesToArray