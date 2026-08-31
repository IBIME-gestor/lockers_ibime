# Asignación de Lockers — Secundaria

Plataforma web para gestionar la asignación de lockers a los ~700 alumnos de
secundaria (28 grupos), con importación de listas desde Excel, filtros por
grupo, propuesta automática de asignación con ajuste manual, y roles
diferenciados. Construida con **React + Firebase (Auth + Firestore)** y
pensada para desplegarse en línea (Firebase Hosting), sin instalación local
para los usuarios finales.

## Roles

| Rol            | Permisos                                                            |
|----------------|----------------------------------------------------------------------|
| `administrador`| Acceso total: importar alumnos, gestionar usuarios/roles, asignar lockers, reportes |
| `supervisor`   | Ver y asignar lockers de cualquier grupo, liberar lockers, reportes  |
| `tutor`        | Ver y asignar lockers solo de los grupos que tiene a cargo           |
| `contraloria`  | Solo lectura: reportes y avance por grupo, exportar Excel            |

Ajusta el número de personas por rol (5 tutores, 2 supervisores, etc.) desde
la sección **Usuarios y roles** dentro de la app; el código no limita
cuántas personas pueden tener cada rol.

## 1. Requisitos previos

- Node.js 18 o superior
- Una cuenta de Google y un proyecto de [Firebase](https://console.firebase.google.com)
- Node/npm instalados solo en tu computadora para el desarrollo inicial; una
  vez desplegado, los usuarios finales solo necesitan un navegador.

## 2. Configurar Firebase

1. Crea un proyecto en la [consola de Firebase](https://console.firebase.google.com)
   (o usa uno existente de la institución).
2. Habilita **Authentication → Sign-in method → Google**. Como "correo de
   soporte del proyecto" usa la cuenta institucional.
3. En **Authentication → Settings → Authorized domains**, verifica que esté
   tu dominio de Firebase Hosting (`tu-proyecto.web.app` se agrega solo) y,
   si usarás un dominio propio, agrégalo ahí también.
4. Habilita **Firestore Database** (modo producción).
5. En **Configuración del proyecto → General**, crea una app web y copia las
   credenciales (`apiKey`, `authDomain`, etc.).
6. Copia `.env.example` a `.env` y pega ahí tus credenciales:

   ```bash
   cp .env.example .env
   ```

   Incluye también `VITE_ALLOWED_DOMAIN` con el dominio de las cuentas de
   Google institucionales (por ejemplo `colegioibime.edu.mx`, sin `@`). Esto
   preselecciona ese dominio en el selector de cuentas de Google y bloquea
   correos externos.

7. **Dar de alta personas (login con Google, sin contraseñas):**
   - Pide a la persona (tutor, supervisor, etc.) que entre una vez a la app
     y presione "Iniciar sesión con Google" con su correo institucional. Como
     todavía no tiene perfil, verá el mensaje "tu cuenta aún no tiene
     acceso" — es normal, ese primer intento ya creó su cuenta en
     **Authentication → Users**.
   - En la consola de Firebase, ve a **Authentication → Users**, busca su
     correo y copia su **UID**.
   - Crea su documento en **Firestore → colección `usuarios`**, con ID = ese
     UID:

     ```json
     { "nombre": "Su nombre", "correo": "su@colegioibime.edu.mx", "rol": "tutor", "grupos": ["1A"] }
     ```

   - La próxima vez que inicie sesión con Google, ya tendrá acceso con su rol.

   Para el **primer administrador**, sigue el mismo proceso pero con
   `"rol": "administrador"`.

## 3. Instalar y correr en desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## 4. Desplegar en línea (Firebase Hosting)

Este repo ya incluye `firebase.json` (hosting apuntando a `dist/`, configurado
como single-page app) y una plantilla `.firebaserc`. Solo falta apuntarlo a
tu proyecto real:

```bash
npm install -g firebase-tools
firebase login
firebase use --add     # elige tu proyecto de Firebase; esto actualiza .firebaserc
npm run build
firebase deploy --only hosting
```

También puedes usar `npm run deploy`, que hace `build` + `deploy` en un solo
paso (ver `package.json`).

También puedes usar `firebase deploy --only firestore:rules,firestore:indexes`
para publicar las reglas de seguridad incluidas en este repo. Al terminar,
Firebase te da una URL pública (`https://tu-proyecto.web.app`) — es la que
compartes con tutores, supervisores y contraloría. No requiere instalar nada
en las computadoras de los usuarios.

## 5. Uso: flujo recomendado

1. **Importar alumnos** (rol administrador): sube el Excel con columnas
   Matrícula, Nombre, Grupo de español, Grupo de inglés, Nombre del tutor.
2. **Usuarios y roles** (administrador): registra el UID de cada persona
   (creado previamente en Firebase Authentication) y asígnale su rol; a los
   tutores asígnales también sus grupos a cargo.
3. **Asignar lockers**: filtra por grupo de español o inglés, define
   edificio, planta/ubicación y el rango de números de locker que vas a
   entregar. La plataforma genera una propuesta automática; puedes ajustar
   manualmente cada fila antes de **confirmar y guardar**.
4. **Mapa de lockers**: consulta la ocupación por edificio/planta; admins y
   supervisores pueden liberar un locker si hay un error.
5. **Contraloría**: vista de solo lectura con el avance por grupo y
   exportación a Excel para auditoría.

## 6. Estructura del proyecto

```
src/
  context/AuthContext.jsx     # sesión y rol del usuario
  services/students.js        # lectura/escritura de alumnos en Firestore
  services/lockers.js         # inventario y asignación de lockers
  services/excelImport.js     # parseo del Excel de alumnos
  utils/assignmentAlgorithm.js# lógica de la propuesta automática
  pages/                      # una página por sección de la app
firestore.rules               # reglas de seguridad por rol
```

## 7. Subir este proyecto a GitHub

```bash
git init
git add .
git commit -m "Plataforma de asignación de lockers"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/asignacion-lockers-ibime.git
git push -u origin main
```

`.env` está en `.gitignore`, así que tus credenciales de Firebase no se
suben al repositorio. Cada persona que clone el proyecto para desarrollo
debe crear su propio `.env` a partir de `.env.example`.

## Próximos pasos sugeridos

- Cloud Function para crear cuentas de Authentication directamente desde la
  pantalla de "Usuarios y roles" (hoy se crean manualmente en la consola).
- Registro de historial/auditoría de cada cambio de asignación (colección
  `movimientos`) para trazabilidad completa en Contraloría.
- Notificación por correo al tutor cuando se completa la asignación de su
  grupo.
