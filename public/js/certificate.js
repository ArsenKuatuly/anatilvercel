const params = new URLSearchParams(window.location.search);
const courseId = params.get("courseId");
const nextSlug = params.get("next");

const certName = document.getElementById("certName");
const certCourse = document.getElementById("certCourse");
const certLevel = document.getElementById("certLevel");
const certLevelBadge = document.getElementById("certLevelBadge");
const certDate = document.getElementById("certDate");
const certNumber = document.getElementById("certNumber");
const continueBtn = document.getElementById("continueBtn");
const downloadCertificateBtn = document.getElementById("downloadCertificateBtn");

async function loadCertificate() {
  if (!courseId) {
    alert("Сертификат не найден");
    window.location.replace("/dashboard.html");
    return;
  }

  try {
    const raw = await window.authFetch(`/api/certificate/${encodeURIComponent(courseId)}`, { method: "GET" });
    const data = raw?.data || {};

    if (!data.success || !data.certificate) {
      throw new Error(data.message || "certificate unavailable");
    }

    const cert = data.certificate;
    if (certName) certName.textContent = cert.fullName || "Пользователь AnaTil";
    if (certCourse) certCourse.textContent = cert.courseTitle || "Курс казахского языка";
    const levelText = cert.cefr ? `${cert.cefr} · ${cert.levelLabel}` : (cert.levelLabel || cert.level || "—");
    if (certLevel) certLevel.textContent = levelText;
    if (certLevelBadge) certLevelBadge.textContent = levelText;
    if (certDate) certDate.textContent = cert.issuedAt || "—";
    if (certNumber) certNumber.textContent = cert.certificateNumber || "—";

    if (continueBtn) {
      continueBtn.textContent = nextSlug ? "Перейти к следующему курсу" : "Перейти в профиль";
      continueBtn.href = nextSlug ? `/coursemodul.html?slug=${encodeURIComponent(nextSlug)}` : "/profile.html";
    }
  } catch (err) {
    console.error("certificate load error:", err);
    alert("Не удалось загрузить сертификат");
    window.location.replace("/dashboard.html");
  }
}

if (downloadCertificateBtn) {
  downloadCertificateBtn.addEventListener("click", () => window.print());
}

loadCertificate();
