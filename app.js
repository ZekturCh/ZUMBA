import { doc, getDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const codeLabel = document.querySelector("#codeLabel");
const qrContainer = document.querySelector("#qr");
const statusEl = document.querySelector("#status");
const validateButton = document.querySelector("#validateButton");

const params = new URLSearchParams(window.location.search);
const code = (params.get("c") || "").trim().toUpperCase();

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function drawQr() {
  qrContainer.innerHTML = "";
  if (!code || !window.QRCode) return;
  const url = new URL(window.location.href);
  url.searchParams.set("c", code);
  new QRCode(qrContainer, {
    text: url.toString(),
    width: 220,
    height: 220,
    correctLevel: QRCode.CorrectLevel.H
  });
}

async function loadCode() {
  if (!/^[A-Z0-9]{5}$/.test(code)) {
    codeLabel.textContent = "Codigo invalido";
    setStatus("Este link no contiene un codigo valido.", "danger");
    return;
  }

  codeLabel.textContent = code;
  drawQr();

  const ref = doc(db, "codes", code);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    setStatus("QR no existe en el sistema.", "danger");
    return;
  }

  const data = snapshot.data();
  if (data.validated) {
    setStatus("Este QR ya ha sido validado con otra persona.", "danger");
    return;
  }

  setStatus("QR valido. Puede registrarse por primera vez.", "success");
  validateButton.disabled = false;
}

async function validateCode() {
  validateButton.disabled = true;
  setStatus("Validando...", "");

  try {
    const ref = doc(db, "codes", code);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) {
        throw new Error("missing");
      }

      const data = snapshot.data();
      if (data.validated) {
        throw new Error("already-used");
      }

      transaction.update(ref, {
        validated: true,
        validatedAt: serverTimestamp(),
        userAgent: navigator.userAgent
      });
    });

    setStatus("QR validado correctamente.", "success");
  } catch (error) {
    if (error.message === "already-used") {
      setStatus("Este QR ya ha sido validado con otra persona.", "danger");
      return;
    }

    if (error.message === "missing") {
      setStatus("QR no existe en el sistema.", "danger");
      return;
    }

    setStatus("No se pudo validar. Revisa la conexion e intenta de nuevo.", "danger");
  }
}

validateButton.addEventListener("click", validateCode);
loadCode().catch(() => {
  setStatus("No se pudo consultar Firebase. Revisa la configuracion.", "danger");
});
