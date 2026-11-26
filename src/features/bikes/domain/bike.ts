export type BikeComponent = {
  id: string;
  name: string;
  serviceEveryKm: number;
  lastServiceKm: number;
  critical: boolean;
  active: boolean;
};
export type CheckAnswers = {
  air: boolean;
  brakes: boolean;
  chain: boolean;
  helmet: boolean;
  visibility: boolean;
};
export type CheckResult = "ready" | "attention";
export type RideCheck = {
  id: string;
  at: string;
  odometerKm: number;
  answers: CheckAnswers;
  result: CheckResult;
};
export type Bike = {
  id: string;
  name: string;
  type: string;
  odometerKm: number;
  components: BikeComponent[];
  checks: RideCheck[];
};
export interface BikeRepository {
  list(): Promise<Bike[]>;
  save(bike: Bike): Promise<void>;
  remove(id: string): Promise<void>;
}

const finite = (value: number) => Number.isFinite(value);
export function validateComponent(value: BikeComponent): BikeComponent {
  const name = value.name.trim();
  if (
    !value.id.trim() ||
    !name ||
    name.length > 60 ||
    !finite(value.serviceEveryKm) ||
    value.serviceEveryKm < 1 ||
    value.serviceEveryKm > 100000 ||
    !finite(value.lastServiceKm) ||
    value.lastServiceKm < 0
  ) {
    throw new Error("Revisa el nombre y los kilómetros del componente.");
  }
  return { ...value, name };
}
export function validateBike(value: Bike): Bike {
  const name = value.name.trim();
  const type = value.type.trim();
  if (
    !value.id.trim() ||
    !name ||
    name.length > 60 ||
    !type ||
    type.length > 40 ||
    !finite(value.odometerKm) ||
    value.odometerKm < 0 ||
    value.odometerKm > 1000000 ||
    value.components.length > 30
  ) {
    throw new Error("Revisa el nombre, tipo y odómetro de la bicicleta.");
  }
  const components = value.components.map(validateComponent);
  if (new Set(components.map((item) => item.id)).size !== components.length) {
    throw new Error("Hay componentes duplicados.");
  }
  return {
    ...value,
    name,
    type,
    components: [...components],
    checks: [...value.checks],
  };
}
export function dueComponents(bike: Bike): BikeComponent[] {
  const checked = validateBike(bike);
  return checked.components.filter(
    (item) =>
      item.active &&
      checked.odometerKm - item.lastServiceKm >= item.serviceEveryKm,
  );
}
export function componentProgress(bike: Bike, item: BikeComponent): number {
  return (
    Math.max(0, bike.odometerKm - item.lastServiceKm) / item.serviceEveryKm
  );
}
export function upsertComponent(bike: Bike, item: BikeComponent): Bike {
  return validateBike({
    ...bike,
    components: [
      ...bike.components.filter((value) => value.id !== item.id),
      validateComponent(item),
    ],
  });
}
export function removeComponent(bike: Bike, id: string): Bike {
  return validateBike({
    ...bike,
    components: bike.components.filter((item) => item.id !== id),
  });
}
export function toggleComponent(bike: Bike, id: string): Bike {
  if (!bike.components.some((item) => item.id === id)) {
    throw new Error("El componente ya no existe.");
  }
  return validateBike({
    ...bike,
    components: bike.components.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item,
    ),
  });
}
export function completeService(bike: Bike, id: string): Bike {
  if (!bike.components.some((item) => item.id === id)) {
    throw new Error("El componente ya no existe.");
  }
  return validateBike({
    ...bike,
    components: bike.components.map((item) =>
      item.id === id ? { ...item, lastServiceKm: bike.odometerKm } : item,
    ),
  });
}
export function evaluateCheck(answers: CheckAnswers): CheckResult {
  return Object.values(answers).every(Boolean) ? "ready" : "attention";
}
export function recordCheck(
  bike: Bike,
  answers: CheckAnswers,
  at: Date,
  id: string,
): Bike {
  const check: RideCheck = {
    id,
    at: at.toISOString(),
    odometerKm: bike.odometerKm,
    answers: { ...answers },
    result: evaluateCheck(answers),
  };
  return validateBike({ ...bike, checks: [check, ...bike.checks] });
}
export const resultLabel = (result: CheckResult) =>
  result === "ready" ? "Lista para rodar" : "Requiere atención";
