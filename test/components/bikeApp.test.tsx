import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { BikeApp } from "../../src/features/bikes/presentation/BikeApp";
import { Bike } from "../../src/features/bikes/domain/bike";
import { BikeStore } from "../../src/features/bikes/presentation/store";
import { MemoryRepository } from "../support/memoryRepository";
const fixture = (patch: Partial<Bike> = {}): Bike => ({
  id: "bike",
  name: "Urbana",
  type: "Ciudad",
  odometerKm: 1000,
  components: [
    {
      id: "chain",
      name: "Cadena",
      serviceEveryKm: 500,
      lastServiceKm: 400,
      critical: true,
      active: true,
    },
  ],
  checks: [],
  ...patch,
});
const renderApp = (repository: MemoryRepository) =>
  render(<BikeApp store={new BikeStore(repository)} endpoint="http://local" />);
describe("flujos críticos", () => {
  it("muestra vacío, valida y crea una bicicleta", async () => {
    const repository = new MemoryRepository();
    const screen = renderApp(repository);
    expect(
      await screen.findByText("Tu primera rodada empieza aquí"),
    ).toBeTruthy();
    fireEvent.press(screen.getByText("Agregar bicicleta"));
    fireEvent.press(screen.getByText("Guardar bicicleta"));
    expect(
      screen.getByText("Revisa el nombre, tipo y odómetro de la bicicleta."),
    ).toBeTruthy();
    fireEvent.changeText(
      screen.getByLabelText("Nombre de la bicicleta"),
      "Ruta azul",
    );
    fireEvent.changeText(screen.getByLabelText("Tipo"), "Ruta");
    fireEvent.changeText(screen.getByLabelText("Odómetro actual (km)"), "25");
    fireEvent.press(screen.getByText("Guardar bicicleta"));
    expect(await screen.findByText("25 km registrados")).toBeTruthy();
    expect(repository.rows.get([...repository.rows.keys()][0])?.name).toBe(
      "Ruta azul",
    );
  });
  it("completa un servicio vencido", async () => {
    const repository = new MemoryRepository([fixture()]);
    const screen = renderApp(repository);
    fireEvent.press(await screen.findByLabelText("Abrir Urbana"));
    expect(
      await screen.findByText("1 componentes necesitan atención"),
    ).toBeTruthy();
    fireEvent.press(screen.getByText("Marcar servicio realizado"));
    await waitFor(() =>
      expect(repository.rows.get("bike")?.components[0].lastServiceKm).toBe(
        1000,
      ),
    );
    expect(
      await screen.findByText(
        "Mantenimiento dentro de los intervalos definidos",
      ),
    ).toBeTruthy();
  });
  it("exige el chequeo completo y guarda el historial", async () => {
    const repository = new MemoryRepository([fixture()]);
    const screen = renderApp(repository);
    fireEvent.press(await screen.findByLabelText("Abrir Urbana"));
    fireEvent.press(screen.getByText("Chequeo antes de salir"));
    fireEvent.press(screen.getByText("Guardar chequeo"));
    expect(
      screen.getByText("Revisa los puntos pendientes antes de guardar."),
    ).toBeTruthy();
    for (const title of ["Aire", "Frenos", "Cadena", "Casco", "Visibilidad"]) {
      fireEvent(
        screen.getByLabelText(`Confirmar ${title}`),
        "valueChange",
        true,
      );
    }
    expect(screen.getByText("Bicicleta lista")).toBeTruthy();
    fireEvent.press(screen.getByText("Guardar chequeo"));
    await waitFor(() =>
      expect(repository.rows.get("bike")?.checks).toHaveLength(1),
    );
    expect(await screen.findByText("Lista para rodar")).toBeTruthy();
  });
  it("muestra error y reintenta", async () => {
    const repository = new MemoryRepository();
    repository.error = new Error("servicio detenido");
    const screen = renderApp(repository);
    expect(await screen.findByText("servicio detenido")).toBeTruthy();
    repository.error = null;
    fireEvent.press(screen.getByText("Reintentar"));
    expect(
      await screen.findByText("Tu primera rodada empieza aquí"),
    ).toBeTruthy();
  });
});
