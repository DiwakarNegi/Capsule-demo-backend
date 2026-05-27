import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigType, getConfigToken } from '@nestjs/config';
import appConfig from '@config/pg';
import crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
const Razorpay = require('razorpay');

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string;
  status: string;
  attempts: number;
  notes: string;
  created_at: string;
}

@Injectable()
export class RazorPayService {
  private keyId: string;
  private keySecret: string;
  private razorPayClient: any;

  constructor(
    @Inject(getConfigToken('pg'))
    private readonly pg: ConfigType<typeof appConfig>,
  ) {
    const { keyId, keySecret } = this.pg.razorPay;
    this.keyId = keyId;
    this.keySecret = keySecret;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    this.razorPayClient = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  createPaymentOrder(payload: {
    amount: number;
    receipt: string;
  }): Promise<RazorpayOrder> {
    const options = {
      amount: payload.amount * 100, // Razorpay expects the amount in paisa (so, multiply by 100)
      currency: 'INR',
      receipt: payload.receipt,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return this.razorPayClient.orders.create(options);
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      //   res.status(500).json({ error: 'Something went wrong' });
    }
  }

  verifyPayment(
    paymentId: string,
    orderId: string,
    signature: string,
  ): boolean {
    const signaturePayload = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(signaturePayload)
      .digest('hex');

    const isSignatureValid = signature === generatedSignature;

    if (!isSignatureValid) {
      console.error('Invalid Razorpay signature');
      return false;
    }

    return true;
  }

  getOrderDetails(orderId: string): Promise<Record<string, any>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.razorPayClient.orders.fetch(orderId);
  }
}
