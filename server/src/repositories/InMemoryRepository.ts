import { IRepository } from './IRepository';
import { randomUUID } from 'crypto';

export class InMemoryRepository<T extends { id: string }> implements IRepository<T> {
  protected readonly entities: Map<string, T> = new Map();

  async findById(id: string): Promise<T | null> {
    const entity = this.entities.get(id);
    return entity ? { ...entity } : null;
  }

  async findAll(): Promise<T[]> {
    return Array.from(this.entities.values()).map(e => ({ ...e }));
  }

  async save(entity: Omit<T, 'id'> & { id?: string }): Promise<T> {
    const id = entity.id || randomUUID();
    // In a real 'save' or 'create' method, you might throw if the ID exists.
    // For this generic repo, we'll allow upsert-like behavior.
    const newEntity = { ...entity, id } as T;
    this.entities.set(id, newEntity);
    return { ...newEntity };
  }

  async update(id: string, entityUpdate: Partial<T>): Promise<T | null> {
    const existingEntity = this.entities.get(id);
    if (!existingEntity) {
      return null;
    }
    const updatedEntity = { ...existingEntity, ...entityUpdate, id };
    this.entities.set(id, updatedEntity);
    return { ...updatedEntity };
  }

  async delete(id: string): Promise<boolean> {
    return this.entities.delete(id);
  }
}
