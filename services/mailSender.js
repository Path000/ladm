const nodemailer = require("nodemailer")


let testAccount = undefined
let transporter = undefined

const init = () => {

    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587,
      secure: false, // use ssl
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    })
}

const send = async (mail) => {

	if(transporter == undefined) {
		init()
	}

	mail.from = process.env.MAIL_FROM

    await transporter.sendMail(mail)
}

module.exports.send = send
