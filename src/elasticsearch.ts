import { winstonLogger } from '@dev-harmattan/shared';
import { Logger } from 'winston';
import { config } from '@gateway/config';
import { Client } from '@elastic/elasticsearch';

const log: Logger = winstonLogger(
  `${config.ELASTIC_SEARCH_URL}`,
  'apiGatewayElasticsearch',
  'debug',
);

class Elasticsearch {
  private elasticSearchClient: Client;

  constructor() {
    this.elasticSearchClient = new Client({
      node: `${config.ELASTIC_SEARCH_URL}`,
      auth: {
        bearer: `${config.ELASTIC_APM_SECRET_TOKEN}`,
      },
    });
  }

  public async checkConnection(): Promise<void> {
    try {
      let isConnected = false;
      while (!isConnected) {
        const healthCheck = await this.elasticSearchClient.cluster.health({});
        log.info(
          `GatewayService Elasticsearch health check status: ${healthCheck.status}`,
        );
        isConnected = true;
      }
    } catch (error) {
      log.error('Connection to Elasticsearch failed! Retrying...');
      log.log(
        'error',
        'NotificationService checkConnection() method error:',
        error,
      );
    }
  }
}

export const elasticsearch = new Elasticsearch();
