import * as express from 'express';
import { createThriftServer } from '@creditkarma/thrift-server-express';
import { Market, IPdpRequest, IPdpResponseArgs } from './codegen';
//IPdpResponseArgs
const PORT = 8080;

const serviceHandlers: Market.IHandler<express.Request> = {
  getPdp(request: IPdpRequest): IPdpResponseArgs {
    return {
      id: request.productId,
      name: '에어컨',
      price: 350000,
    };
  },
};

const app: express.Application = createThriftServer({
  path: '/thrift',
  thriftOptions: {
    serviceName: 'market-service',
    handler: new Market.Processor(serviceHandlers),
  },
});

app.listen(PORT, () => {
  console.log(`Express server listening on port: ${PORT}`);
});
