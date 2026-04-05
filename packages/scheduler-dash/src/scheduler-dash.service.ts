import { Injectable } from '@nestjs/common';
import { Storage } from './storage/storage.abstract';

@Injectable()
export class SchedulerDashService {
  private _storage: Storage | null = null;
  private _basePath: string = '_jobs';
  private _noOverlap: boolean = false;
  private _maxConcurrent: number | undefined = undefined;

  set storage(storage: Storage) {
    this._storage = storage;
  }

  get storage(): Storage | null {
    return this._storage;
  }

  set basePath(path: string) {
    this._basePath = path;
  }

  get basePath(): string {
    return this._basePath;
  }

  set noOverlap(value: boolean) {
    this._noOverlap = value;
  }

  get noOverlap(): boolean {
    return this._noOverlap;
  }

  set maxConcurrent(value: number | undefined) {
    this._maxConcurrent = value;
  }

  get maxConcurrent(): number | undefined {
    return this._maxConcurrent;
  }
}
