const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const { SENDGRID_API_KEY } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

// const email = {
//   to: "dimon.stasyuk2@gmail.com",
//   from: "dimon.stasyuk@gmail.com",
//   subject: "Новая заявка с сайта",
//   html: "<p>Ваша заявка принята</p>",
// };
// sgMail
//   .send(email)
//   .then(() => console.log("Email send seccess"))
//     .catch((error) => console.log(error.message));

const sendEmail = async (data) => {
  try {
    const email = { ...data, from: "dimon.stasyuk@gmail.com" };
    await sgMail.send(email);
    return true;
  } catch (error) {
    console.log(error);
  }
};
