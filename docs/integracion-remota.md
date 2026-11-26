# Sustituir MobileLab por un backend de producción

La aplicación depende de `BikeRepository`; actualmente `App.tsx` inyecta `MobileLabBikeRepository`. No existe un backend alojado ni una cuenta conectada.

1. Publica el documento de `mobilelab/seeds/bikes.json` como esquema OpenAPI versionado.
2. Implementa otro `BikeRepository` con un transporte HTTPS inyectado.
3. Añade identidad de corta duración, autorización por propietario y almacenamiento seguro; prueba 401, 403, renovación y revocación cuando el contrato los defina.
4. Usa versiones o `ETag` para evitar que dos dispositivos sobrescriban componentes o chequeos.
5. Migra solo datos autorizados y no reutilices las semillas.
6. Cambia la composición en `App.tsx`, conserva las pruebas del dominio/estado y agrega pruebas contractuales contra un entorno aislado.

El servidor debe validar tamaños, identificadores, fechas y propiedad. La aplicación nunca debe llevar secretos de administración.
