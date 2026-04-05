import { SchedulerDashService } from './scheduler-dash.service';

const BRIDGE_KEY = '__SCHEDULER_DASH_SERVICE__';

function getGlobal(): typeof globalThis {
  return globalThis;
}

export function setSchedulerDashService(service: SchedulerDashService): void {
  getGlobal()[BRIDGE_KEY] = service;
}

export function getSchedulerDashService(): SchedulerDashService | null {
  return getGlobal()[BRIDGE_KEY] ?? null;
}
