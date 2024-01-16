import { GatewayHealthController } from '@gateway/controllers/health';
import express, { Router } from 'express';

class HealthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/gateway-health', GatewayHealthController.getHealth);
    return this.router;
  }
}
export const healthRoutes: HealthRoutes = new HealthRoutes();
