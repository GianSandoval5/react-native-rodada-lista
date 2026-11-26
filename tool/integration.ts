import assert from "node:assert/strict";
import { MobileLabBikeRepository } from "../src/features/bikes/data/mobilelabRepository";
import { Bike, recordCheck } from "../src/features/bikes/domain/bike";

async function main() {
  const repository = new MobileLabBikeRepository(process.argv[2]);
  const phase = process.argv[3];
  const id = "integration-bike";
  if (phase === "write") {
    const seeded = await repository.list();
    assert.ok(seeded.some((item) => item.id === "demo-urbana"));
    const bike: Bike = {
      id,
      name: "Bici sintética",
      type: "Ruta",
      odometerKm: 620,
      components: [
        {
          id: "chain",
          name: "Cadena demo",
          serviceEveryKm: 500,
          lastServiceKm: 0,
          critical: true,
          active: true,
        },
      ],
      checks: [],
    };
    await repository.save(
      recordCheck(
        bike,
        {
          air: true,
          brakes: true,
          chain: true,
          helmet: true,
          visibility: true,
        },
        new Date("2026-11-26T13:00:00Z"),
        "check-integration",
      ),
    );
    const saved = (await repository.list()).find((item) => item.id === id);
    assert.equal(saved?.components.length, 1);
    assert.equal(saved?.checks.length, 1);
    return;
  }
  assert.equal(phase, "restart");
  const restored = (await repository.list()).find((item) => item.id === id);
  assert.ok(restored);
  assert.equal(restored.name, "Bici sintética");
  assert.equal(restored.components[0].name, "Cadena demo");
  assert.equal(restored.checks[0].result, "ready");
  await repository.remove(id);
  assert.equal(
    (await repository.list()).some((item) => item.id === id),
    false,
  );
  assert.ok(
    (await repository.list()).some((item) => item.id === "demo-urbana"),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
