import {
  createHttpClient
} from '@creditkarma/thrift-client';

import * as express from 'express';

import { Market } from './codegen';

const serverConfig = {
  hostName: 'localhost',
  port: 8081,
}

const app = express();

// Create Thrift client
const thriftClient = createHttpClient(Market.Client, {
  hostName: 'localhost',
  port: 8080,
  path: '/thrift'
})

Object.entries(Market.methodAnnotations).forEach(([rpcMethod, { annotations }]) => {
  if (annotations.rest_path && thriftClient[rpcMethod]) {
    app[annotations.rest_verb]('/pdp/:id', (req, res) => {
      thriftClient[rpcMethod]({ productId: Number(req.params.id) }).then((result) => {
        res.send(result);
      });
    });
  }
});

app.listen(serverConfig.port, () => {
  console.log(`Web server listening at http://${serverConfig.hostName}:${serverConfig.port}`)
})