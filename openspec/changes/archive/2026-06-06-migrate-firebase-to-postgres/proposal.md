# Migración: Firebase → PostgreSQL + Python Backend

## Por qué migramos
- Firebase tiene costos impredecibles a escala
- Necesitamos queries relacionales complejas (Firestore no escala bien para eso)
- Mayor control sobre la lógica de negocio en el backend
- PostgreSQL en Neon: serverless, escalable, costo predecible

## Qué cambia
- Auth: Firebase Auth → JWT propio con bcrypt
- Database: Firestore → PostgreSQL (Neon)
- Backend: Firebase Functions → FastAPI (Python)

## Qué NO cambia
- El frontend en su mayor parte, solo si es necesario para mejorar el ux
- La lógica de UI y componentes
- Las rutas del front

## No es importante mantener 
-La informacion guardada en firebase ya que era un proyecto de pureba y lo estamos migrando para pasar aproduccion asi que no tiene imformacion relevante ni usuarios importantes


## Que hacer luego de la migracion y nueva implementacion

-Limpiar todo el codigo que tenga que ver con firebase y crear las pruebas unitarias y de integracion para cada endpoint del backend, los tests deben estar en la carpeta tests/ 