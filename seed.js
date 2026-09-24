import { doc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { codes } from "./codes.js";
import { db } from "./firebase-config.js";

const seedButton = document.querySelector("#seedButton");
const seedStatus = document.querySelector("#seedStatus");

seedButton.addEventListener("click", async () => {
  seedButton.disabled = true;
  seedStatus.textContent = "Creando codigos...";

  try {
    const batch = writeBatch(db);
    codes.forEach((code) => {
      batch.set(doc(db, "codes", code), {
        code,
        created: true,
        createdAt: serverTimestamp(),
        validated: false,
        validatedAt: null
      });
    });
    await batch.commit();
    seedStatus.textContent = `Listo: ${codes.length} codigos creados.`;
  } catch {
    seedStatus.textContent = "No se pudo crear. Revisa reglas temporales de Firestore.";
    seedButton.disabled = false;
  }
});
