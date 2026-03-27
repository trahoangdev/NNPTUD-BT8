const nodemailer = require("nodemailer");

// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    secure: false,
    auth: {
        user: "240dcea4b7c363",
        pass: "2264f4d5d97332"
    },
});
//http://localhost:3000/api/v1/auth/resetpassword/a87edf6812f235e997c7b751422e6b2f5cd95aa994c55ebeeb931ca67214d645

// Send an email using async/await;
module.exports = {
    sendMail: async function (to,url) {
        const info = await transporter.sendMail({
            from: 'admin@hehehe.com',
            to: to,
            subject: "reset pass",
            text: "click vo day de doi pass", // Plain-text version of the message
            html: "click vo <a href="+url+">day</a> de doi pass", // HTML version of the message
        });
    },
    sendMailPassword: async function (to, password) {
        await transporter.sendMail({
            from: 'admin@hehehe.com',
            to: to,
            subject: "Thông tin tài khoản của bạn",
            text: `Tài khoản của bạn đã được tạo. Mật khẩu: ${password}`,
            html: `<p>Tài khoản của bạn đã được tạo thành công.</p><p>Mật khẩu của bạn là: <strong>${password}</strong></p><p>Vui lòng đổi mật khẩu sau khi đăng nhập.</p>`,
        });
    }
}