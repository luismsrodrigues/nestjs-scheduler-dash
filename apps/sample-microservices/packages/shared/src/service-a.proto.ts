import { ServiceProto } from 'tsrpc-proto';

export interface ServiceType {
  api: {
    Greet: { req: ReqGreet; res: ResGreet };
  };
  msg: {};
}

export interface ReqGreet {
  name: string;
}

export interface ResGreet {
  message: string;
}

export const serviceProto: ServiceProto<ServiceType> = {
  version: 3,
  services: [{ id: 0, name: 'Greet', type: 'api' }],
  types: {
    'PtlGreet/ReqGreet': {
      type: 'Interface',
      properties: [{ id: 0, name: 'name', type: { type: 'String' } }],
    },
    'PtlGreet/ResGreet': {
      type: 'Interface',
      properties: [{ id: 0, name: 'message', type: { type: 'String' } }],
    },
  },
};
