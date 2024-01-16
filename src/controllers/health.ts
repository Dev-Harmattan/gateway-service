import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

export class GatewayHealthController {
  public static getHealth(_req: Request, res: Response) {
    res.status(HttpStatusCode.Ok).send('Gateway service is OK');
  }
}
