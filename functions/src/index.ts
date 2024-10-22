/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

// Get email and password from environment variables
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

// Create a transporter for sending emails using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// Firebase Cloud Function to send an email
exports.sendEmail = functions.https.onCall((data: { to: any; subject: any; text: any; }, context: any) => {
  const mailOptions = {
    from: `Choirhub <${gmailEmail}>`,
    to: data.to,
    subject: data.subject,
    text: data.text,
  };

  // Send the email using NodeMailer
  return transporter.sendMail(mailOptions, (error: { toString: () => any; }, info: { response: any; }) => {
    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.toString() };
    }
    console.log('Email sent:', info.response);
    return { success: true };
  });
});


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
