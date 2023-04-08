const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  const { receivers, recipient, selectedObject, formValues } = JSON.parse(event.body);

  function getContent(formsValue, selectedObject) {
    let content = "";
    if (selectedObject) {
      content +=
        '<tr><td style="width: 13%; text-align: right; padding: 3px 15px 3px 3px; font-weight: bold;">' +
        "Objet de la demande :" +
        "</td><td>" +
        selectedObject +
        "</td></tr>";
    }

    for (const [key, value] of Object.entries(formsValue)) {
      content +=
        '<tr><td style="width: 13%; text-align: right; padding: 3px 15px 3px 3px; font-weight: bold;">' +
        key +
        " : </td><td>" +
        value +
        "</td></tr>";
    }
    return content;
  }

  const acknowledgmentHtml = fs.readFileSync(
    path.join(__dirname, "acknowledgment.html"),
    "utf8"
  );

  const templateFile = fs.readFileSync(
    path.join(__dirname, "template.html"),
    "utf8"
  );

  const template = handlebars.compile(templateFile);

  const content = {
    formTitle: selectedObject,
    content: getContent(formValues, selectedObject),
  };

  const informationHtml = template(content);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const acknowledgment = {
    from: process.env.EMAIL_ADDRESS,
    to: [recipient],
    subject: "Accusé de réception pour votre demande",
    html: acknowledgmentHtml,
  };

  const informations = {
    from: process.env.EMAIL_ADDRESS,
    to: receivers,
    subject: "Nouveaux formulaire de contact",
    html: informationHtml,
  };

  try {
    const results = await Promise.allSettled([
      transporter.sendMail(acknowledgment),
      transporter.sendMail(informations),
    ]);

    const errors = results.filter((result) => result.status === "rejected");

    if (errors.length > 0) {
      const response = {
        statusCode: 500,
        body: JSON.stringify({
          message:
            "Une ou plusieurs erreurs se sont produites lors de l'envoi des e-mails.",
          errors,
        }),
      };
      return response;
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Les e-mails ont été envoyés avec succès.",
        result1: results[0].value,
        result2: results[1].value,
      }),
    };
    return response;
  } catch (error) {
    const response = {
      statusCode: 500,
      body: JSON.stringify({
        message:
          "Une erreur inattendue s'est produite lors de l'envoi des e-mails.",
        error: error.message,
      }),
    };
    return response;
  }
};
