import { Bike, BikeRepository } from "../domain/bike";
export type BikeSnapshot = {
  bikes: Bike[];
  busy: boolean;
  error: string | null;
};
export class BikeStore {
  private state: BikeSnapshot = { bikes: [], busy: false, error: null };
  private listeners = new Set<() => void>();
  constructor(private readonly repository: BikeRepository) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  snapshot = () => this.state;
  private emit() {
    this.listeners.forEach((listener) => listener());
  }
  private async run(operation: () => Promise<void>) {
    if (this.state.busy) return false;
    this.state = { ...this.state, busy: true, error: null };
    this.emit();
    try {
      await operation();
      return true;
    } catch (error) {
      this.state = {
        ...this.state,
        error: error instanceof Error ? error.message : "Error inesperado.",
      };
      return false;
    } finally {
      this.state = { ...this.state, busy: false };
      this.emit();
    }
  }
  refresh = () =>
    this.run(async () => {
      this.state = { ...this.state, bikes: await this.repository.list() };
    });
  save = (bike: Bike) =>
    this.run(async () => {
      await this.repository.save(bike);
      this.state = {
        ...this.state,
        bikes: [
          ...this.state.bikes.filter((item) => item.id !== bike.id),
          bike,
        ],
      };
    });
  remove = (id: string) =>
    this.run(async () => {
      await this.repository.remove(id);
      this.state = {
        ...this.state,
        bikes: this.state.bikes.filter((item) => item.id !== id),
      };
    });
}
