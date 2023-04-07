const aws = require("aws-sdk");
const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  const { senderEmail, senderName, message } = JSON.parse(event.body);

  const acknowledgmentHtml = fs.readFileSync(
    path.join(__dirname, "acknowledgment.html"),
    "utf8"
  );

  const acknowledgment = {
    Source: "nicolas.j.sch@gmail.com",
    Destination: {
      ToAddresses: ["nicolas.j.sch@gmail.com"],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: acknowledgmentHtml,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Accusé de réception pour votre demande",
      },
    },
  };

  const informations = {
    Source: "nicolas.j.sch@gmail.com",
    Destination: {
      ToAddresses: ["nicolas.j.sch@gmail.com"],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: "<div>Message pour les informations</div>",
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Nouveaux formulaire de contact",
      },
    },
  };

  const ses = new aws.SES({ region: "eu-west-1", apiVersion: "2010-12-01" });

  const sendPromise1 = ses.sendEmail(acknowledgment).promise();
  const sendPromise2 = ses.sendEmail(informations).promise();

  try {
    const results = await Promise.allSettled([sendPromise1, sendPromise2]);

    const errors = results.filter((result) => result.status === "rejected");

    if (errors.length > 0) {
      const response = {
        statusCode: 500,
        body: JSON.stringify({
          message: "Une ou plusieurs erreurs se sont produites lors de l'envoi des e-mails.",
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
        message: "Une erreur inattendue s'est produite lors de l'envoi des e-mails.",
        error: error.message,
      }),
    };
    return response;
  }
};