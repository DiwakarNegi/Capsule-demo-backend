import { createTransport, SentMessageInfo } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export class MailService {
  transport: Mail<SentMessageInfo>;
  constructor(
    host: string,
    username: string,
    password: string,
    sender: string,
  ) {
    this.transport = createTransport({
      host,
      port: 587,
      secure: false,
      auth: {
        user: username,
        pass: password,
      },
      from: sender,
    });
  }
}
