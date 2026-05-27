import { Injectable, Inject } from '@nestjs/common';
import { ConfigType, getConfigToken } from '@nestjs/config';
import smtpConfig from '@config/smtp';
import { MailService } from '../mailer';

@Injectable()
export class SmtpService {
  private readonly host: string;
  private readonly username: string;
  private readonly password: string;
  private readonly sender: string;
  private readonly mailer: MailService;

  constructor(
    @Inject(getConfigToken('smtp'))
    private readonly smtp: ConfigType<typeof smtpConfig>,
  ) {
    this.host = this.smtp.host;
    this.username = this.smtp.username;
    this.password = this.smtp.password;
    this.sender = this.smtp.sender;

    this.mailer = new MailService(
      this.host,
      this.username,
      this.password,
      this.sender,
    );
  }

  async send(
    to: string | string[],
    mail: { subject: string; html: string; text?: string },
  ): Promise<unknown> {
    const toHeader = Array.isArray(to) ? to.join(',') : to;

    return this.mailer.transport.sendMail({
      to: toHeader,
      from: this.sender,
      subject: mail.subject,
      html: mail.html,
      ...(mail.text ? { text: mail.text } : {}),
    });
  }
}
