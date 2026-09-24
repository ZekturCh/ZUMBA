# ZUMBA QR

Sitio estatico para validar 300 codigos QR de un solo uso con Firebase Firestore.

## Paginas

- `index.html?c=CODIGO`: pagina del invitado para ver QR unico y separar asistencia.
- `admin.html?k=CLAVE`: panel privado por link para enviar QR, ver estados en tiempo real y validar por camara.
- `seed.html`: crea los 300 codigos una sola vez. Usar solo con reglas temporales.

## Configuracion Firebase

1. En Firebase Console, activa Firestore.
2. Para cargar codigos por primera vez, publica temporalmente `firestore.seed.rules`.
3. Abre `seed.html`, presiona "Crear codigos".
4. Vuelve inmediatamente a publicar `firestore.rules`.

## Link privado staff

```txt
https://TU_USUARIO.github.io/ZUMBA/admin.html?k=nRnkKAw9f5ARaFbik68Jhn2u
```

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
