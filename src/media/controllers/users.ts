import { Controller, Post, Put, Get, Param, Req, Res } from '@nestjs/common';
import { UserMediaService } from '../services';
import { Validate } from '@app/core/decorators';
import { UserGetUploadUrlsDto } from '../dtos';
import { MediaTransformer } from '../transformers';
import * as fs from 'fs';
import * as path from 'path';
import type { FastifyRequest, FastifyReply } from 'fastify';

@Controller({ path: 'media', version: '1' })
export class MediaUserController {
  constructor(
    private readonly service: UserMediaService,
    private readonly transformer: MediaTransformer,
  ) {}

  @Post('urls')
  async getUploadUrls(
    @Validate(UserGetUploadUrlsDto) payload: UserGetUploadUrlsDto,
  ) {
    const response = await this.service.getUploadUrls(payload);
    return this.transformer.transform(response);
  }

  @Put('upload/:fileName')
  async uploadFile(
    @Param('fileName') fileName: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const safeName = decodeURIComponent(fileName).replace(/\//g, '_');
    const filePath = path.resolve(uploadDir, safeName);

    // Body may already be parsed as Buffer by the content type parser
    const rawReq = req.raw;
    const body = (req as any).body;

    if (Buffer.isBuffer(body)) {
      // Fastify content type parser ran — trust the buffer (even if empty body was sent)
      fs.writeFileSync(filePath, body);
    } else if (!rawReq.readableEnded) {
      // No Content-Type header — Fastify skipped body parsing, stream raw
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        rawReq.on('data', (chunk: Buffer) => chunks.push(chunk));
        rawReq.on('end', resolve);
        rawReq.on('error', reject);
      });
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(filePath, buffer);
    } else {
      // Stream already consumed but body not a Buffer — write empty to avoid stale file
      fs.writeFileSync(filePath, Buffer.alloc(0));
    }

    const size = fs.statSync(filePath).size;
    return reply.status(200).send({ success: true, size });
  }

  @Get('file/:fileName')
  async serveFile(
    @Param('fileName') fileName: string,
    @Res() reply: FastifyReply,
  ) {
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    const safeName = decodeURIComponent(fileName).replace(/\//g, '_');
    const filePath = path.resolve(uploadDir, safeName);
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'File not found' });
    }
    const stream = fs.createReadStream(filePath);
    return reply.send(stream);
  }
}