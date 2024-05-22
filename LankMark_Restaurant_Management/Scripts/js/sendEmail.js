const nodemailer = require('nodemailer');
async function sendMail () {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'lankmarkrestaurant@gmail.com',
            pass: 'zones2002'
        }
    });

    // Thiết lập thông tin email
    let mailOptions = {
        from: 'lankmarkrestaurant@gmail.com',
        to: 'ahaha123@gmail.com',
        subject: 'Test email',
        text: 'This is a test email from nodemailer.'
    };

    // Gửi email
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return 'Email sent successfully!';
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email.');
    }
}