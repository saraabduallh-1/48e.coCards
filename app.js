/*************************************************
  Greeting Link - Single Template + Name Generator
  Tech: Vanilla JS + Canvas
  Output: Download PNG (client-side)
**************************************************/

// ====== 1) عناصر الواجهة (DOM) ======
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const nameInput = document.getElementById("nameInput");
const alignSelect = document.getElementById("alignSelect"); // إذا موجودة
const downloadBtn = document.getElementById("downloadBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const statusEl = document.getElementById("status");

// ====== 2) إعدادات قالب واحد (تحكم كامل بالمكان + اللون + الخط) ======

const TEMPLATE = {
  // صورة واحدة ثابتة
  src: "./assets/card.png",

  // مقاس الكانفس (لازم يطابق مقاس القالب عشان الإحداثيات تضبط)
  width: 1080,
  height: 1350,

  // مكان الاسم
  x: 540,
  y: 780,

  // أقصى عرض للاسم (إذا زاد يصغر الخط تلقائيًا)
  maxWidth: 820,

  // إعدادات الخط
  fontFamily: "BrandFont",
  fontWeight: 700,
  baseFontSize: 30,
  color: "#F26D21",

  allowTwoLines: true,
  lineHeight: 50, // المسافة بين السطرين
};

// ====== 3) تحميل صورة القالب ======
let bgImage = null;

function loadTemplateImage() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      bgImage = img;
      resolve();
    };
    img.onerror = () => reject(new Error("Template image failed to load."));
    img.src = TEMPLATE.src;
  });
}

// ====== 4) أدوات مساعدة ======
function safeText(t) {
  return (t || "").toString().trim().slice(0, 80);
}

function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function getAlign() {
  if (!alignSelect) return "center";
  const v = (alignSelect.value || "center").toLowerCase();
  if (v === "left" || v === "right" || v === "center") return v;
  return "center";
}

function fitFontSize(lines, maxWidth, baseSize, fontFamily, fontWeight) {
  // نختار أطول سطر ونصغّر عليه
  const longest = lines.reduce((a, b) => (a.length >= b.length ? a : b), "");
  let size = baseSize;

  ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
  while (ctx.measureText(longest).width > maxWidth && size > 18) {
    size -= 2;
    ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
  }
  return size;
}

function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return { name: p.get("name") || "" };
}

function updateUrlParams({ name }) {
  // هذا يخلي رابطك يفتح الاسم تلقائيًا إذا أحد شاركه
  const p = new URLSearchParams();
  if (name) p.set("name", name);
  const qs = p.toString();
  const newUrl = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  window.history.replaceState({}, "", newUrl);
}

async function ensureFontLoaded() {
  // مهم جدًا عشان Canvas يستخدم الخط اللي في CSS
  // إذا ما انتظرنا، أحيانًا يرسم Arial
  if (!document.fonts) return;
  try {
    await document.fonts.load(
      `${TEMPLATE.fontWeight} 32px ${TEMPLATE.fontFamily}`,
    );
    await document.fonts.ready;
  } catch (e) {
    // لو فشل التحميل، يكمل عادي
  }
}

// ====== 5) الرسم ======
function draw() {
  if (!bgImage) return;

  // ارسم الخلفية
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  const rawName = safeText(nameInput?.value);
  if (!rawName) return;

  const rtl = isArabic(rawName);

  // تقسيم لسطرين إذا allowTwoLines = true
  let lines = [rawName];
  if (TEMPLATE.allowTwoLines) {
    lines = rawName
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2);
    if (lines.length === 0) return;
  }

  // إعداد الاتجاه والمحاذاة
  const align = getAlign();
  ctx.direction = rtl ? "rtl" : "ltr";

  if (align === "left") ctx.textAlign = "left";
  else if (align === "right") ctx.textAlign = "right";
  else ctx.textAlign = "center";

  ctx.textBaseline = "middle";
  ctx.fillStyle = TEMPLATE.color;

  // ظل
  if (TEMPLATE.shadow?.enabled) {
    ctx.shadowColor = TEMPLATE.shadow.color;
    ctx.shadowBlur = TEMPLATE.shadow.blur;
    ctx.shadowOffsetX = TEMPLATE.shadow.offsetX;
    ctx.shadowOffsetY = TEMPLATE.shadow.offsetY;
  } else {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // حجم الخط مع تصغير تلقائي
  const fontSize = fitFontSize(
    lines,
    TEMPLATE.maxWidth,
    TEMPLATE.baseFontSize,
    TEMPLATE.fontFamily,
    TEMPLATE.fontWeight,
  );
  ctx.font = `${TEMPLATE.fontWeight} ${fontSize}px ${TEMPLATE.fontFamily}`;

  // تحديد نقطة الرسم حسب المحاذاة
  let drawX = TEMPLATE.x;
  if (align === "left") drawX = TEMPLATE.x - TEMPLATE.maxWidth / 2;
  if (align === "right") drawX = TEMPLATE.x + TEMPLATE.maxWidth / 2;

  // لو سطرين: نخليهم حول y
  if (lines.length === 1) {
    ctx.fillText(lines[0], drawX, TEMPLATE.y);
  } else {
    const totalHeight = TEMPLATE.lineHeight; // بين سطرين
    const y1 = TEMPLATE.y - totalHeight / 2;
    const y2 = TEMPLATE.y + totalHeight / 2;
    ctx.fillText(lines[0], drawX, y1);
    ctx.fillText(lines[1], drawX, y2);
  }
}

// ====== 6) تحميل PNG ======
downloadBtn?.addEventListener("click", async () => {
  const name = safeText(nameInput?.value);
  if (!name) {
    alert("اكتب الاسم أولاً.");
    return;
  }

  // نرسم آخر نسخة
  draw();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png", 1),
  );
  if (!blob) return;

  const file = new File([blob], "تهنئة.png", { type: "image/png" });

  // مشاركة إذا متاحة
  // مشاركة إذا المتصفح يدعم مشاركة ملفات
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "تهنئة",
      });
      return;
    } catch (e) {
      console.log("Share cancelled");
    }
  }

  // تنزيل عادي
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "تهنئة.png";

  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ====== 7) نسخ الرابط ======
copyLinkBtn?.addEventListener("click", async () => {
  try {
    // إ ينسخ الرابط مع الاسم تلقائيًا:
    // const link = window.location.href;

    //و ينسخ الرابط الأساسين ?name=
    const link = `${window.location.origin}${window.location.pathname}`;

    await navigator.clipboard.writeText(link);
    if (statusEl) statusEl.textContent = "تم نسخ الرابط ";
  } catch (e) {
    if (statusEl) statusEl.textContent = " انسخ الرابط يدويًا";
  }
});

// ====== 8) أحداث الإدخال ======
nameInput?.addEventListener("input", () => {
  //  يمنع أكثر من سطرين
  const v = (nameInput.value || "").replace(/\r\n/g, "\n");
  const lines = v.split("\n");
  if (lines.length > 2) {
    nameInput.value = lines.slice(0, 2).join("\n");
  }

  draw();
  updateUrlParams({ name: safeText(nameInput.value) });
});

alignSelect?.addEventListener("change", () => {
  draw();
});

// ====== 9) تشغيل أولي ======
(async () => {
  // جهز الكانفس
  canvas.width = TEMPLATE.width;
  canvas.height = TEMPLATE.height;

  // حمّل الصورة
  await loadTemplateImage();

  // انتظر الخط
  await ensureFontLoaded();

  // لو فيه name في الرابط
  const { name } = getUrlParams();
  if (name && nameInput) nameInput.value = name;

  // ارسم
  draw();
  updateUrlParams({ name: safeText(nameInput?.value) });
})();
