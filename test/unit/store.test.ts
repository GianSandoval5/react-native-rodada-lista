import { Bike } from "../../src/features/bikes/domain/bike";
import { BikeStore } from "../../src/features/bikes/presentation/store";
import { MemoryRepository } from "../support/memoryRepository";
const bike: Bike = {
  id: "b",
  name: "Urbana",
  type: "Ciudad",
  odometerKm: 10,
  components: [],
  checks: [],
};
describe("estado observable", () => {
  it("carga, guarda y elimina tras confirmar el repositorio", async () => {
    const repository = new MemoryRepository([bike]);
    const store = new BikeStore(repository);
    const states: boolean[] = [];
    store.subscribe(() => states.push(store.snapshot().busy));
    expect(await store.refresh()).toBe(true);
    expect(store.snapshot().bikes).toEqual([bike]);
    expect(await store.save({ ...bike, name: "Editada" })).toBe(true);
    expect(store.snapshot().bikes[0].name).toBe("Editada");
    expect(await store.remove("b")).toBe(true);
    expect(store.snapshot().bikes).toEqual([]);
    expect(states).toContain(true);
  });
  it("conserva datos confirmados y permite recuperarse", async () => {
    const repository = new MemoryRepository([bike]);
    const store = new BikeStore(repository);
    await store.refresh();
    repository.error = new Error("Fallo simulado");
    expect(await store.save({ ...bike, name: "No" })).toBe(false);
    expect(store.snapshot().bikes[0].name).toBe("Urbana");
    expect(store.snapshot().error).toBe("Fallo simulado");
    repository.error = null;
    expect(await store.save({ ...bike, name: "Sí" })).toBe(true);
    expect(store.snapshot().error).toBeNull();
  });
  it("ignora operaciones superpuestas", async () => {
    let release: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const repository = new MemoryRepository([bike]);
    repository.pending = pending;
    const store = new BikeStore(repository);
    const first = store.refresh();
    expect(await store.remove("b")).toBe(false);
    release();
    await first;
    expect(store.snapshot().busy).toBe(false);
  });
});
