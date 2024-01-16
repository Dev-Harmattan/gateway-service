import { Logger } from 'winston';
import {
  CustomError,
  IErrorMessage,
  winstonLogger,
} from '@dev-harmattan/shared';
import {
  Application,
  NextFunction,
  Request,
  Response,
  json,
  urlencoded,
} from 'express';
import cookieSession from 'cookie-session';
import cors from 'cors';
import hpp from 'hpp';
import helmet from 'helmet';
import compression from 'compression';
import { StatusCodes } from 'http-status-codes';
import http from 'http';
import { config } from '@gateway/config';
import { elasticsearch } from '@gateway/elasticsearch';
import { appRoutes } from '@gateway/routes';

const SERVER_PORT = 4000;
const log: Logger = winstonLogger(
  `${config.ELASTIC_SEARCH_URL}`,
  'apiGatewayServer',
  'debug',
);

export class GatewayServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.startElasticsearch();
    this.errorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.set('trust proxy', 1);
    app.use(
      cookieSession({
        name: 'session',

        secure: config.NODE_ENV !== 'development',
        maxAge: 24 * 7 * 60 * 60 * 1000,
        keys: [`${config.SECRET_KEY_ONE}`, `${config.SECRET_KEY_TWO}`],
        // sameSite: false
      }),
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      }),
    );
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '200mb' }));
    app.use(urlencoded({ limit: '200mb', extended: true }));
  }

  private routesMiddleware(app: Application): void {
    appRoutes(app);
  }

  private startElasticsearch(): void {
    elasticsearch.checkConnection();
  }

  private errorHandler(app: Application): void {
    app.use('*', (req: Request, res: Response, next: NextFunction) => {
      const fullUrl = `${req.protocol}://${req.get('host')}:${req.originalUrl}`;
      log.log('error', `${fullUrl} endpoint does not exist`, '');
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'endpoint called does not exist' });
      next();
    });

    app.use(
      (
        error: IErrorMessage,
        _req: Request,
        res: Response,
        next: NextFunction,
      ) => {
        log.log('error', `GatewayService ${error.comingFrom}`, error);
        if (error instanceof CustomError) {
          res.status(error.statusCode).json(error.serializeErrors());
        }
        next();
      },
    );
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      this.startHttpServer(httpServer);
    } catch (error) {
      log.log('error', 'GatewayService startServer() error method:', error);
    }
  }

  private async startHttpServer(httpServer: http.Server): Promise<void> {
    try {
      log.info(`Gateway server has started with process id ${process.pid}`);
      httpServer.listen(SERVER_PORT, () => {
        log.info(`Gateway server running on port ${SERVER_PORT}`);
      });
      this.closeConnection(httpServer);
    } catch (error) {
      log.log('error', 'GatewayService startServer() error method:', error);
    }
  }

  private closeConnection(server: http.Server): void {
    process.on('SIGINT', () => {
      server.close(() => {
        process.exit(1);
      });
    });
  }
}
