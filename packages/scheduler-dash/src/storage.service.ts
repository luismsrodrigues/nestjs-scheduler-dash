import { Injectable, Inject, Optional } from '@nestjs/common';
import { Storage } from './storage/storage.abstract';
import { MemoryStorage } from './storage/memory.storage';

const STORAGE_TOKEN = 'SCHEDULER_DASH_STORAGE';

@Injectable()
export class StorageService extends Storage {
  private storage: Storage;

  constructor(@Optional() @Inject(STORAGE_TOKEN) storage?: Storage) {
    super({ historyRetention: 10 });
    this.storage = storage ?? new MemoryStorage({ historyRetention: 10 });
  }

  setStorage(storage: Storage): void {
    this.storage = storage;
  }

  save(execution: Parameters<Storage['save']>[0]): void {
    this.storage.save(execution);
  }

  update(id: string, data: Parameters<Storage['update']>[1]): void {
    this.storage.update(id, data);
  }

  findByJob(jobName: string): ReturnType<Storage['findByJob']> {
    return this.storage.findByJob(jobName);
  }

  findAll(): ReturnType<Storage['findAll']> {
    return this.storage.findAll();
  }

  getMetrics(jobName: string): ReturnType<Storage['getMetrics']> {
    return this.storage.getMetrics(jobName);
  }

  getAllMetrics(): ReturnType<Storage['getAllMetrics']> {
    return this.storage.getAllMetrics();
  }
}
