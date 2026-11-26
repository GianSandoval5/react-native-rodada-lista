import React, { useEffect, useState, useSyncExternalStore } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  Bike,
  BikeComponent,
  CheckAnswers,
  completeService,
  componentProgress,
  dueComponents,
  recordCheck,
  removeComponent,
  resultLabel,
  toggleComponent,
  upsertComponent,
  validateBike,
} from "../domain/bike";
import { BikeStore } from "./store";
import { Button, Card, colors, ErrorNotice, Field, Hero, Page } from "./ui";

type Route =
  | { name: "home" }
  | { name: "bike-form"; bikeId?: string }
  | { name: "detail"; bikeId: string }
  | { name: "component-form"; bikeId: string; componentId?: string }
  | { name: "check"; bikeId: string };
const id = (prefix: string) =>
  prefix +
  "-" +
  Date.now().toString(36) +
  Math.random().toString(36).slice(2, 7);
const number = (value: string) => Number(value.replace(",", "."));
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function BikeApp({
  store,
  endpoint,
}: {
  store: BikeStore;
  endpoint: string;
}) {
  const snapshot = useSyncExternalStore(store.subscribe, store.snapshot);
  const [route, setRoute] = useState<Route>({ name: "home" });
  useEffect(() => {
    void store.refresh();
  }, [store]);
  const bike =
    "bikeId" in route
      ? snapshot.bikes.find((item) => item.id === route.bikeId)
      : undefined;
  useEffect(() => {
    if ("bikeId" in route && !snapshot.busy && !bike)
      setRoute({ name: "home" });
  }, [bike, route, snapshot.busy]);
  return (
    <>
      <StatusBar style="dark" />
      {route.name === "home" ? (
        <Home
          store={store}
          snapshot={snapshot}
          endpoint={endpoint}
          open={(bikeId) => setRoute({ name: "detail", bikeId })}
          create={() => setRoute({ name: "bike-form" })}
        />
      ) : route.name === "bike-form" ? (
        <BikeForm
          store={store}
          existing={bike}
          busy={snapshot.busy}
          error={snapshot.error}
          close={() =>
            setRoute(
              bike ? { name: "detail", bikeId: bike.id } : { name: "home" },
            )
          }
          saved={(bikeId) => setRoute({ name: "detail", bikeId })}
        />
      ) : route.name === "detail" && bike ? (
        <Detail
          bike={bike}
          store={store}
          busy={snapshot.busy}
          error={snapshot.error}
          back={() => setRoute({ name: "home" })}
          edit={() => setRoute({ name: "bike-form", bikeId: bike.id })}
          component={(componentId) =>
            setRoute({ name: "component-form", bikeId: bike.id, componentId })
          }
          check={() => setRoute({ name: "check", bikeId: bike.id })}
        />
      ) : route.name === "component-form" && bike ? (
        <ComponentForm
          bike={bike}
          component={bike.components.find(
            (item) => item.id === route.componentId,
          )}
          store={store}
          busy={snapshot.busy}
          error={snapshot.error}
          close={() => setRoute({ name: "detail", bikeId: bike.id })}
        />
      ) : route.name === "check" && bike ? (
        <RideCheckScreen
          bike={bike}
          store={store}
          busy={snapshot.busy}
          error={snapshot.error}
          close={() => setRoute({ name: "detail", bikeId: bike.id })}
        />
      ) : (
        <Page title="Rodada Lista" busy>
          <Text>Cargando bicicleta…</Text>
        </Page>
      )}
    </>
  );
}

function Home({
  store,
  snapshot,
  endpoint,
  open,
  create,
}: {
  store: BikeStore;
  snapshot: ReturnType<BikeStore["snapshot"]>;
  endpoint: string;
  open: (id: string) => void;
  create: () => void;
}) {
  const ready = snapshot.bikes.filter(
    (bike) => dueComponents(bike).length === 0,
  ).length;
  return (
    <Page title="Rodada Lista" busy={snapshot.busy}>
      <Hero
        eyebrow="BICI · CHEQUEO · SERVICIO"
        title="Sal con la bici revisada"
        detail={`${snapshot.bikes.length} bicicletas · ${ready} sin servicios vencidos`}
      />
      <Button
        label="Agregar bicicleta"
        onPress={create}
        disabled={snapshot.busy}
      />
      <ErrorNotice
        message={snapshot.error}
        retry={() => void store.refresh()}
      />
      {!snapshot.busy && !snapshot.error && snapshot.bikes.length === 0 ? (
        <Card>
          <Text style={s.title}>Tu primera rodada empieza aquí</Text>
          <Text style={s.muted}>
            Registra una bicicleta y completa el chequeo A‑B‑C antes de salir.
          </Text>
        </Card>
      ) : (
        snapshot.bikes.map((bike) => {
          const due = dueComponents(bike);
          return (
            <Card
              key={bike.id}
              onPress={() => open(bike.id)}
              label={`Abrir ${bike.name}`}
            >
              <View style={s.row}>
                <View style={s.flex}>
                  <Text style={s.title}>{bike.name}</Text>
                  <Text style={s.muted}>
                    {bike.type} · {bike.odometerKm} km
                  </Text>
                </View>
                <Pill
                  attention={due.length > 0}
                  text={due.length ? `${due.length} por revisar` : "Al día"}
                />
              </View>
              <Text style={s.small}>
                {bike.components.length} componentes · {bike.checks.length}{" "}
                chequeos
              </Text>
            </Card>
          );
        })
      )}
      <Text style={s.endpoint}>Sandbox: {endpoint}</Text>
    </Page>
  );
}

function BikeForm({
  store,
  existing,
  busy,
  error,
  close,
  saved,
}: {
  store: BikeStore;
  existing?: Bike;
  busy: boolean;
  error: string | null;
  close: () => void;
  saved: (id: string) => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState(existing?.type ?? "");
  const [odometer, setOdometer] = useState(
    existing?.odometerKm.toString() ?? "",
  );
  const [validation, setValidation] = useState<string | null>(null);
  const submit = async () => {
    try {
      const bike = validateBike({
        id: existing?.id ?? id("bike"),
        name,
        type,
        odometerKm: number(odometer),
        components: existing?.components ?? [],
        checks: existing?.checks ?? [],
      });
      setValidation(null);
      if (await store.save(bike)) saved(bike.id);
    } catch (reason) {
      setValidation(
        reason instanceof Error ? reason.message : "Revisa el formulario.",
      );
    }
  };
  return (
    <Page title={existing ? "Editar bicicleta" : "Nueva bicicleta"} busy={busy}>
      <Hero
        eyebrow="PERFIL"
        title={existing ? "Actualiza tu bici" : "Registra tu bici"}
        detail="El odómetro permite calcular servicios por distancia."
      />
      <Field
        label="Nombre de la bicicleta"
        value={name}
        onChangeText={setName}
        placeholder="Ej. Urbana verde"
      />
      <Field
        label="Tipo"
        value={type}
        onChangeText={setType}
        placeholder="Urbana, montaña, ruta…"
      />
      <Field
        label="Odómetro actual (km)"
        value={odometer}
        onChangeText={setOdometer}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <ErrorNotice message={validation ?? error} />
      <Button
        label="Guardar bicicleta"
        onPress={() => void submit()}
        disabled={busy}
      />
      <Button label="Cancelar" onPress={close} secondary disabled={busy} />
    </Page>
  );
}

function Detail({
  bike,
  store,
  busy,
  error,
  back,
  edit,
  component,
  check,
}: {
  bike: Bike;
  store: BikeStore;
  busy: boolean;
  error: string | null;
  back: () => void;
  edit: () => void;
  component: (id?: string) => void;
  check: () => void;
}) {
  const due = dueComponents(bike);
  const remove = () =>
    Alert.alert(
      "Eliminar bicicleta",
      "Se eliminarán sus componentes y chequeos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => void store.remove(bike.id).then((ok) => ok && back()),
        },
      ],
    );
  return (
    <Page title={bike.name} busy={busy}>
      <Hero
        eyebrow={bike.type.toUpperCase()}
        title={`${bike.odometerKm} km registrados`}
        detail={
          due.length
            ? `${due.length} componentes necesitan atención`
            : "Mantenimiento dentro de los intervalos definidos"
        }
      />
      <View style={s.actions}>
        <Button
          label="Chequeo antes de salir"
          onPress={check}
          disabled={busy}
        />
        <Button
          label="Editar perfil"
          onPress={edit}
          secondary
          disabled={busy}
        />
      </View>
      <ErrorNotice message={error} />
      <View style={s.row}>
        <Text style={s.section}>Componentes</Text>
        <Pressable accessibilityRole="button" onPress={() => component()}>
          <Text style={s.link}>+ Agregar</Text>
        </Pressable>
      </View>
      {bike.components.length === 0 ? (
        <Card>
          <Text style={s.muted}>
            Aún no hay componentes. Añade frenos, cadena o neumáticos.
          </Text>
        </Card>
      ) : (
        bike.components.map((item) => {
          const progress = componentProgress(bike, item);
          const expired = item.active && progress >= 1;
          return (
            <Card key={item.id}>
              <View style={s.row}>
                <Pressable
                  style={s.flex}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${item.name}`}
                  onPress={() => component(item.id)}
                >
                  <Text style={s.title}>
                    {item.name}
                    {item.critical ? " · crítico" : ""}
                  </Text>
                  <Text style={s.muted}>
                    Cada {item.serviceEveryKm} km · último: {item.lastServiceKm}{" "}
                    km
                  </Text>
                </Pressable>
                <Switch
                  accessibilityLabel={`Seguir ${item.name}`}
                  value={item.active}
                  onValueChange={() =>
                    void store.save(toggleComponent(bike, item.id))
                  }
                />
              </View>
              <View style={s.meter}>
                <View
                  style={[
                    s.meterFill,
                    {
                      width: `${Math.min(progress, 1) * 100}%`,
                      backgroundColor: expired ? colors.red : colors.green,
                    },
                  ]}
                />
              </View>
              {expired && (
                <Button
                  label="Marcar servicio realizado"
                  onPress={() =>
                    void store.save(completeService(bike, item.id))
                  }
                  secondary
                  disabled={busy}
                />
              )}
            </Card>
          );
        })
      )}
      <Text style={s.section}>Últimos chequeos</Text>
      {bike.checks.length === 0 ? (
        <Card>
          <Text style={s.muted}>Sin chequeos guardados.</Text>
        </Card>
      ) : (
        bike.checks.slice(0, 3).map((item) => (
          <Card key={item.id}>
            <View style={s.row}>
              <Text style={s.title}>{resultLabel(item.result)}</Text>
              <Pill
                attention={item.result !== "ready"}
                text={`${item.odometerKm} km`}
              />
            </View>
            <Text style={s.muted}>{dateLabel(item.at)}</Text>
          </Card>
        ))
      )}
      <Button
        label="Eliminar bicicleta"
        onPress={remove}
        secondary
        disabled={busy}
      />
      <Button label="Volver" onPress={back} secondary />
    </Page>
  );
}

function ComponentForm({
  bike,
  component,
  store,
  busy,
  error,
  close,
}: {
  bike: Bike;
  component?: BikeComponent;
  store: BikeStore;
  busy: boolean;
  error: string | null;
  close: () => void;
}) {
  const [name, setName] = useState(component?.name ?? "");
  const [interval, setInterval] = useState(
    component?.serviceEveryKm.toString() ?? "",
  );
  const [last, setLast] = useState(
    component?.lastServiceKm.toString() ?? bike.odometerKm.toString(),
  );
  const [critical, setCritical] = useState(component?.critical ?? false);
  const [validation, setValidation] = useState<string | null>(null);
  const submit = async () => {
    try {
      const next = upsertComponent(bike, {
        id: component?.id ?? id("part"),
        name,
        serviceEveryKm: number(interval),
        lastServiceKm: number(last),
        critical,
        active: component?.active ?? true,
      });
      setValidation(null);
      if (await store.save(next)) close();
    } catch (reason) {
      setValidation(
        reason instanceof Error ? reason.message : "Revisa el formulario.",
      );
    }
  };
  const remove = async () => {
    if (component && (await store.save(removeComponent(bike, component.id))))
      close();
  };
  return (
    <Page
      title={component ? "Editar componente" : "Nuevo componente"}
      busy={busy}
    >
      <Hero
        eyebrow="MANTENIMIENTO"
        title="Define tu propio intervalo"
        detail="Los kilómetros son orientativos: sigue también el manual y la inspección profesional."
      />
      <Field
        label="Componente"
        value={name}
        onChangeText={setName}
        placeholder="Ej. Cadena"
      />
      <Field
        label="Servicio cada (km)"
        value={interval}
        onChangeText={setInterval}
        keyboardType="numeric"
        placeholder="500"
      />
      <Field
        label="Kilometraje del último servicio"
        value={last}
        onChangeText={setLast}
        keyboardType="numeric"
      />
      <View style={s.row}>
        <View style={s.flex}>
          <Text style={s.title}>Componente crítico</Text>
          <Text style={s.muted}>
            Destaca elementos relevantes para control y frenado.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Componente crítico"
          value={critical}
          onValueChange={setCritical}
        />
      </View>
      <ErrorNotice message={validation ?? error} />
      <Button
        label="Guardar componente"
        onPress={() => void submit()}
        disabled={busy}
      />
      {component && (
        <Button
          label="Eliminar componente"
          onPress={() => void remove()}
          secondary
          disabled={busy}
        />
      )}
      <Button label="Cancelar" onPress={close} secondary disabled={busy} />
    </Page>
  );
}

const checks: [keyof CheckAnswers, string, string][] = [
  ["air", "Aire", "Presión y estado de neumáticos"],
  ["brakes", "Frenos", "Respuesta, pastillas y cables"],
  ["chain", "Cadena", "Limpia, lubricada y libre"],
  ["helmet", "Casco", "Ajustado antes de salir"],
  ["visibility", "Visibilidad", "Luces o reflectantes cuando corresponda"],
];
function RideCheckScreen({
  bike,
  store,
  busy,
  error,
  close,
}: {
  bike: Bike;
  store: BikeStore;
  busy: boolean;
  error: string | null;
  close: () => void;
}) {
  const [answers, setAnswers] = useState<CheckAnswers>({
    air: false,
    brakes: false,
    chain: false,
    helmet: false,
    visibility: false,
  });
  const [validation, setValidation] = useState<string | null>(null);
  const missing = checks.filter(([key]) => !answers[key]);
  const save = async () => {
    if (missing.length) {
      setValidation("Revisa los puntos pendientes antes de guardar.");
      return;
    }
    const next = recordCheck(bike, answers, new Date(), id("check"));
    if (await store.save(next)) close();
  };
  return (
    <Page title="Chequeo de salida" busy={busy}>
      <Hero
        eyebrow="A‑B‑C + PROTECCIÓN"
        title={
          missing.length
            ? `${missing.length} puntos pendientes`
            : "Bicicleta lista"
        }
        detail="Comprueba cada punto físicamente. La app no inspecciona la bicicleta por ti."
      />
      {checks.map(([key, title, detail]) => (
        <Card key={key}>
          <View style={s.row}>
            <View style={s.flex}>
              <Text style={s.title}>{title}</Text>
              <Text style={s.muted}>{detail}</Text>
            </View>
            <Switch
              accessibilityLabel={`Confirmar ${title}`}
              value={answers[key]}
              onValueChange={(value) =>
                setAnswers((current) => ({ ...current, [key]: value }))
              }
            />
          </View>
        </Card>
      ))}
      <ErrorNotice message={validation ?? error} />
      <Button
        label="Guardar chequeo"
        onPress={() => void save()}
        disabled={busy}
      />
      <Button label="Cancelar" onPress={close} secondary />
    </Page>
  );
}

function Pill({ attention, text }: { attention: boolean; text: string }) {
  return (
    <View style={[s.pill, attention && s.pillAttention]}>
      <Text style={[s.pillText, attention && s.pillAttentionText]}>{text}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
  title: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  muted: { color: colors.muted, lineHeight: 20 },
  small: { color: colors.muted, fontSize: 12 },
  section: { color: colors.ink, fontSize: 21, fontWeight: "900", flex: 1 },
  link: { color: colors.green, fontWeight: "800", fontSize: 16 },
  actions: { gap: 10 },
  pill: {
    backgroundColor: "#E1F0E8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillAttention: { backgroundColor: "#FBE9E4" },
  pillText: { color: colors.green, fontSize: 12, fontWeight: "800" },
  pillAttentionText: { color: colors.red },
  meter: {
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.sand,
    overflow: "hidden",
  },
  meterFill: { height: 8, borderRadius: 8 },
  endpoint: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
    marginTop: 12,
  },
});
