# Guía de Despliegue - Cuadra App

Esta guía explica cómo generar los ejecutables de la aplicación (Android APK/AAB e iOS IPA) utilizando **Expo Application Services (EAS)**.

## 1. Prerrequisitos

Asegúrate de tener instaladas las siguientes herramientas:

- **Node.js** (LTS recomendado)
- **Git**
- **Cuenta en Expo:** Regístrate en [expo.dev](https://expo.dev).
- **EAS CLI:** Instálalo globalmente:

  ```bash
  npm install -g eas-cli
  ```

## 2. Configuración Inicial (Solo la primera vez)

1. **Inicia sesión en EAS:**

    ```bash
    eas login
    ```

2. **Configura el proyecto:**

    ```bash
    eas build:configure
    ```

    - Selecciona `Android` y/o `iOS`.
    - Esto creará un archivo `eas.json` en la raíz de tu proyecto.

## 3. Generar Build para Android

### Build para Desarrollo (APK instalable en emulador/físico)

Para probar la app sin subirla a la Play Store:

1. Edita `eas.json` y asegúrate de tener un perfil `preview` o `development`:

    ```json
    "build": {
      "preview": {
        "android": {
          "buildType": "apk"
        }
      },
      ...
    }
    ```

2. Ejecuta el comando:

    ```bash
    eas build -p android --profile preview
    ```

3. Espera a que termine. EAS te dará un link para descargar el archivo `.apk`.

### Build para Producción (Play Store - AAB)

Para subir la app a Google Play Console:

1. Ejecuta:

    ```bash
    eas build -p android --profile production
    ```

2. Esto generará un archivo `.aab` (Android App Bundle) optimizado para la tienda.

## 4. Generar Build para iOS (Requiere cuenta Apple Developer)

1. Ejecuta:

    ```bash
    eas build -p ios --profile production
    ```

2. Sigue las instrucciones para firmar la app con tus credenciales de Apple.

## 5. Actualizaciones "Over The Air" (OTA)

Para cambios pequeños (JavaScript, imágenes) que no tocan código nativo, puedes actualizar la app sin que el usuario tenga que descargarla de nuevo:

1. Publicar actualización:

    ```bash
    eas update --branch production --message "Corrección de errores menores"
    ```

2. Los usuarios verán los cambios la próxima vez que abran la app (configurado por defecto en Expo).

---

### Notas Importantes

- **Versiones:** Recuerda incrementar la `version` y `versionCode` (Android) / `buildNumber` (iOS) en `app.json` antes de cada despliegue a producción.
- **Iconos y Splash:** Asegúrate de que las imágenes en `./assets` sean las definitivas antes de construir.
