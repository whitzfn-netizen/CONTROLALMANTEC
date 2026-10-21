# Guía de puesta en marcha · Control del negocio Almantec

La app es una página web (GitHub Pages) que guarda todos los datos en **un solo archivo cifrado** dentro de tu propio repositorio de GitHub. No hay ningún otro servidor ni servicio.

- El archivo se llama `datos.json` y vive en la rama `datos` del repositorio `whitzfn-netizen/CONTROLALMANTEC`.
- Se cifra en el navegador con la **clave de acceso del negocio** (AES-GCM 256). En GitHub solo se ve texto ilegible, aunque el repositorio sea público.
- El token de GitHub que permite guardar también va dentro de ese archivo cifrado. Nunca aparece en el código.
- Cada dispositivo comprueba cambios cada 15 segundos. Si dos personas guardan a la vez, la app junta los dos cambios sin perder ninguno.
- Sin internet se puede seguir trabajando: los cambios se quedan en el dispositivo y se suben solos al volver la conexión.

## 1. Repositorio y web

- Repositorio: `whitzfn-netizen/CONTROLALMANTEC` (público; el código no tiene nada secreto).
- Publicación: **Settings → Pages** → *Source: Deploy from a branch* → rama `main`, carpeta `/ (root)`.
- Si la publicación falla: **Settings → Actions → General → Workflow permissions → Read and write permissions**.

La web: **https://whitzfn-netizen.github.io/CONTROLALMANTEC/**

## 2. Crear el token de GitHub (una vez)

1. GitHub → tu foto → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Token name:** `control-almantec`.
3. **Resource owner:** `whitzfn-netizen` (tu cuenta).
4. **Expiration:** la más larga que permita (o *No expiration*).
5. **Repository access:** *Only select repositories* → solo `CONTROLALMANTEC`.
6. **Permissions → Repository permissions → Contents: Read and write**. Nada más.
7. **Generate token** y copia el texto que empieza por `github_pat_…`. No lo envíes por chat ni lo guardes en notas compartidas: se pega directamente en la web.

## 3. Activar los datos compartidos (primer dispositivo)

1. Abre la web. Verás **«Activar los datos compartidos»**.
2. **1. Token de GitHub:** pega el token.
3. **2. Clave de acceso del negocio:** inventa una clave de al menos 10 caracteres y repítela. Es la que usaréis todos para entrar. Apúntala en un sitio seguro: **si se pierde, los datos no se pueden recuperar** (salvo con una copia de seguridad descargada).
4. La app crea la rama `datos` y el archivo cifrado.

## 4. Entrar desde otros dispositivos

Abre la misma dirección en el móvil, la tablet o el ordenador y escribe **solo la clave de acceso del negocio**. No hace falta el token.

## 5. Importar la hoja de Google

En el primer dispositivo: menú **Datos → Restaurar una copia…** → elige el archivo `hoja-google-sep-oct-2026.json` → **Añadir y actualizar**. Son 40 reparaciones y 5 móviles de septiembre y octubre de 2026. La hoja no tenía día ni modelo, así que van con fecha día 1 del mes y modelo «Sin especificar»; puedes editarlos después. Las filas naranjas (posibles reparaciones futuras) entran como *pendientes*: cuentan como dinero previsto, no como facturado.

Ese archivo tiene nombres de clientes: no lo subas al repositorio.

## 6. Copias de seguridad

- **Datos → Descargar copia completa** guarda un archivo JSON con todo. Conviene hacerlo cada semana o antes de cambios grandes.
- **Datos → Restaurar una copia…** permite *Añadir y actualizar* (junta con lo actual, no borra nada) o *Dejar exactamente como la copia* (antes descarga automáticamente una copia de lo que había).
- **Datos → Exportar a Excel (CSV)** abre en Excel (separador `;`, decimales con coma).

## 7. Quitar el acceso a alguien

**Datos → Estado, clave y desconectar → Cambiar la clave de acceso.** Todos los dispositivos que tenían la clave anterior dejan de ver los datos y piden la nueva. Si además crees que el token se ha filtrado, bórralo en GitHub y crea otro: la app mostrará **«Renueva el acceso a GitHub»** para pegarlo.

## 8. Cuando caduque el token

La app avisa con **«Renueva el acceso a GitHub»**. Crea un token nuevo con los mismos pasos del apartado 2 y pégalo. Los datos no se tocan.

## Límites que conviene saber

- Quien tenga la clave del negocio puede ver y cambiar todo. No hay usuarios separados.
- Los cambios de otro dispositivo tardan hasta unos 15 segundos en aparecer (o al pulsar **Datos → Comprobar cambios ahora**).
- GitHub guarda el historial del archivo cifrado; sin la clave no se puede leer ninguna versión.
- Pensado para un negocio pequeño: miles de registros van bien; cientos de miles no.
