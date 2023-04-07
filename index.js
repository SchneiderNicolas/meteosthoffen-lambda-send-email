const aws = require("aws-sdk");

exports.handler = async (event) => {
  const { senderEmail, senderName, message } = JSON.parse(event.body);

  const options = {
    Source: "nicolas.j.sch@gmail.com",
    Destination: {
      ToAddresses: ["nicolas.j.sch@gmail.com"],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: "<div>" + message + "</div>",
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Subject",
      },
    },
  };

  try {
    const ses = new aws.SES({ region: "eu-west-1", apiVersion: "2010-12-01" });
    const sendEmailResult = await ses.sendEmail(options).promise();

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Email sent successfully!",
        result: sendEmailResult,
      }),
    };

    return response;
  } catch (error) {
    console.error("Error sending email:", error);

    const response = {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error sending email",
        error: error.message,
      }),
    };

    return response;
  }
};
