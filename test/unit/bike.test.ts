import {
  Bike,
  completeService,
  dueComponents,
  evaluateCheck,
  recordCheck,
  removeComponent,
  toggleComponent,
  upsertComponent,
  validateBike,
} from "../../src/features/bikes/domain/bike";
const bike = (patch: Partial<Bike> = {}): Bike => ({
  id: "bike",
  name: "Urbana",
  type: "Ciudad",
  odometerKm: 1000,
  components: [],
  checks: [],
  ...patch,
});
const chain = {
  id: "chain",
  name: " Cadena ",
  serviceEveryKm: 500,
  lastServiceKm: 400,
  critical: true,
  active: true,
};
describe("reglas de bicicleta", () => {
  it("detecta únicamente componentes activos con intervalo vencido", () => {
    const value = bike({
      components: [
        chain,
        { ...chain, id: "tire", name: "Llanta", lastServiceKm: 800 },
        { ...chain, id: "off", active: false },
      ],
    });
    expect(dueComponents(value).map((item) => item.id)).toEqual(["chain"]);
  });
  it("administra componentes sin mutar la bicicleta", () => {
    const base = bike();
    const added = upsertComponent(base, chain);
    expect(base.components).toHaveLength(0);
    expect(added.components[0].name).toBe("Cadena");
    expect(toggleComponent(added, "chain").components[0].active).toBe(false);
    expect(removeComponent(added, "chain").components).toHaveLength(0);
  });
  it("marca servicio en el odómetro actual", () => {
    const value = completeService(bike({ components: [chain] }), "chain");
    expect(value.components[0].lastServiceKm).toBe(1000);
    expect(dueComponents(value)).toEqual([]);
  });
  it("requiere todos los puntos y conserva un snapshot", () => {
    const answers = {
      air: true,
      brakes: true,
      chain: true,
      helmet: true,
      visibility: false,
    };
    expect(evaluateCheck(answers)).toBe("attention");
    const checked = recordCheck(
      bike(),
      { ...answers, visibility: true },
      new Date("2026-11-26T13:00:00Z"),
      "c",
    );
    expect(checked.checks[0]).toMatchObject({
      result: "ready",
      odometerKm: 1000,
    });
    expect(checked.checks[0].answers).not.toBe(answers);
  });
  it("rechaza magnitudes, duplicados e identificadores ausentes", () => {
    expect(() => validateBike(bike({ odometerKm: -1 }))).toThrow();
    expect(() =>
      validateBike(bike({ components: [chain, { ...chain }] })),
    ).toThrow("duplicados");
    expect(() => toggleComponent(bike(), "missing")).toThrow("no existe");
    expect(() =>
      upsertComponent(bike(), { ...chain, serviceEveryKm: 0 }),
    ).toThrow();
  });
});
