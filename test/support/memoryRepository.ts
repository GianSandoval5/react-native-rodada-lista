import { Bike, BikeRepository } from "../../src/features/bikes/domain/bike";
export class MemoryRepository implements BikeRepository {
  readonly rows = new Map<string, Bike>();
  error: Error | null = null;
  pending: Promise<void> | null = null;
  constructor(bikes: Bike[] = []) {
    bikes.forEach((item) => this.rows.set(item.id, item));
  }
  private async before() {
    if (this.pending) await this.pending;
    if (this.error) throw this.error;
  }
  async list() {
    await this.before();
    return [...this.rows.values()];
  }
  async save(bike: Bike) {
    await this.before();
    this.rows.set(bike.id, bike);
  }
  async remove(id: string) {
    await this.before();
    this.rows.delete(id);
  }
}
