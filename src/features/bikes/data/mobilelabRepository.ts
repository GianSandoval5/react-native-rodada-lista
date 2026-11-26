import { Bike, BikeRepository } from "../domain/bike";
import { decodeBike, encodeBike } from "./bikeDto";
export type Transport = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;
export class DataError extends Error {}
export class MobileLabBikeRepository implements BikeRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly transport: Transport = fetch,
    private readonly timeoutMs = 5000,
  ) {}
  private url(id?: string) {
    return (
      this.baseUrl.replace(/\/$/, "") +
      "/api/bikes" +
      (id ? "/" + encodeURIComponent(id) : "")
    );
  }
  private async request(url: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.transport(url, {
        ...init,
        signal: controller.signal,
      });
      if (!response.ok)
        throw new DataError(`MobileLab respondió HTTP ${response.status}.`);
      return response;
    } catch (error) {
      if (error instanceof DataError) throw error;
      if (error instanceof DOMException && error.name === "AbortError")
        throw new DataError("MobileLab tardó demasiado en responder.");
      throw new DataError("No se pudo conectar con MobileLab.");
    } finally {
      clearTimeout(timer);
    }
  }
  async list() {
    const response = await this.request(this.url());
    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      throw new DataError("MobileLab devolvió JSON incompatible.");
    }
    if (!Array.isArray(raw))
      throw new DataError("MobileLab devolvió una colección incompatible.");
    try {
      return raw.map(decodeBike);
    } catch {
      throw new DataError("No se pudo leer una bicicleta de MobileLab.");
    }
  }
  async save(bike: Bike) {
    await this.request(this.url(bike.id), {
      method: "PUT",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(encodeBike(bike)),
    });
  }
  async remove(id: string) {
    await this.request(this.url(id), { method: "DELETE" });
  }
}
