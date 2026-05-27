import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigType, getConfigToken } from '@nestjs/config';
import smsConfig from '@config/sms';

@Injectable()
export class Msg91Service {
  private baseUrl: string;
  private authKey: string;
  private templateId: string;

  constructor(
    @Inject(getConfigToken('sms'))
    private readonly sms: ConfigType<typeof smsConfig>,
    private readonly http: HttpService,
  ) {
    this.baseUrl = this.sms.baseUrl;
    this.authKey = this.sms.authKey;
    this.templateId = this.sms.templateId;
  }

  async send(payload: {
    recipients: Array<{
      mobiles: string;
      [key: string]: string;
    }>;
  }): Promise<unknown> {
    try {
      const headers = {
        accept: 'application/json',
        authkey: this.authKey,
        'content-type': 'application/json',
      };

      const response$ = this.http.post(
        this.baseUrl,
        { template_id: this.templateId, short_url: 0, ...payload },
        { headers },
      );
      const response = await firstValueFrom(response$);

      return response.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to send SMS via MSG91',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
