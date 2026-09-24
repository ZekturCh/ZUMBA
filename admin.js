import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const STAFF_KEY = "nRnkKAw9f5ARaFbik68Jhn2u";

const privatePanel = document.querySelector("#privatePanel");
const adminPanel = document.querySelector("#adminPanel");
const totalCount = document.querySelector("#totalCount");
const validCount = document.querySelector("#validCount");
const freeCount = document.querySelector("#freeCount");
const sentCount = document.querySelector("#sentCount");
const reservedCount = document.querySelector("#reservedCount");
const searchInput = document.querySelector("#searchInput");
const filterInput = document.querySelector("#filterInput");
const codesList = document.querySelector("#codesList");
const copyStatus = document.querySelector("#copyStatus");
const sendTab = document.querySelector("#sendTab");
const validateTab = document.querySelector("#validateTab");
const sendPanel = document.querySelector("#sendPanel");
const validatePanel = document.querySelector("#validatePanel");
const startScannerButton = document.querySelector("#startScannerButton");
const reader = document.querySelector("#reader");
const scanResult = document.querySelector("#scanResult");
const scanCode = document.querySelector("#scanCode");
const scanStatus = document.querySelector("#scanStatus");
const confirmValidationButton = document.querySelector("#confirmValidationButton");

let codes = [];
let unsubscribeCodes = null;
let scanner = null;
let currentScanCode = "";
const hasStaffAccess = new URLSearchParams(window.location.search).get("k") === STAFF_KEY;

function getStatus(item) {
  if (item.status) return item.status;
  if (item.validated) return "validated";
  return "free";
}

function statusLabel(status) {
  return {
    free: "Libre",
    sent: "Enviado",
    reserved: "Separado",
    validated: "Validado"
  }[status] || "Libre";
}

function formatDate(value) {
  if (!value?.toDate) return "Sin fecha";
  return value.toDate().toLocaleString("es-CL");
}

function eventUrl(code) {
  return `${window.location.origin}${window.location.pathname.replace(/admin\.html$/, "")}?c=${code}`;
}

function updateLocalCache() {
  localStorage.setItem("zumba-codes-cache", JSON.stringify(codes.map((item) => ({
    code: item.code,
    status: getStatus(item),
    guestName: item.guestName || ""
  }))));
}

function render() {
  const search = searchInput.value.trim().toUpperCase();
  const filter = filterInput.value;
  const filtered = codes.filter((item) => {
    const status = getStatus(item);
    const matchesSearch = !search || item.code.includes(search);
    const matchesFilter = filter === "all" || filter === status;
    return matchesSearch && matchesFilter;
  }).slice(0, 50);

  totalCount.textContent = `Total: ${codes.length}`;
  freeCount.textContent = `Libres: ${codes.filter((item) => getStatus(item) === "free").length}`;
  sentCount.textContent = `Enviados: ${codes.filter((item) => getStatus(item) === "sent").length}`;
  reservedCount.textContent = `Separados: ${codes.filter((item) => getStatus(item) === "reserved").length}`;
  validCount.textContent = `Validados: ${codes.filter((item) => getStatus(item) === "validated").length}`;

  codesList.innerHTML = filtered.map((item) => {
    const status = getStatus(item);
    const detail = status === "validated"
      ? `Validado: ${formatDate(item.validatedAt)}`
      : status === "reserved"
        ? `Separado${item.guestName ? ` por ${item.guestName}` : ""}`
        : statusLabel(status);
    return `
      <article class="code-row ${status}">
        <div>
          <strong>${item.code}</strong>
          <span>${detail}</span>
        </div>
        <div class="row-actions">
          <button class="secondary" type="button" data-copy-one="${item.code}" ${status !== "free" ? "disabled" : ""}>Copiar</button>
          <a class="secondary link-button" href="./?c=${item.code}" target="_blank" rel="noopener">Abrir</a>
          <button class="secondary" type="button" data-reset="${item.code}">Reset</button>
        </div>
      </article>
    `;
  }).join("");
}

function watchCodes() {
  if (unsubscribeCodes) unsubscribeCodes();
  codesList.innerHTML = "<p class=\"status\">Cargando codigos...</p>";
  unsubscribeCodes = onSnapshot(query(collection(db, "codes"), orderBy("code")), (snapshot) => {
    codes = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    updateLocalCache();
    render();
  });
}

async function copySpecificCodes(selected) {
  if (!selected.length) {
    copyStatus.textContent = "No quedan QR libres para copiar.";
    return;
  }

  const text = [
    "Estos QR son de uso unico. No los compartas con otra persona.",
    "",
    ...selected.map((item) => eventUrl(item.code))
  ].join("\n");

  await navigator.clipboard.writeText(text);

  const batch = writeBatch(db);
  selected.forEach((item) => {
    batch.update(doc(db, "codes", item.code), {
      status: "sent",
      sentAt: serverTimestamp()
    });
  });
  await batch.commit();
  copyStatus.textContent = `Copiados ${selected.length} QR y marcados como enviados.`;
}

function copyLinks(count) {
  return copySpecificCodes(codes.filter((item) => getStatus(item) === "free").slice(0, count));
}

async function resetCode(code) {
  await updateDoc(doc(db, "codes", code), {
    status: "free",
    validated: false,
    validatedAt: null,
    guestName: "",
    reservedAt: null,
    sentAt: null,
    resetAt: serverTimestamp()
  });
}

function extractCode(text) {
  try {
    const url = new URL(text);
    const param = url.searchParams.get("c");
    if (param) return param.trim().toUpperCase();
  } catch {
    // The QR may contain only the raw code.
  }
  return text.trim().toUpperCase().match(/[A-Z0-9]{5}/)?.[0] || "";
}

function showScannedCode(code) {
  currentScanCode = code;
  const item = codes.find((entry) => entry.code === code);
  scanResult.classList.remove("hidden");
  scanCode.textContent = code || "QR invalido";

  if (!item) {
    scanStatus.textContent = "Este QR no existe en el sistema.";
    scanStatus.className = "status danger";
    confirmValidationButton.disabled = true;
    return;
  }

  const status = getStatus(item);
  if (status === "validated") {
    scanStatus.textContent = "Este QR ya ha sido validado con otra persona.";
    scanStatus.className = "status danger";
    confirmValidationButton.disabled = true;
    return;
  }

  scanStatus.textContent = `QR encontrado. Estado actual: ${statusLabel(status)}.`;
  scanStatus.className = "status success";
  confirmValidationButton.disabled = false;
}

async function startScanner() {
  startScannerButton.disabled = true;
  reader.innerHTML = "";
  scanner = scanner || new Html5Qrcode("reader");
  await scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    (decodedText) => showScannedCode(extractCode(decodedText))
  );
}

async function validateCurrentCode() {
  confirmValidationButton.disabled = true;
  scanStatus.textContent = "Validando entrada...";
  scanStatus.className = "status";

  try {
    await runTransaction(db, async (transaction) => {
      const ref = doc(db, "codes", currentScanCode);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("missing");
      const data = snapshot.data();
      const status = data.status || (data.validated ? "validated" : "free");
      if (status === "validated" || data.validated) throw new Error("already-used");
      transaction.update(ref, {
        status: "validated",
        validated: true,
        validatedAt: serverTimestamp()
      });
    });

    scanStatus.textContent = "Entrada validada correctamente.";
    scanStatus.className = "status success";
  } catch (error) {
    scanStatus.textContent = error.message === "already-used"
      ? "Este QR ya ha sido validado con otra persona."
      : "No se pudo validar este QR.";
    scanStatus.className = "status danger";
  }
}

function setTab(tab) {
  const isSend = tab === "send";
  sendTab.classList.toggle("active", isSend);
  validateTab.classList.toggle("active", !isSend);
  sendPanel.classList.toggle("hidden", !isSend);
  validatePanel.classList.toggle("hidden", isSend);
}

searchInput.addEventListener("input", render);
filterInput.addEventListener("change", render);
sendTab.addEventListener("click", () => setTab("send"));
validateTab.addEventListener("click", () => setTab("validate"));
startScannerButton.addEventListener("click", () => startScanner().catch(() => {
  startScannerButton.disabled = false;
  scanResult.classList.remove("hidden");
  scanStatus.textContent = "No se pudo abrir la camara. Revisa permisos del navegador.";
  scanStatus.className = "status danger";
}));
confirmValidationButton.addEventListener("click", validateCurrentCode);

document.querySelectorAll("[data-copy-count]").forEach((button) => {
  button.addEventListener("click", () => copyLinks(Number(button.dataset.copyCount)).catch(() => {
    copyStatus.textContent = "No se pudo copiar. Revisa permisos del navegador.";
  }));
});

codesList.addEventListener("click", async (event) => {
  const copyButton = event.target.closest("[data-copy-one]");
  if (copyButton) {
    const item = codes.find((entry) => entry.code === copyButton.dataset.copyOne);
    if (item) await copySpecificCodes([item]);
    return;
  }

  const resetButton = event.target.closest("[data-reset]");
  if (!resetButton) return;
  resetButton.disabled = true;
  await resetCode(resetButton.dataset.reset);
});

if (hasStaffAccess) {
  adminPanel.classList.remove("hidden");
  watchCodes();
} else {
  privatePanel.classList.remove("hidden");
}
