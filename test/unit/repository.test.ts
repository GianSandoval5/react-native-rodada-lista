import {
  DataError,
  MobileLabBikeRepository,
  Transport,
} from "../../src/features/bikes/data/mobilelabRepository";
import { decodeBike, encodeBike } from "../../src/features/bikes/data/bikeDto";
import { Bike } from "../../src/features/bikes/domain/bike";
const fixture: Bike = {
  id: "bici con espacio",
  name: "Ruta",
  type: "Ruta",
  odometerKm: 10,
  components: [],
  checks: [],
};
const response = (value: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => value,
  }) as Response;
describe("DTO y repositorio HTTP", () => {
  it("serializa documentos actuales y anteriores", () => {
    expect(decodeBike(encodeBike(fixture))).toEqual(fixture);
    const legacy = { ...fixture } as Record<string, unknown>;
    delete legacy.checks;
    delete legacy.components;
    expect(decodeBike(legacy)).toMatchObject({ checks: [], components: [] });
  });
  it("rechaza fechas y resultados incompatibles", () => {
    expect(() => decodeBike(null)).toThrow();
    expect(() =>
      decodeBike({
        ...fixture,
        checks: [
          {
            id: "c",
            at: "ayer",
            odometerKm: 1,
            answers: {
              air: true,
              brakes: true,
              chain: true,
              helmet: true,
              visibility: true,
            },
            result: "ready",
          },
        ],
      }),
    ).toThrow("Fecha");
    expect(() =>
      decodeBike({
        ...fixture,
        checks: [
          {
            id: "c",
            at: "2026-11-26T00:00:00Z",
            odometerKm: 1,
            answers: {
              air: true,
              brakes: true,
              chain: true,
              helmet: true,
              visibility: true,
            },
            result: "other",
          },
        ],
      }),
    ).toThrow("Resultado");
  });
  it("usa GET, PUT y DELETE en las rutas declaradas", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const transport: Transport = jest.fn(async (url, init) => {
      calls.push({ url: String(url), init });
      return response(init?.method === "PUT" ? {} : [fixture]);
    });
    const repo = new MobileLabBikeRepository("http://local/", transport);
    await repo.list();
    await repo.save(fixture);
    await repo.remove(fixture.id);
    expect(calls.map((item) => [item.url, item.init?.method ?? "GET"])).toEqual(
      [
        ["http://local/api/bikes", "GET"],
        ["http://local/api/bikes/bici%20con%20espacio", "PUT"],
        ["http://local/api/bikes/bici%20con%20espacio", "DELETE"],
      ],
    );
  });
  it("traduce HTTP, red, timeout y JSON inválido", async () => {
    await expect(
      new MobileLabBikeRepository(
        "http://x",
        jest.fn(async () => response({}, 503)),
      ).list(),
    ).rejects.toThrow("503");
    await expect(
      new MobileLabBikeRepository(
        "http://x",
        jest.fn(async () => {
          throw new TypeError("off");
        }),
      ).list(),
    ).rejects.toThrow("conectar");
    await expect(
      new MobileLabBikeRepository(
        "http://x",
        jest.fn(async () => response({})),
      ).list(),
    ).rejects.toThrow("colección");
    const slow: Transport = jest.fn(
      async (_u, init) =>
        new Promise((_r, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          ),
        ),
    );
    await expect(
      new MobileLabBikeRepository("http://x", slow, 5).list(),
    ).rejects.toBeInstanceOf(DataError);
  });
});
