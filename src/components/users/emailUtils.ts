import {MailService} from '@sendgrid/mail';

export const sendVerificationMail = (email:string, redirectEmail:string) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey == undefined) {
        console.log("Api key not set for sending mail");
    }
    else {
        const sendGrid = new MailService();
        sendGrid.setApiKey(apiKey);
        const msg = {
            to: email, // Change to your recipient
            from: 'noreply@kho.land', // Change to your verified sender
            subject: 'Verify your account with KhoLand',
            html: verificationMailHtml(email, redirectEmail),
          }
          sendGrid
          .send(msg)
          .then(() => {
            console.log('Email sent')
          })
          .catch((error) => {
            console.error(error)
          })
    }
}

const verificationMailHtml = (email:string, redirectEmail:string) => `
<div style="box-sizing:border-box;display:block;max-width:600px;margin:0 auto;padding:10px">
  <span style="color:transparent;display:none;height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;width:0">Let's verify your account with KhoLand.</span>
  <div>
    <table cellpadding="0" cellspacing="0" style="box-sizing:border-box;border-spacing:0;width:auto;border-collapse:separate!important">
      <tbody>
        <tr>
          <td style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top;" valign="top">
            <h2 style="margin: 0; margin-bottom: 30px; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-weight: 300; line-height: 1.5; font-size: 24px; color: #294661 !important;">Let's verify your kholand wallet!</h2>
            <p style="margin: 0; margin-bottom: 30px; color: #294661; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 300;">Your link is active for 30 minutes. After that, you will need to resend the verification email.</p>
          </td>
        </tr>
        <tr>
          <td align="center" bgcolor="#660066" style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;background-color:#660066;border-radius:2px;text-align:center" valign="top">
            <a href="${redirectEmail}" style="box-sizing:border-box;border-color:#660066;font-weight:400;text-decoration:none;display:inline-block;margin:0;color:#ffffff;background-color:#660066;border:solid 1px #660066;border-radius:2px;font-size:14px;padding:12px 45px" target="_blank" data-saferedirecturl=${redirectEmail}>Verify Kholand Account</a>
          </td>
        </tr>
        <tr>
          <td style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top;" valign="top">
            <p style="margin: 0; margin-top: 30px; color: #294661; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 300;"> If you cannot open the link from above, please open this link to verify your account: ${redirectEmail} </p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`