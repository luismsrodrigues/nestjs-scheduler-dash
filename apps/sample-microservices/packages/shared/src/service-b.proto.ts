import { ServiceProto } from 'tsrpc-proto';

export interface ServiceType {
  api: {
    GetSchedulerStats: { req: ReqGetSchedulerStats; res: ResGetSchedulerStats };
  };
  msg: {};
}

export interface ReqGetSchedulerStats {}

export interface ResGetSchedulerStats {
  totalJobs: number;
  jobNames: string[];
}

export const serviceProto: ServiceProto<ServiceType> = {
  version: 3,
  services: [{ id: 0, name: 'GetSchedulerStats', type: 'api' }],
  types: {
    'PtlGetSchedulerStats/ReqGetSchedulerStats': {
      type: 'Interface',
      properties: [],
    },
    'PtlGetSchedulerStats/ResGetSchedulerStats': {
      type: 'Interface',
      properties: [
        { id: 0, name: 'totalJobs', type: { type: 'Number' } },
        {
          id: 1,
          name: 'jobNames',
          type: { type: 'Array', elementType: { type: 'String' } },
        },
      ],
    },
  },
};
