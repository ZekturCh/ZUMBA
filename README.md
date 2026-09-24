# ZUMBA QR

Sitio estatico para validar 300 codigos QR de un solo uso con Firebase Firestore.

## Paginas

- `index.html?c=CODIGO`: pagina del invitado para ver QR unico y separar asistencia.
- `admin.html`: panel protegido por Firebase Auth para enviar QR, ver estados en tiempo real y validar por camara.
- `seed.html`: crea los 300 codigos una sola vez. Usar solo con reglas temporales.

## Configuracion Firebase

1. En Firebase Console, activa Firestore.
2. En Authentication, activa Email/Password y crea el usuario admin.
3. Edita `firestore.rules` y cambia `CAMBIA-ESTE-CORREO@tudominio.com` por el correo admin.
4. Para cargar codigos por primera vez, publica temporalmente `firestore.seed.rules`.
5. Abre `seed.html`, presiona "Crear codigos".
6. Vuelve inmediatamente a publicar `firestore.rules`.

## Estados

- `free`: libre.
- `sent`: enviado por promotor.
- `reserved`: separado/confirmado por invitado.
- `validated`: validado en puerta.

## Links de QR

Cada QR debe apuntar a:

```txt
https://TU_USUARIO.github.io/ZUMBA/?c=CODIGO
```

Los codigos estan en `codes.js`.
