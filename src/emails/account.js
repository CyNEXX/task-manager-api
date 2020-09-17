const sgMail = require('@sendgrid/mail');
const sendgridAPIKey = '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';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    console.log(`Sending email from cynexx@gmail.com to ${email}`);
    sgMail.send({
        to: email,
        from: 'cynexx@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    });
}

const sendCancellationEmail = (email, name) => {
    console.log(`Sending cancellation email from cynexx@gmail.com to ${email}`);
    sgMail.send({
        to: email,
        from: 'cynexx@gmail.com',
        subject: 'We\'re sorry to see you leave...',
        text: `Your request for unsubscribe has been processed, ${name}. Can you provide a reason so we can improve our app? Hope to see you again. Thank you!`
    });
}


module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}