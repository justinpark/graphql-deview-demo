import {
  createHttpClient
} from '@creditkarma/thrift-client';

import * as express from 'express';

import { Market } from './codegen';
// @ts-ignore
import * as createRestServer from 'thrift-rest-server';

const serverConfig = {
  hostName: 'localhost',
  port: 8081,
}

const app = express();

// Create Thrift client
const thriftClient: Market.Client = createHttpClient(Market.Client, {
  hostName: 'localhost',
  port: 8080,
  path: '/thrift'
});

createRestServer(app, Market, thriftClient);

app.listen(serverConfig.port, () => {
  console.log(`Web server listening at http://${serverConfig.hostName}:${serverConfig.port}`)
});