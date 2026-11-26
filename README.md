<!-- mobile-factory:hero -->
<div align="center">

# 🚲 Rodada Lista

### Revisa antes de pedalear

[![CI](https://github.com/GianSandoval5/react-native-rodada-lista/actions/workflows/ci.yml/badge.svg)](https://github.com/GianSandoval5/react-native-rodada-lista/actions/workflows/ci.yml)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-17353A?logo=expo)](https://expo.dev)
[![MIT](https://img.shields.io/badge/licencia-MIT-2F7D62.svg)](LICENSE)

[Problema](#qué-resuelve) · [Funciones](#funciones) · [Instalación](#instalación) · [MobileLab](#mobilelab-y-sqlite) · [Pruebas](#calidad-y-pruebas) · [Arquitectura](#arquitectura)

</div>

Rodada Lista organiza bicicletas, intervalos de servicio y un chequeo previo inspirado en aire, frenos y cadena. Añade casco y visibilidad como recordatorios explícitos y conserva cada comprobación en MobileLab SQLite.

> Es una ayuda de organización. No inspecciona físicamente la bicicleta, no determina que sea segura y no sustituye el manual, un taller cualificado ni las normas locales.

## Qué resuelve

Una bicicleta puede parecer lista aunque tenga presión insuficiente, frenos con problemas o mantenimiento vencido. Rodada Lista reúne en cinco pantallas lo que conviene comprobar, el kilometraje de servicio definido por el propio usuario y un historial auditable.

La NHTSA recomienda un chequeo rápido A‑B‑C antes de cada salida: aire, frenos y cadena, además de casco correctamente ajustado. La aplicación convierte ese recordatorio en un flujo, sin afirmar que la confirmación digital garantice seguridad.

## Funciones

| Pantalla | Flujo completo |
|---|---|
| Bicicletas | Carga, error recuperable, vacío, alta y resumen de mantenimiento. |
| Editor de bicicleta | Nombre, tipo y odómetro con validaciones. |
| Detalle | Componentes, progreso, activación, servicio realizado, historial y eliminación confirmada. |
| Editor de componente | Intervalo propio, último servicio y clasificación crítica. |
| Chequeo de salida | Aire, frenos, cadena, casco, visibilidad y snapshot histórico. |

También incluye diseño adaptable hasta tablet, controles accesibles, etiquetas para lector de pantalla y estados de carga/errores.

No se publican capturas inventadas. La pieza de LinkedIn es una ilustración promocional, no una captura de la interfaz.

## Stack verificado

- Expo SDK 57.0.x, React Native 0.86.3 y React 19.2.3.
- TypeScript 6 en modo estricto.
- Jest 29, `jest-expo` y Testing Library.
- MobileLab 1.1.0 mediante HTTP ordinario y persistencia SQLite.
- Node 22 en CI.

Las versiones resueltas quedan fijadas en `package-lock.json`. La matriz oficial de Expo relaciona SDK 57 con React Native 0.86, React 19.2.3 y Node 22.13 o posterior.

## Instalación

Necesitas Git, Node 22, npm, Expo compatible y Python 3.

```bash
git clone https://github.com/GianSandoval5/react-native-rodada-lista.git
cd react-native-rodada-lista
npm ci
npx expo-doctor
```

Descarga MobileLab 1.1.0 desde sus [releases oficiales](https://github.com/GianSandoval5/MobileLab/releases/tag/v1.1.0). En Linux x64 verifica:

```text
263305e2a0168d01af3334b5a62029e85bf0b319c20d343b35f4b3573459f953
```

Inicia el sandbox desde la raíz y mantenlo activo:

```bash
mobilelab start
```

En otra terminal:

```bash
npm start
```

## MobileLab y SQLite

[`mobilelab.yaml`](mobilelab.yaml) configura el proceso y [`mobilelab/data.yaml`](mobilelab/data.yaml) declara exclusivamente la colección `bikes`. Las semillas de `mobilelab/seeds/bikes.json` son sintéticas.

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/bikes` | Listar bicicletas, componentes y chequeos. |
| PUT | `/api/bikes/{id}` | Crear o reemplazar un documento estable. |
| DELETE | `/api/bikes/{id}` | Eliminar una bicicleta. |

MobileLab es un **sandbox local de desarrollo y CI**. No requiere cuenta, Docker ni URL cloud, pero su proceso debe estar ejecutándose. La app no usa los SDK de eventos como base de datos: el CRUD se realiza con HTTP normal. `mobilelab/data.db` conserva los cambios tras reiniciar el servicio.

### URL por plataforma

| Destino | Configuración |
|---|---|
| Android Emulator | `EXPO_PUBLIC_MOBILELAB_URL=http://10.0.2.2:4566` |
| iOS Simulator | `EXPO_PUBLIC_MOBILELAB_URL=http://127.0.0.1:4566` |
| Android físico por USB | `adb reverse tcp:4566 tcp:4566` y loopback |
| Dispositivo en LAN privada | `http://IP_DEL_EQUIPO:4566`, host/firewall limitados a una red confiable |

Ejemplo:

```bash
EXPO_PUBLIC_MOBILELAB_URL=http://10.0.2.2:4566 npm run android
```

No confirmes `*.db`, `*.db-*`, `.state.json`, claves ni datos reales.

## Calidad y pruebas

```bash
npx prettier --check App.tsx src test tool
npm run typecheck
npm test -- --ci --coverage
MOBILELAB_BIN=/ruta/mobilelab python3 scripts/verify_mobilelab.py
npx expo export --platform android
```

Las pruebas cubren reglas de kilometraje, componentes, snapshots, DTO, documentos anteriores, HTTP simulado, errores, red, timeout, estado recuperable y flujos de componentes. El contrato local tiene `auth.enabled: false`; por ello no se inventaron tokens ni pruebas de autenticación.

`verify_mobilelab.py` crea un directorio temporal y un puerto libre, compila el adaptador TypeScript, guarda una bicicleta con componente y chequeo, reinicia MobileLab, verifica todos los datos en SQLite y limpia únicamente el documento de integración.

GitHub Actions repite Prettier, TypeScript, Jest con cobertura, auditoría, licencias, Gitleaks, integración real y exportación Android con Metro. La exportación es un **bundle JavaScript, no un APK nativo**.

## Arquitectura

```text
src/features/bikes/
├── domain/bike.ts              modelos, reglas y BikeRepository
├── data/bikeDto.ts             validación y serialización
├── data/mobilelabRepository.ts cliente HTTP inyectable
└── presentation/               store, navegación y UI adaptable
```

`App.tsx` selecciona la URL e inyecta el repositorio. La presentación depende del contrato del dominio y las pruebas usan memoria o transporte HTTP simulado. Consulta la [guía para backend remoto](docs/integracion-remota.md).

## Límites y hoja de ruta

- Los intervalos los define el usuario: confirma siempre el manual del fabricante.
- No hay sensores, diagnóstico mecánico, GPS, cuentas ni sincronización multiusuario.
- El odómetro es manual y puede contener errores.
- MobileLab no debe exponerse a Internet ni usarse como backend de producción.
- Próximos pasos: plantillas opcionales por tipo, exportación accesible e implementación remota con identidad y control de conflictos.

El [registro de la entrega](docs/registro.md) documenta deduplicación y referencias.

## Autor, comunidad y licencia

**Gian Sandoval — Arquitecto Mobile.** Si Rodada Lista te resulta útil, déjale una ⭐.

[GitHub](https://github.com/GianSandoval5) · [LinkedIn](https://www.linkedin.com/in/giansandoval/) · [Web](https://giansandoval.com)

El código original usa [licencia MIT](LICENSE). Las dependencias conservan sus licencias, recopiladas en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Consulta [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) y [SECURITY.md](SECURITY.md).


## Conecta con Gian Sandoval

Si este proyecto te sirve, deja una ⭐ en el repositorio para apoyar la serie de proyectos abiertos.

- GitHub: https://github.com/GianSandoval5
- LinkedIn: https://www.linkedin.com/in/giansandoval/
- Web: https://giansandoval.com

**Gian Sandoval — Arquitecto Mobile**
