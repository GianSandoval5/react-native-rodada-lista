import { Bike, CheckAnswers, RideCheck, validateBike } from "../domain/bike";
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Documento de bicicleta inválido.");
  return value as Record<string, unknown>;
};
const text = (value: unknown, label: string) => {
  if (typeof value !== "string") throw new Error(label + " inválido.");
  return value;
};
const number = (value: unknown, label: string) => {
  if (typeof value !== "number") throw new Error(label + " inválido.");
  return value;
};
const bool = (value: unknown, label: string) => {
  if (typeof value !== "boolean") throw new Error(label + " inválido.");
  return value;
};
const answers = (raw: unknown): CheckAnswers => {
  const v = object(raw);
  return {
    air: bool(v.air, "Aire"),
    brakes: bool(v.brakes, "Frenos"),
    chain: bool(v.chain, "Cadena"),
    helmet: bool(v.helmet, "Casco"),
    visibility: bool(v.visibility, "Visibilidad"),
  };
};
export function decodeBike(raw: unknown): Bike {
  const v = object(raw);
  const components = (Array.isArray(v.components) ? v.components : []).map(
    (rawItem) => {
      const item = object(rawItem);
      return {
        id: text(item.id, "ID"),
        name: text(item.name, "Nombre"),
        serviceEveryKm: number(item.serviceEveryKm, "Intervalo"),
        lastServiceKm: number(item.lastServiceKm, "Servicio"),
        critical: bool(item.critical, "Crítico"),
        active: bool(item.active, "Activo"),
      };
    },
  );
  const checks = (Array.isArray(v.checks) ? v.checks : []).map((rawCheck) => {
    const item = object(rawCheck);
    const at = text(item.at, "Fecha");
    if (Number.isNaN(Date.parse(at))) throw new Error("Fecha inválida.");
    const result = text(item.result, "Resultado");
    if (result !== "ready" && result !== "attention")
      throw new Error("Resultado inválido.");
    return {
      id: text(item.id, "ID"),
      at,
      odometerKm: number(item.odometerKm, "Odómetro"),
      answers: answers(item.answers),
      result,
    } as RideCheck;
  });
  return validateBike({
    id: text(v.id, "ID"),
    name: text(v.name, "Nombre"),
    type: text(v.type, "Tipo"),
    odometerKm: number(v.odometerKm, "Odómetro"),
    components,
    checks,
  });
}
export const encodeBike = (bike: Bike) => validateBike(bike);
