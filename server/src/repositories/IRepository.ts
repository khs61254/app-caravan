export interface IRepository<T extends { id: string }> {
  findById(id: string, resourceName: string): Promise<T>;
  findAll(): Promise<T[]>;
  save(entity: Omit<T, 'id'> & { id?: string }): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
