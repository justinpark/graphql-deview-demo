import * as express from 'express';
import { createThriftServer } from '@creditkarma/thrift-server-express';
import { Market, IPdpRequest, IPdpResponseArgs } from './codegen';
// import { Market, IPdpRequest, IPdpResponseArgs, IUIResponseArgs } from './codegen';
const PORT = 8080;

const serviceHandlers: Market.IHandler<express.Request> = {
  getPdp(request: IPdpRequest): IPdpResponseArgs {
    return {
      id: request.productId,
      name: '에어컨',
      price: 350000,
    };
  },

  // getUI(): IUIResponseArgs {
  //   // SectionComponentType.TITLE
  //   return {
  //     sections: [
  //       {
  //         id: 'title01',
  //         sectionComponentType: 'TITLE',
  //         section: {
  //           title: {
  //             title: '데뷰 2020 데모',
  //           }
  //         }
  //       },
  //       {
  //         id: 'title02',
  //         sectionComponentType: 'TITLE',
  //         section: {
  //           title: {
  //             title: '환영합니다'
  //           }
  //         }
  //       },
  //       {
  //         id: 'banner01',
  //         sectionComponentType: 'BANNER',
  //         section: {
  //           banner: {
  //             title: '배너 제목 입니다'
  //           }
  //         }
  //       },
  //     ],
  //     layouts: [
  //       {
  //         id: 'MAIN',
  //         sectionIds: ['title01', 'banner01', 'title02'],
  //       }
  //     ],
  //   };
  // }
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
