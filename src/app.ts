import express, { Express } from 'express';
import { GatewayServer } from '@gateway/server';
class Application {
  public static initialize(): void {
    const app: Express = express();
    const gateway: GatewayServer = new GatewayServer(app);
    gateway.start();
  }
}

Application.initialize();
