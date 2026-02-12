/*************************************************
  Greeting Link - Simple Template + Name Generator
  Tech: Vanilla JS + Canvas
  Output: Download PNG (client-side)
**************************************************/

// ====== 1) عناصر الواجهة (DOM) ======
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const templateSelect = document.getElementById("templateSelect");
const nameInput = document.getElementById("nameInput");
//  عرض قالب افتراضي أول ما تفتح الصفحة
const defaultTemplateKey = templateSelect.value;


loadTemplate(defaultTemplateKey).then(() => {
  // ضبط مقاس الكانفس على مقاس القالب
  canvas.width  = TEMPLATES[defaultTemplateKey].width;
  canvas.height = TEMPLATES[defaultTemplateKey].height;

  // ارسم البطاقة (اكتب اسمك/أو الاسم الحالي)
  draw(nameInput.value || "اكتب اسمك");
});
const downloadBtn = document.getElementById("downloadBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const statusEl = document.getElementById("status");

// ====== 2) إعدادات القوالب  ======
// x,y = مكان الاسم في القالب
// maxWidth = أقصى عرض للاسم (إذا زاد يصغّر حجم الخط تلقائيًا)
// baseFontSize = حجم الخط الافتراضي قبل التصغير
// color = لون الاسم
const TEMPLATES = {
  template1: {
    src: "./assets/1.png",
    width: 1080,
    height: 1350,
    textBox: { x: 540, y: 1000, maxWidth: 820 },
    baseFontSize: 30,
    color: "#ffff"
  },
  template2: {
    src: "./assets/2.png",
    width: 1080,
    height: 1350,
    textBox: { x: 540, y: 1050, maxWidth: 820 },
    baseFontSize: 30,
    color: "#44656C"
  },

  template3: {
    src: "./assets/3.png",
    width: 1080,
    height: 1350,
    textBox: { x: 540, y: 1050, maxWidth: 820 },
    baseFontSize: 30,
    color: "#3865C1"
  },

  template4: {
    src: "./assets/4.png",
    width: 1080,
    height: 1350,
    textBox: { x: 540, y: 840, maxWidth: 820 },
    baseFontSize: 30,
    color: "#4286C3",
    lineHeight: .5
  }
};
// ====== 3) تحميل صورة القالب ======
let bgImage = null;

/**
 * يحمل صورة القالب المختار ويخزنها في bgImage
 */
function loadTemplate(templateKey) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      bgImage = img;
      resolve();
    };
    img.onerror = () => reject(new Error("Failed to load template image"));
    img.src = TEMPLATES[templateKey].src;
  });
}

// ====== 4) أدوات مساعدة ======

/**
 * يحدد هل النص عربي (لضبط اتجاه الكتابة)
 */
function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * يصغر حجم الخط تلقائيًا إذا الاسم طويل ويطلع خارج المساحة
 */
function fitFontSize(text, maxWidth, baseSize, fontFamily) {
  let size = baseSize;
  ctx.font = `700 ${size}px ${fontFamily}`;

  while (ctx.measureText(text).width > maxWidth && size > 18) {
    size -= 2;
    ctx.font = `700 ${size}px ${fontFamily}`;
  }
  return size;
}

/**
 * يقرأ باراميترات الرابط (t, name, align)
 * مثال:
 * ?t=template1&name=نورة&align=center
 */
function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    t: p.get("t"),
    name: p.get("name"),
    align: p.get("align"),
  };
}

/**
 * يحدث الرابط بدون إعادة تحميل الصفحة (لإنشاء "رابط ذكي")
 */
function updateUrlParams({ t, name, align }) {
  const p = new URLSearchParams();
  if (t) p.set("t", t);
  if (name) p.set("name", name);
  if (align) p.set("align", align);

  const newUrl = `${window.location.pathname}?${p.toString()}`
  window.history.replaceState({}, "", newUrl);
}

/**
 * تنظيف الاسم قبل وضعه في الرابط (طول + فراغات)
 */
function safeName(name) {
  return (name || "").trim().slice(0, 50);
}

function resizeCanvas(templateKey) {
  const cfg = TEMPLATES[templateKey];
  canvas.width = cfg.width;
  canvas.height = cfg.height;
}

// ====== 5) الرسم على الـCanvas ======
/**
 * يرسم: القالب + الاسم (لو موجود)
 */
function draw() {
  const key = templateSelect.value;
  const cfg = TEMPLATES[key];

  // امسح اللوحة
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ارسم الخلفية (القالب)
  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  }

  // خذ الاسم
  const name = safeName(nameInput.value);
  if (!name) return; // إذا فاضي، لا ترسم اسم

  // اتجاه النص: عربي = RTL / إنجليزي = LTR
  const rtl = isArabic(name);
  ctx.direction = rtl ? "rtl" : "ltr";

  // محاذاة النص
  ctx.textAlign = "center"; // center/
  ctx.textBaseline = "middle";

  // لون النص
  ctx.fillStyle = cfg.color;

  // اختار الخط
  const fontFamily = `"BrandFont", Arial`;

  // صغر الخط لو الاسم طويل
  const fontSize = fitFontSize(name, cfg.textBox.maxWidth, cfg.baseFontSize, fontFamily);
  ctx.font = `700 ${fontSize}px ${fontFamily}`;

  // (اختياري) ظل خفيف يساعد القراءة على خلفية مزدحمة
   ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  

  // ارسم الاسم

const lines = name.split("\n"); // يفصل السطور

const lineHeight = 60; // المسافة بين السطرين (عدّليها حسب القالب)

lines.slice(0, 2).forEach((line, index) => {
  ctx.fillText(line.trim(), cfg.textBox.x, cfg.textBox.y + (index * lineHeight));
});


}
// ====== 6) تحميل  ======

downloadBtn.addEventListener("click", async () => {
  const name = safeName(nameInput.value);
  if (!name) {
    alert("اكتب الاسم أولاً.");
    return;
  }

  const blob = await new Promise(r => canvas.toBlob(r, "image/png", 1));
  if (!blob) return;

  const file = new File([blob], "التهنئة.png", { type: "image/png" });

  //  أولاً: افتح الشير 
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    try {
      await navigator.share({
        files: [file],
        title: "تهنئة",
      });
      return;
    } catch (e) {}
  }

  //  إذا ما يدعم الشير → تحميل عادي
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "التهنئة.png";
  a.click();
  URL.revokeObjectURL(url);
});


// ====== 7) نسخ رابط ذكي ======
/**
 * ينسخ رابط يحتوي على القالب + الاسم + المحاذاة
 * يقدر العميل يفتحه وتجيه نفس الإعدادات
 */
async function copySmartLink() {
  const fixedUrl = "https://enzozid-cards2026.vercel.app/";

  try {
    await navigator.clipboard.writeText(fixedUrl);
    statusEl.textContent = " تم نسخ الرابط";
  } catch {
    statusEl.textContent = "انسخ الرابط يدويًا من شريط العنوان بالأعلى";
  }
}


// ====== 8) مزامنة الرابط مع أي تغيير ======
function syncUrl() {
  updateUrlParams({
    t: templateSelect.value,
    name: safeName(nameInput.value),
    align: "center"
  });
}



// ====== 10) أحداث المستخدم (Event Listeners) ======
templateSelect.addEventListener("change", async () => {
  resizeCanvas(templateSelect.value);
  await loadTemplate(templateSelect.value);
  draw();
  syncUrl();
});

nameInput.addEventListener("input", () => {
  draw();
  syncUrl();
});

;


copyLinkBtn.addEventListener("click", copySmartLink);


(async () => {
  resizeCanvas(templateSelect.value);
  await loadTemplate(templateSelect.value);
  draw();
  syncUrl();
})();
