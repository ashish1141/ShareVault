require('dotenv').config();
const nodemailer = require("nodemailer");

const mailTransporter = nodemailer.createTransport({
    service : "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth : {
        user : process.env.GMAIL_ID,
        pass : process.env.GMAIL_PASS
    }
});

const details={
    from : process.env.GMAIL_ID,
    to : "ashishgoyal1141@gmail.com",
    subject : "my first mail",
    text : "Hello!"
}

const main = async (details) => {
    await mailTransporter.sendMail(details,(err)=>{
        if(err)
        {
            console.log("It has an error",err);
        }
        else{
            console.log("email has been sent");
        }
    });
}

main(details).catch((err)=>{
    console.log("error occured");
});