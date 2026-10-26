const APP_CONFIG = {
    gojoImageUrl: "gojo.jpg",
    kuromiImageUrl: "kuromi.jpg",

    jjkMessage: `やあ、愛しい人。
    君の愛する夫、五条悟だよ。
    僕の妻になってくれて本当にありがとう、そのことを心から大切に思っているよ。
    愛する妻へ、最高に楽しい誕生日になりますように！
    
    旦那さんからプレゼントされたバースデーケーキのロウソク、ちゃんと吹き消してね！

    Tạm dịch:

    Yo wai mo, anh là chồng yêu Gojo Satoru của em đây. 
    Cảm ơn em đã làm vợ của anh và anh tôn trọng nó lắm. 
    Chúc vợ yêu của anh có một ngày sinh nhật thật vui nhaaa
    
    Nhớ thổi nến của bánh sinh nhật chồng tặng em đó vợ oii`,

    kuromiMessage: `Chào cô gái nho nhỏ của em Vanh
    Biết nay sinh nhật em Thư nên em Vanh đã cố gắng làm cái web này để tặng cho em Thư
    Tuy vẫn khá tệ và xấu đối với mắt em, có thể sẽ không được như kì vọng em
    Nhưng mà kệ đi dù sao đó cũng là món quà anh tặng
    Chúc em Thư sinh nhật vui vui mãi xinh cuti tone hằm để em Vanh được hưởng theo nha
    
    Ấn mặt tui 3 lần i !`,

    typewriterSpeedJJK: 12,
    typewriterSpeedKuromi: 12
};

let currentStage = 1;
let introRunning = false;
let soundEnabled = true;
let audioInitialized = false;
let synthBell = null;
let synthType = null;

async function initAudio() {
    if (audioInitialized || typeof Tone === "undefined") return;
    try {
        await Tone.start();
        synthBell = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 1.2 }
        }).toDestination();
        synthBell.volume.value = -10;

        synthType = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.005, decay: 0.03, sustain: 0, release: 0.02 }
        }).toDestination();
        synthType.volume.value = -24;
        audioInitialized = true;
    } catch (err) {}
}

function playDomainSound() {
    if (!soundEnabled || !synthBell) return;
    try {
        synthBell.triggerAttackRelease(["C3", "G3", "D4", "A4", "E5"], "1.5n", Tone.now());
    } catch (e) {}
}

function playKuromiSound() {
    if (!soundEnabled || !synthBell) return;
    try {
        synthBell.triggerAttackRelease(["F4", "A4", "C5", "E5"], "8n", Tone.now());
        synthBell.triggerAttackRelease(["G4", "B4", "D5", "G5"], "4n", Tone.now() + 0.18);
    } catch (e) {}
}

function playKeyClick() {
    if (!soundEnabled || !synthType) return;
    try { synthType.triggerAttackRelease("G5", "32n"); } catch (e) {}
}

// STAGE 1: VẼ HÌNH CHỮ NHẬT
const drawCanvas = document.getElementById("draw-canvas");
const drawCtx = drawCanvas ? drawCanvas.getContext("2d") : null;
const stagePaper = document.getElementById("stage-paper");
const morphRect = document.getElementById("morph-rect");

let isDrawing = false;
let strokePoints = [];

function resizeDrawCanvas() {
    if (!drawCanvas) return;
    drawCanvas.width = window.innerWidth;
    drawCanvas.height = window.innerHeight;
}

function getPointerPos(e) {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
}

function startDrawing(e) {
    if (currentStage !== 1) return;
    initAudio();
    isDrawing = true;
    strokePoints = [getPointerPos(e)];
}

function moveDrawing(e) {
    if (!isDrawing || currentStage !== 1) return;
    strokePoints.push(getPointerPos(e));
}

function endDrawing() {
    if (!isDrawing || currentStage !== 1) return;
    isDrawing = false;
    evaluateDrawnRectangle();
}

function renderPaperLoop() {
    if (currentStage !== 1 || !drawCtx) return;
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    if (strokePoints.length > 1) {
        drawCtx.save();
        drawCtx.lineCap = "round";
        drawCtx.lineJoin = "round";
        drawCtx.beginPath();
        drawCtx.moveTo(strokePoints[0].x, strokePoints[0].y);
        for (let i = 1; i < strokePoints.length; i++) drawCtx.lineTo(strokePoints[i].x, strokePoints[i].y);
        drawCtx.strokeStyle = "#00f2fe";
        drawCtx.lineWidth = 4;
        drawCtx.shadowColor = "#00f2fe";
drawCtx.shadowBlur = 16;
        drawCtx.stroke();
        drawCtx.restore();
    }
    requestAnimationFrame(renderPaperLoop);
}

function evaluateDrawnRectangle() {
    if (strokePoints.length < 8) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let pt of strokePoints) {
        if (pt.x < minX) minX = pt.x; if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x; if (pt.y > maxY) maxY = pt.y;
    }
    const w = maxX - minX, h = maxY - minY;
    if (w >= 80 && h >= 50) {
        triggerRectangleMorph({ left: minX, top: minY, width: w, height: h });
    } else {
        strokePoints = [];
    }
}

// Lấy đúng vị trí + kích thước cuối cùng của lá thư JJK
function getLetterTargetBox() {
    const cakes = document.getElementById("cakes-jjk");
    const wasShown = cakes?.classList.contains("show");
    if (!wasShown) cakes?.classList.add("show");   // để bố cục chừa chỗ cho bánh, giống lúc cuối

    const r = jjkCard.getBoundingClientRect();     // đang scale 0.9 nhưng tâm vẫn đúng
    const w = jjkCard.offsetWidth, h = jjkCard.offsetHeight;   // kích thước thật, không bị scale
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;

    if (!wasShown) cakes?.classList.remove("show");
    return { left: cx - w / 2, top: cy - h / 2, width: w, height: h };
}

// ===== HIỆU ỨNG PHỤ =====
function fxFlash(cx, cy, cls = "") {
    const el = document.createElement("div");
    el.className = `fx-flash ${cls}`;
    el.style.setProperty("--cx", `${cx}px`);
    el.style.setProperty("--cy", `${cy}px`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
}

function fxRing(cx, cy, delay = 0, cls = "") {
    const el = document.createElement("div");
    el.className = `fx-ring ${cls}`;
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    el.style.setProperty("--delay", `${delay}s`);
    el.style.setProperty("--s", ((Math.max(window.innerWidth, window.innerHeight) * 2) / 40).toFixed(1));
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500 + delay * 1000);
}

function fxSparks(cx, cy, count = 36, cls = "") {
    for (let i = 0; i < count; i++) {
        const s = document.createElement("div");
        s.className = `fx-spark ${cls}`;
        const ang = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 260;
        s.style.left = `${cx}px`;
        s.style.top = `${cy}px`;
        s.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
        s.style.setProperty("--dy", `${Math.sin(ang) * dist}px`);
        s.style.animationDuration = `${0.6 + Math.random() * 0.6}s`;
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 1400);
    }
}

function fxShake() {
    document.body.classList.remove("fx-shake");
    void document.body.offsetWidth;
    document.body.classList.add("fx-shake");
    setTimeout(() => document.body.classList.remove("fx-shake"), 450);
}

// ===== CHUYỂN CẢNH CHÍNH =====
function triggerRectangleMorph(box) {
    if (currentStage !== 1) return;
    currentStage = 2;
    introRunning = true;
    initAudio().then(playDomainSound);

    drawCtx?.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    const startBox = box || {
        left: window.innerWidth * 0.2, top: window.innerHeight * 0.2,
        width: window.innerWidth * 0.6, height: window.innerHeight * 0.6
    };
    const cx = startBox.left + startBox.width / 2;
    const cy = startBox.top + startBox.height / 2;
    const target = getLetterTargetBox();

    // t=0: khung "chốt" + flash + sóng xung kích + rung màn
    if (morphRect) {
        morphRect.classList.remove("morph-go");
        morphRect.classList.add("morph-snap");
        morphRect.style.transition = "none";
        morphRect.style.left = `${startBox.left}px`;
        morphRect.style.top = `${startBox.top}px`;
        morphRect.style.width = `${startBox.width}px`;
        morphRect.style.height = `${startBox.height}px`;
        morphRect.style.borderRadius = "14px";
        morphRect.style.opacity = "1";
        void morphRect.offsetWidth;
    }
    fxFlash(cx, cy);
    fxRing(cx, cy);
    fxRing(cx, cy, 0.18);
    fxShake();

    setTimeout(() => openDomain(cx, cy), 450);        // Lãnh Địa bung ra từ tâm khung
    setTimeout(showDomainBanner, 950);                // chữ đập xuống
    setTimeout(() => {                                // khung bay thành thư
        hideDomainBanner();
        flyRectToLetter(target);
    }, 1900);
    setTimeout(() => revealLetter(target), 2900);     // thư hiện
}

function openDomain(cx, cy) {
    if (!stageJJK) return;
    stageJJK.style.zIndex = "45";                     // nổi lên trên tờ giấy trong lúc bung
    stageJJK.style.transition = "none";
    stageJJK.style.clipPath = `circle(0px at ${cx}px ${cy}px)`;
    stageJJK.classList.remove("opacity-0", "pointer-events-none");
    stageJJK.classList.add("opacity-100");
    void stageJJK.offsetWidth;
    stageJJK.style.transition = "clip-path 1.1s cubic-bezier(0.65, 0, 0.2, 1)";
    stageJJK.style.clipPath = `circle(${Math.hypot(window.innerWidth, window.innerHeight)}px at ${cx}px ${cy}px)`;
}

function showDomainBanner() {
    if (!domainBanner) return;
    domainBanner.classList.remove("slam");
    void domainBanner.offsetWidth;
    domainBanner.classList.add("slam");
    domainBanner.style.opacity = "1";
    playBoom();
    fxShake();
}

function hideDomainBanner() {
    if (domainBanner) domainBanner.style.opacity = "0";
}

function flyRectToLetter(target) {
    if (!morphRect) return;
    morphRect.classList.remove("morph-snap");
    morphRect.classList.add("morph-go");
    morphRect.style.transition = "all 0.95s cubic-bezier(0.65, 0, 0.2, 1)";
    morphRect.style.left = `${target.left}px`;
    morphRect.style.top = `${target.top}px`;
    morphRect.style.width = `${target.width}px`;
    morphRect.style.height = `${target.height}px`;
    morphRect.style.borderRadius = "24px";
}

function revealLetter(target) {
    const cx = target.left + target.width / 2;
    const cy = target.top + target.height / 2;

    // dọn: giấy trắng biến mất hẳn, JJK về lại tầng cũ
    if (stagePaper) stagePaper.style.display = "none";
    if (stageJJK) {
        stageJJK.style.zIndex = "";
        stageJJK.style.transition = "";
        stageJJK.style.clipPath = "none";
    }

    if (jjkCard) {
        jjkCard.style.transition = "none";
        jjkCard.style.transform = "scale3d(1, 1, 1)";
        jjkCard.style.opacity = "1";
        jjkCard.classList.add("scale-100", "card-pop");
        void jjkCard.offsetWidth;
        jjkCard.style.transition = "";
        setTimeout(() => jjkCard.classList.remove("card-pop"), 1000);
    }
    if (morphRect) {
        morphRect.style.transition = "opacity 0.5s ease-out";
        morphRect.style.opacity = "0";
    }

    fxRing(cx, cy);
    fxSparks(cx, cy, 40);

    introRunning = false;
    startJJKTypewriter();
    showCake("jjk");
}
// STAGE 2: JJK
const stageJJK = document.getElementById("stage-jjk");
const jjkCard = document.getElementById("jjk-card");
const domainBanner = document.getElementById("domain-banner");
const jjkTypewriterEl = document.getElementById("jjk-typewriter-text");
const jjkSwipeNote = document.getElementById("jjk-swipe-note");

let jjkTypeTimer = null;
function startJJKTypewriter() {
    if (!jjkTypewriterEl) return;
    clearInterval(jjkTypeTimer);
    jjkTypewriterEl.textContent = "";
    jjkSwipeNote?.classList.add("opacity-0", "pointer-events-none");

    let idx = 0;
    const text = APP_CONFIG.jjkMessage;
    jjkTypeTimer = setInterval(() => {
        if (idx < text.length) {
            jjkTypewriterEl.textContent += text.charAt(idx);
            jjkTypewriterEl.parentElement.scrollTop = jjkTypewriterEl.parentElement.scrollHeight;
            idx++;
            if (idx % 2 === 0) playKeyClick();
        } else {
            clearInterval(jjkTypeTimer);
            // Hiện chữ lướt qua CUỐI CÙNG sau khi typewriter xong
            setTimeout(() => {
                jjkSwipeNote?.classList.remove("opacity-0", "pointer-events-none");
            }, 500);
        }
    }, APP_CONFIG.typewriterSpeedJJK);
}
// ===== BÁNH KEM (dùng chung cho "jjk" và "kuromi") =====
const cakeShown = { jjk: false, kuromi: false };
const cakeBlown = { jjk: false, kuromi: false };

function showCake(key) {
    if (cakeShown[key]) return;
    cakeShown[key] = true;
    document.getElementById(`cakes-${key}`)?.classList.add("show");

    // bánh rơi xong (~4s) thì nến mới tỏa sáng
    setTimeout(() => lightCandles(key), 4000);

    // rồi mới hiện gợi ý "Chạm để thổi nến"
    setTimeout(() => {
        const tap = document.querySelector(`#cake-${key} .candle-tap`);
        if (!tap || cakeBlown[key]) return;
        tap.style.opacity = "1";
        tap.style.pointerEvents = "auto";
        tap.onclick = () => blowOutCandles(key);
    }, 5500);
}

function lightCandles(key) {
    const holder = document.querySelector(`#cake-${key} .candle-holder`);
    if (!holder || cakeBlown[key] || holder.querySelector(".candle-glow")) return;
    const glow = document.createElement("div");
    glow.className = "candle-glow";
    holder.appendChild(glow);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        glow.style.transform = "translate(-50%, -50%) scale(1.6)";
    }));
}

function blowOutCandles(key) {
    if (cakeBlown[key]) return;
    cakeBlown[key] = true;
    const cake = document.getElementById(`cake-${key}`);
    const holder = cake?.querySelector(".candle-holder");
    const tap = cake?.querySelector(".candle-tap");

    if (tap) { tap.style.opacity = "0"; tap.style.pointerEvents = "none"; tap.onclick = null; }

    cake?.querySelectorAll(".candle-flame").forEach(f => {
        f.classList.remove("flame");
        f.style.opacity = "0";
        f.style.transform = "translateY(-6px) scale(0.4)";
    });

    const glow = holder?.querySelector(".candle-glow");
    if (glow) glow.style.transform = "translate(-50%, -50%) scale(0)";

    const puff = document.createElement("span");
    puff.className = "candle-smoke";
    puff.textContent = "💨";
    holder?.appendChild(puff);
    setTimeout(() => puff.remove(), 1600);

    playBlowSound();
       setTimeout(() => celebrate(key), 350);
}

function playBlowSound() {
    if (!soundEnabled || !synthBell) return;
    try {
        synthBell.triggerAttackRelease("G5", "16n", Tone.now());
        synthBell.triggerAttackRelease("E5", "16n", Tone.now() + 0.1);
        synthBell.triggerAttackRelease("C5", "8n", Tone.now() + 0.2);
    } catch (e) {}
}

// STAGE 3: KUROMI
const stageKuromi = document.getElementById("stage-kuromi");
const kuromiTypewriterEl = document.getElementById("kuromi-typewriter-text");
let kuromiSeen = false;
let kuromiBusy = false;
let kuromiTypeTimer = null;

function fxHearts(cx, cy, count = 26) {
    const chars = ["💖", "💗", "💜", "🖤", "🎀", "✨", "💕"];
    for (let i = 0; i < count; i++) {
        const s = document.createElement("div");
        s.className = "fx-heart";
        s.textContent = chars[Math.floor(Math.random() * chars.length)];
        const ang = Math.random() * Math.PI * 2;
        const dist = 160 + Math.random() * 420;
        s.style.left = `${cx}px`;
        s.style.top = `${cy}px`;
        s.style.fontSize = `${16 + Math.random() * 26}px`;
        s.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
        s.style.setProperty("--dy", `${Math.sin(ang) * dist}px`);
        s.style.setProperty("--rot", `${Math.random() * 80 - 40}deg`);
        s.style.animationDuration = `${0.9 + Math.random() * 0.7}s`;
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 1800);
    }
}

function showKuromiBanner() {
    let b = document.getElementById("kuromi-banner");
    if (!b) {
        b = document.createElement("div");
        b.id = "kuromi-banner";
        b.innerHTML = `<p>CHÚC MỪNG SINH NHẬT</p><h2>Cao Chúa Đông Chun</h2>`;
        document.body.appendChild(b);
    }
    b.classList.remove("slam");
    void b.offsetWidth;
    b.classList.add("slam");
    b.style.opacity = "1";
    playSparkle();
    fxShake();
}

function hideKuromiBanner() {
    const b = document.getElementById("kuromi-banner");
    if (b) b.style.opacity = "0";
}

function revealKuromiCard() {
    if (kuromiCard) {
        kuromiCard.style.opacity = "";
        kuromiCard.classList.add("card-pop-k");
        setTimeout(() => kuromiCard.classList.remove("card-pop-k"), 1300);

        const r = kuromiCard.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        fxRing(cx, cy, 0, "pink");
        fxSparks(cx, cy, 40, "pink");
        fxHearts(cx, cy, 18);
    }
    playKuromiSound();
    kuromiBusy = false;
    setTimeout(startKuromiTypewriter, 700);
    setTimeout(() => showCake("kuromi"), 700);
}

// ===== TRÁI TIM NỞ RA (clip-path, nhẹ hơn mask) =====
let heartAnim = null;

function heartPolygon(cx, cy, s) {
    const pts = [];
    for (let i = 0; i < 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        pts.push(`${(cx + x * s).toFixed(1)}px ${(cy + y * s).toFixed(1)}px`);
    }
    return `polygon(${pts.join(",")})`;
}

function animateHeart(from, to, ms, onDone) {
    if (!stageKuromi) return;
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    const maxS = Math.max(window.innerWidth, window.innerHeight) * 0.13;
    const t0 = performance.now();
    cancelAnimationFrame(heartAnim);

    function frame(now) {
        const p = Math.min((now - t0) / ms, 1);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   // easeInOutCubic
        const s = Math.max(maxS * (from + (to - from) * e), 0.01);
        stageKuromi.style.clipPath = heartPolygon(cx, cy, s);
        if (p < 1) {
            heartAnim = requestAnimationFrame(frame);
        } else {
            if (to >= 1) stageKuromi.style.clipPath = "none";   // mở hết thì bỏ clip cho nhẹ
            onDone?.();
        }
    }
    heartAnim = requestAnimationFrame(frame);
}

function openKuromiHeart() {
    if (!stageKuromi) return;
    stageKuromi.style.clipPath = heartPolygon(window.innerWidth / 2, window.innerHeight / 2, 0.01);
    stageKuromi.classList.add("active-kuromi");
    animateHeart(0, 1, 1200);
}

function closeKuromiHeart() {
    animateHeart(1, 0, 800, () => stageKuromi?.classList.remove("active-kuromi"));
}

// ===== CHUYỂN SANG / VỀ KUROMI =====
function revealKuromiCard() {
    const kCard = document.getElementById("kuromi-card");
    if (kCard) {
        kCard.style.opacity = "";
        kCard.classList.add("card-pop-k");
        setTimeout(() => kCard.classList.remove("card-pop-k"), 1300);

        const r = kCard.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        fxRing(cx, cy, 0, "pink");
        fxSparks(cx, cy, 40, "pink");
        fxHearts(cx, cy, 18);
    }
    playKuromiSound();
    kuromiBusy = false;
    setTimeout(startKuromiTypewriter, 700);
    setTimeout(() => showCake("kuromi"), 700);
}

function transitionToKuromi() {
    if (currentStage === 3 || introRunning) return;
    currentStage = 3;
    initAudio().then(playKuromiSound);

    clearInterval(jjkTypeTimer);
    if (jjkTypewriterEl) jjkTypewriterEl.textContent = APP_CONFIG.jjkMessage;
    jjkSwipeNote?.classList.remove("opacity-0", "pointer-events-none");

    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    stageJJK?.classList.add("dim");
    fxFlash(cx, cy, "pink");
    fxRing(cx, cy, 0, "pink");
    fxRing(cx, cy, 0.18, "pink");
    fxHearts(cx, cy, 30);
    fxShake();

    // từ lần thứ 2: chỉ mở trái tim cho nhanh
    if (kuromiSeen) {
        setTimeout(openKuromiHeart, 120);
        setTimeout(startKuromiTypewriter, 800);
        return;
    }

    kuromiSeen = true;
    kuromiBusy = true;
    setTimeout(() => { kuromiBusy = false; }, 3200);   // chốt an toàn: lỗi gì cũng không bị kẹt

    const kCard = document.getElementById("kuromi-card");
    if (kCard) kCard.style.opacity = "0";

    setTimeout(openKuromiHeart, 150);
    setTimeout(showKuromiBanner, 750);
    setTimeout(hideKuromiBanner, 1900);
    setTimeout(revealKuromiCard, 2000);
}

function transitionBackToJJK() {
    if (currentStage === 2 || kuromiBusy) return;
    currentStage = 2;
    clearInterval(kuromiTypeTimer);
    playDomainSound();
    stageJJK?.classList.remove("dim");
    closeKuromiHeart();
}
function startKuromiTypewriter() {
    if (!kuromiTypewriterEl) return;
    clearInterval(kuromiTypeTimer);

    let idx = kuromiTypewriterEl.textContent.length; // gõ tiếp từ chỗ dở
    const text = APP_CONFIG.kuromiMessage;
    kuromiTypeTimer = setInterval(() => {
        if (idx < text.length) {
            kuromiTypewriterEl.textContent += text.charAt(idx);
            kuromiTypewriterEl.parentElement.scrollTop = kuromiTypewriterEl.parentElement.scrollHeight;
            idx++;
            if (idx % 2 === 0) playKeyClick();
        } else {
            clearInterval(kuromiTypeTimer);
        }
    }, APP_CONFIG.typewriterSpeedKuromi);
}

// Touch & wheel events
let touchStartX = 0;
window.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, {passive: true});
window.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (currentStage === 2 && diff < -60) transitionToKuromi();
    if (currentStage === 3 && diff > 60) transitionBackToJJK();
}, {passive: true});

window.addEventListener("wheel", (e) => {
    if (currentStage === 2 && e.deltaX > 40) transitionToKuromi();
    if (currentStage === 3 && e.deltaX < -40) transitionBackToJJK();
}, {passive: true});

// Click event for swipe note
jjkSwipeNote?.addEventListener("click", transitionToKuromi);

// BG canvas JJK
// ===== BG canvas JJK: hạt sáng + confetti =====
const jjkBgCanvas = document.getElementById("jjk-bg-canvas");
const jjkCtx = jjkBgCanvas ? jjkBgCanvas.getContext("2d") : null;
let jjkOrbs = [];
let jjkConfetti = [];
const CONFETTI_COLORS = ["#f472b6", "#22d3ee", "#facc15", "#a78bfa", "#4ade80", "#fb7185"];

function initJJKBg() {
    if (!jjkBgCanvas) return;
    jjkBgCanvas.width = window.innerWidth;
    jjkBgCanvas.height = window.innerHeight;
    jjkOrbs = [];
    for (let i = 0; i < 40; i++) {
        jjkOrbs.push({ x: Math.random()*jjkBgCanvas.width, y: Math.random()*jjkBgCanvas.height, r: Math.random()*3+1, vy: -Math.random()*0.5-0.2 });
    }
    jjkConfetti = [];
    for (let i = 0; i < 45; i++) {
        jjkConfetti.push({
            x: Math.random() * jjkBgCanvas.width,
            y: Math.random() * jjkBgCanvas.height,
            w: Math.random() * 6 + 6,
            h: Math.random() * 4 + 4,
            vy: Math.random() * 0.8 + 0.5,
            sway: Math.random() * Math.PI * 2,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.08,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
        });
    }
}

function renderJJKBg() {
    if (currentStage === 2 && jjkCtx) {
        jjkCtx.clearRect(0, 0, jjkBgCanvas.width, jjkBgCanvas.height);

        jjkCtx.fillStyle = "rgba(0, 242, 254, 0.6)";
        for (let o of jjkOrbs) {
            o.y += o.vy;
            if (o.y < 0) o.y = jjkBgCanvas.height;
            jjkCtx.beginPath(); jjkCtx.arc(o.x, o.y, o.r, 0, Math.PI*2); jjkCtx.fill();
        }

        for (let c of jjkConfetti) {
            c.y += c.vy;
            c.sway += 0.03;
            c.x += Math.sin(c.sway) * 0.6;
            c.rot += c.vr;
            if (c.y > jjkBgCanvas.height + 10) { c.y = -10; c.x = Math.random() * jjkBgCanvas.width; }
            jjkCtx.save();
            jjkCtx.translate(c.x, c.y);
            jjkCtx.rotate(c.rot);
            jjkCtx.fillStyle = c.color;
            jjkCtx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            jjkCtx.restore();
        }
    }
    requestAnimationFrame(renderJJKBg);
}

// ===== BG canvas Kuromi: tim, sao bay lên =====
const kuromiBgCanvas = document.getElementById("kuromi-bg-canvas");
const kuromiCtx = kuromiBgCanvas ? kuromiBgCanvas.getContext("2d") : null;
let kuromiParticles = [];
const KUROMI_CHARS = ["💖", "🖤", "💜", "✨", "🎀", "⭐"];

function initKuromiBg() {
    if (!kuromiBgCanvas) return;
    kuromiBgCanvas.width = window.innerWidth;
    kuromiBgCanvas.height = window.innerHeight;
    kuromiParticles = [];
    for (let i = 0; i < 30; i++) {
        kuromiParticles.push({
            x: Math.random() * kuromiBgCanvas.width,
            y: Math.random() * kuromiBgCanvas.height,
            size: Math.random() * 18 + 12,
            vy: -Math.random() * 0.6 - 0.3,
            sway: Math.random() * Math.PI * 2,
            ch: KUROMI_CHARS[Math.floor(Math.random() * KUROMI_CHARS.length)]
        });
    }
}

function renderKuromiBg() {
    if (currentStage === 3 && kuromiCtx) {
        kuromiCtx.clearRect(0, 0, kuromiBgCanvas.width, kuromiBgCanvas.height);
        kuromiCtx.globalAlpha = 0.85;
        for (let p of kuromiParticles) {
            p.y += p.vy;
            p.sway += 0.02;
            p.x += Math.sin(p.sway) * 0.5;
            if (p.y < -30) { p.y = kuromiBgCanvas.height + 30; p.x = Math.random() * kuromiBgCanvas.width; }
            kuromiCtx.font = `${p.size}px serif`;
            kuromiCtx.fillText(p.ch, p.x, p.y);
        }
    }
    requestAnimationFrame(renderKuromiBg);
}
let kuromiHearts = [];

function initKuromiBg() {
    if (!kuromiBgCanvas) return;
    kuromiBgCanvas.width = window.innerWidth;
    kuromiBgCanvas.height = window.innerHeight;
    kuromiHearts = [];
    for (let i = 0; i < 25; i++) {
        kuromiHearts.push({
            x: Math.random() * kuromiBgCanvas.width,
            y: Math.random() * kuromiBgCanvas.height,
            size: Math.random() * 14 + 10,
            vy: -Math.random() * 0.6 - 0.3,
            ch: Math.random() < 0.5 ? "💖" : "✨"
        });
    }
}
function renderKuromiBg() {
    if (currentStage === 3 && kuromiCtx) {
        kuromiCtx.clearRect(0, 0, kuromiBgCanvas.width, kuromiBgCanvas.height);
        kuromiCtx.globalAlpha = 0.7;
        for (const h of kuromiHearts) {
            h.y += h.vy;
            if (h.y < -20) h.y = kuromiBgCanvas.height + 20;
            kuromiCtx.font = `${h.size}px serif`;
            kuromiCtx.fillText(h.ch, h.x, h.y);
        }
    }
    requestAnimationFrame(renderKuromiBg);
}
window.addEventListener("DOMContentLoaded", () => {
    resizeDrawCanvas();
    initJJKBg();
    renderPaperLoop();
    renderJJKBg();
    initKuromiBg();
renderKuromiBg();
    buildParty();
       initFireworks();
    initSecretBox();
// và trong listener resize: initKuromiBg();

    drawCanvas?.addEventListener("mousedown", startDrawing);
    drawCanvas?.addEventListener("mousemove", moveDrawing);
    window.addEventListener("mouseup", endDrawing);

    drawCanvas?.addEventListener("touchstart", (e) => { e.preventDefault(); startDrawing(e); }, { passive: false });
    drawCanvas?.addEventListener("touchmove", (e) => { e.preventDefault(); moveDrawing(e); }, { passive: false });
    window.addEventListener("touchend", endDrawing);

        window.addEventListener("resize", () => { resizeDrawCanvas(); initJJKBg(); buildParty(); });
});

// ===== CHIBI BẮN RA SAU KHI THỔI NẾN, ĐI VÒNG QUANH BỨC THƯ =====
const CHIBI_SETS = {
    jjk:    ["🐼", "🐧", "🐰", "🐥", "🦊", "🐱", "🐻", "🐹"],
    kuromi: ["🐰", "🦄", "🐱", "🐻", "🐹", "🐥", "🐷", "🐑"]
};
const chibiList = { jjk: [], kuromi: [] };
let chibiLoopOn = false;

function chibiStageOf(key) {
    return key === "jjk" ? stageJJK : stageKuromi;
}
function chibiCardOf(key) {
    return key === "jjk" ? jjkCard : document.getElementById("kuromi-card");
}

// vị trí trên chu vi hình chữ nhật của bức thư
function perimeterPoint(rect, t) {
    const w = rect.width, h = rect.height, P = 2 * (w + h);
    let d = ((t % P) + P) % P;
    if (d < w) return { x: rect.left + d, y: rect.top, dir: 1 };          // mép trên → phải
    d -= w;
    if (d < h) return { x: rect.right, y: rect.top + d, dir: 1 };         // mép phải ↓
    d -= h;
    if (d < w) return { x: rect.right - d, y: rect.bottom, dir: -1 };     // mép dưới ← trái
    d -= w;
    return { x: rect.left, y: rect.bottom - d, dir: -1 };                 // mép trái ↑
}

function spawnChibis(key) {
    const stage = chibiStageOf(key);
    const card = chibiCardOf(key);
    const cake = document.getElementById(`cake-${key}`);
    if (!stage || !card || !cake) return;

    const from = cake.querySelector(".candle-holder").getBoundingClientRect();
    const sx = from.left + from.width / 2, sy = from.top + 10;
    const emojis = CHIBI_SETS[key];
    const count = 8;
    const rect0 = card.getBoundingClientRect();
    const P = 2 * (rect0.width + rect0.height);

    for (let i = 0; i < count; i++) {
        const el = document.createElement("div");
        el.className = `chibi chibi-${key}`;
        el.innerHTML = `<div class="chibi-body"><span class="chibi-face">${emojis[i % emojis.length]}</span></div><i class="chibi-shadow"></i>`;
        stage.appendChild(el);

        const c = {
            el,
            t: (P / count) * i + Math.random() * 40,
            speed: (0.35 + Math.random() * 0.35) * (Math.random() < 0.25 ? -1 : 1) * 60,   // px / giây
            phase: "fly",
            born: performance.now() + i * 140,                  // bắn lần lượt
            flyMs: 900 + Math.random() * 300,
            sx, sy,
            arc: 140 + Math.random() * 120,
            x: sx, y: sy,
            pause: 0
        };
        el.style.opacity = "0";
        el.addEventListener("click", () => chibiPet(c));
        el.addEventListener("touchstart", (e) => { e.preventDefault(); chibiPet(c); }, { passive: false });
        chibiList[key].push(c);
    }
    if (!chibiLoopOn) { chibiLoopOn = true; requestAnimationFrame(chibiLoop); }
}

// chạm vào chibi thì nó nhảy lên + nhả tim
function chibiPet(c) {
    c.el.classList.remove("chibi-jump");
    void c.el.offsetWidth;
    c.el.classList.add("chibi-jump");
    c.pause = 900;
    const r = c.el.getBoundingClientRect();
    fxHearts(r.left + r.width / 2, r.top, 5);
}

let chibiLast = performance.now();
function chibiLoop(now) {
    const dt = Math.min(now - chibiLast, 50);
    chibiLast = now;

    for (const key of ["jjk", "kuromi"]) {
        const active = (key === "jjk" && currentStage === 2) || (key === "kuromi" && currentStage === 3);
        if (!active) continue;
        const card = chibiCardOf(key);
        if (!card) continue;
        const rect = card.getBoundingClientRect();

        for (const c of chibiList[key]) {
            if (now < c.born) continue;
            c.el.style.opacity = "1";

            if (c.phase === "fly") {
                const p = Math.min((now - c.born) / c.flyMs, 1);
                const e = 1 - Math.pow(1 - p, 3);
                const target = perimeterPoint(rect, c.t);
                c.x = c.sx + (target.x - c.sx) * e;
                c.y = c.sy + (target.y - c.sy) * e - Math.sin(p * Math.PI) * c.arc;
                c.el.firstChild.style.transform = `rotate(${p * 360}deg)`;
                if (p >= 1) {
                    c.phase = "walk";
                    c.el.firstChild.style.transform = "";
                    fxSparks(c.x, c.y, 6, "pink");
                }
            } else {
                if (c.pause > 0) c.pause -= dt;
                else c.t += c.speed * dt / 1000;
                const pt = perimeterPoint(rect, c.t);
                c.x = pt.x; c.y = pt.y;
                const faceDir = (c.speed >= 0 ? 1 : -1) * pt.dir;
                c.el.firstChild.firstChild.style.transform = `scaleX(${faceDir})`;
                c.el.classList.toggle("chibi-walk", c.pause <= 0);
            }
            c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
        }
    }
    requestAnimationFrame(chibiLoop);
}
// ================= PARTY DECOR (stage 2 + 3) =================
const PARTY_THEME = {
    "stage-jjk": {
        colors: ["#22d3ee", "#f472b6", "#facc15", "#a78bfa", "#4ade80", "#fb7185"],
        glow: ["rgba(34,211,238,.38)", "rgba(244,114,182,.32)", "rgba(250,204,21,.24)"],
        confetti: false            // stage 2 đã có confetti canvas rồi
    },
    "stage-kuromi": {
        colors: ["#ff85c0", "#c084fc", "#ec4899", "#fbcfe8", "#8b5cf6", "#fde68a"],
        glow: ["rgba(255,133,192,.42)", "rgba(168,85,247,.36)", "rgba(251,207,232,.26)"],
        confetti: true
    }
};
const partyRnd = (a, b) => a + Math.random() * (b - a);

function buildParty() {
    const W = window.innerWidth;
    for (const [id, th] of Object.entries(PARTY_THEME)) {
        const stage = document.getElementById(id);
        if (!stage) continue;
        stage.querySelectorAll(":scope > .party-layer").forEach(n => n.remove());

        const layer = document.createElement("div");
        layer.className = "party-layer";

        // ánh đèn màu loang dưới đáy
        const glow = document.createElement("div");
        glow.className = "party-glow";
        glow.style.background =
            `radial-gradient(circle at 12% 92%, ${th.glow[0]}, transparent 42%),` +
            `radial-gradient(circle at 88% 88%, ${th.glow[1]}, transparent 42%),` +
            `radial-gradient(circle at 50% 108%, ${th.glow[2]}, transparent 50%)`;
        layer.appendChild(glow);

        // dây cờ (2 vòng cung)
        const sag = 22, y0 = 6;
        layer.insertAdjacentHTML("beforeend",
            `<svg class="bunting-svg" width="${W}" height="80" viewBox="0 0 ${W} 80">` +
            `<path d="M0,${y0} Q${W / 4},${y0 + 2 * sag} ${W / 2},${y0} Q${W * 3 / 4},${y0 + 2 * sag} ${W},${y0}" ` +
            `fill="none" stroke="rgba(255,255,255,.8)" stroke-width="2"/></svg>`);
        const n = Math.max(8, Math.round(W / 46));
        for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n, u = (t * 2) % 1;
            const f = document.createElement("i");
            f.className = "flag";
            f.style.left = `${t * W - 13}px`;
            f.style.top = `${y0 + 4 * sag * u * (1 - u)}px`;
            f.style.background = th.colors[i % th.colors.length];
            f.style.animationDelay = `${-Math.random() * 2.4}s`;
            layer.appendChild(f);
        }

        // bóng bay
        const balloons = W < 700 ? 8 : 14;
        for (let i = 0; i < balloons; i++) {
            const b = document.createElement("div");
            const t = partyRnd(9, 17);
            b.className = "party-balloon";
            b.style.left = `${partyRnd(2, 96)}%`;
            b.style.setProperty("--w", `${partyRnd(30, 48)}px`);
            b.style.setProperty("--c", th.colors[i % th.colors.length]);
            b.style.setProperty("--t", `${t}s`);
            b.style.setProperty("--dl", `${-Math.random() * t}s`);
            b.style.setProperty("--sx", `${partyRnd(-40, 40)}px`);
            layer.appendChild(b);
        }

        // confetti rơi
        if (th.confetti) {
            for (let i = 0; i < 26; i++) {
                const c = document.createElement("div");
                const t = partyRnd(6, 11);
                c.className = "party-confetti";
                c.style.left = `${partyRnd(0, 100)}%`;
                c.style.setProperty("--c", th.colors[i % th.colors.length]);
                c.style.setProperty("--t", `${t}s`);
                c.style.setProperty("--dl", `${-Math.random() * t}s`);
                c.style.setProperty("--sx", `${partyRnd(-60, 60)}px`);
                layer.appendChild(c);
            }
        }
        stage.appendChild(layer);
    }
}

// ================= SECRET BOX (stage 3) =================
const SECRET_WISHES = [
    "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !",
    "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !",
    "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !", "Xinh gái bậc nhất !", "Tone hằm cuti !", "Disc với tui nha", "Dang yeu vai lz", "Hài vai lozz", "Bà đao tui ko đao", "Tui ẹp trai bà bị oc chs", "Bỏ Gộ theo tui đi !"
];
const WISH_COLORS = ["#fbcfe8", "#e9d5ff", "#fde68a", "#bae6fd", "#bbf7d0", "#fecdd3", "#ffffff"];

let kTapCount = 0, kTapTimer = null, secretOpen = false;

function shuffleArr(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function popTapLabel(x, y, text) {
    const s = document.createElement("span");
    s.className = "tap-pop";
    s.textContent = text;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 950);
}

function initSecretBox() {
    const wrap = document.querySelector("#kuromi-card .kuromi-bounce");
    if (!wrap) return;
    wrap.style.cursor = "pointer";
    wrap.style.touchAction = "manipulation";

    wrap.addEventListener("click", () => {
        if (currentStage !== 3 || kuromiBusy || secretOpen) return;
        kTapCount++;
        clearTimeout(kTapTimer);
        kTapTimer = setTimeout(() => { kTapCount = 0; }, 2000);   // ngưng 2s thì đếm lại từ đầu

        [...wrap.children].forEach(ch => {
            ch.classList.remove("kuromi-squish");
            void ch.offsetWidth;
            ch.classList.add("kuromi-squish");
        });
        const r = wrap.getBoundingClientRect();
        popTapLabel(r.left + r.width / 2, r.top + 10, `${kTapCount}/3 ${"💗".repeat(kTapCount)}`);
        fxHearts(r.left + r.width / 2, r.top + r.height / 2, 4);
        playKeyClick();

        if (kTapCount >= 3) {
            kTapCount = 0;
            clearTimeout(kTapTimer);
            setTimeout(raiseSecretBox, 350);
        }
    });
}

function raiseSecretBox() {
    if (secretOpen || !stageKuromi) return;
    secretOpen = true;

    const bd = document.createElement("div");
    bd.id = "sbox-backdrop";
    const box = document.createElement("div");
    box.className = "sbox";
    box.innerHTML = `<span class="sbox-hint">🎁 Chạm để mở!</span><div class="sbox-body"></div><div class="sbox-lid"><span class="sbox-bow">🎀</span></div>`;
    stageKuromi.append(bd, box);
    requestAnimationFrame(() => bd.classList.add("show"));
    playKuromiSound();

    const readyAt = performance.now() + 2800;     // nổi lên xong mới cho mở
    let opened = false;
    box.addEventListener("click", () => {
        if (opened || performance.now() < readyAt) return;
        opened = true;
        openSecretBox(box);
    });
}

function openSecretBox(box) {
    box.classList.add("opened");
       fireCannons();
    const r = box.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2 - 20;
    fxRing(cx, cy, 0, "pink");
    fxSparks(cx, cy, 40, "pink");
    fxHearts(cx, cy, 16);
    playKuromiSound();

    // chia màn hình thành lưới ô, mỗi lời chúc 1 ô (chừa chỗ cho hộp ở giữa)
    const W = window.innerWidth, H = window.innerHeight;
    const cols = Math.max(2, Math.floor(W / 150));
    const rows = Math.max(4, Math.floor((H - 120) / 64));
    const cw = W / cols, chh = (H - 110) / rows, top0 = 70;
    const cells = [];
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const x = (i + 0.5) * cw, y = top0 + (j + 0.5) * chh;
            if (Math.abs(x - cx) < cw * 0.5 + 70 && Math.abs(y - cy) < chh * 0.5 + 75) continue;
            cells.push({ x, y });
        }
    }
    shuffleArr(cells);
    const wishes = [...SECRET_WISHES.slice(0, 3), ...shuffleArr(SECRET_WISHES.slice(3))].slice(0, cells.length);

    wishes.forEach((txt, i) => {
        const c = cells[i];
        const x = c.x + (Math.random() - 0.5) * cw * 0.25;
        const y = c.y + (Math.random() - 0.5) * chh * 0.3;
        const el = document.createElement("div");
        el.className = "wish";
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.setProperty("--fx", `${cx - x}px`);
        el.style.setProperty("--fy", `${cy - y}px`);
        el.style.setProperty("--d", `${0.35 + i * 0.05}s`);
        const pill = document.createElement("span");
        pill.className = "wish-pill";
        pill.textContent = txt;
        pill.style.background = WISH_COLORS[i % WISH_COLORS.length];
        pill.style.maxWidth = `${cw - 10}px`;
        pill.style.setProperty("--bt", `${2.5 + Math.random() * 2}s`);
        pill.style.setProperty("--bd", `${-Math.random() * 3}s`);
        el.appendChild(pill);
        stageKuromi.appendChild(el);
    });

    const btn = document.createElement("button");
    btn.id = "sbox-close";
    btn.textContent = "Đóng hộp quà 💝";
    btn.addEventListener("click", closeSecretBox);
    stageKuromi.appendChild(btn);
}

function closeSecretBox() {
    const items = stageKuromi.querySelectorAll("#sbox-backdrop, .sbox, .wish, #sbox-close");
    items.forEach(el => el.classList.add("sbox-leaving"));
    setTimeout(() => {
        items.forEach(el => el.remove());
        secretOpen = false;
           showMemoryCard();
    }, 450);
}
// ================= PHÁO HOA + PHÁO GIẤY (canvas) =================
let fwCv = null, fwCtx = null, fwLoopOn = false, fwLast = 0, fwLastBoom = 0, fwNoise = null;
const fwRockets = [], fwSparks = [], fwConfetti = [];

function initFireworks() {
    fwCv = document.createElement("canvas");
    fwCv.id = "fireworks-canvas";
    document.body.appendChild(fwCv);
    fwCtx = fwCv.getContext("2d");
    resizeFireworks();
    window.addEventListener("resize", resizeFireworks);
}
function resizeFireworks() {
    if (!fwCv) return;
    fwCv.width = window.innerWidth;
    fwCv.height = window.innerHeight;
}
function startFw() {
    if (fwLoopOn || !fwCv) return;
    fwLoopOn = true;
    fwLast = performance.now();
    requestAnimationFrame(fwFrame);
}

function fwBoom() {
    const now = performance.now();
    if (!soundEnabled || !audioInitialized || typeof Tone === "undefined" || now - fwLastBoom < 140) return;
    fwLastBoom = now;
    try {
        if (!fwNoise) {
            fwNoise = new Tone.NoiseSynth({ noise: { type: "brown" }, envelope: { attack: 0.003, decay: 0.3, sustain: 0 } }).toDestination();
            fwNoise.volume.value = -14;
        }
        fwNoise.triggerAttackRelease("8n");
        synthBell?.triggerAttackRelease(["C6", "E6", "G6"][Math.floor(Math.random() * 3)], "16n", Tone.now() + 0.05);
    } catch (e) {}
}

function fwLaunch(hue, heart = false) {
    const W = window.innerWidth, H = window.innerHeight;
    fwRockets.push({
        x: W * (0.15 + Math.random() * 0.7), y: H + 10,
        ty: H * (0.12 + Math.random() * 0.3),
        vy: -(H * 0.014 + Math.random() * 3),
        hue, heart
    });
    startFw();
}

function fwExplode(x, y, hue, heart) {
    fwBoom();
    const n = heart ? 70 : 80 + Math.floor(Math.random() * 30);
    const sp = 3 + Math.random() * 2.5;
    for (let i = 0; i < n; i++) {
        let vx, vy;
        if (heart) {
            const t = (i / n) * Math.PI * 2;
            vx = 16 * Math.pow(Math.sin(t), 3) * 0.26;
            vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.26;
        } else {
            const a = Math.random() * Math.PI * 2, s = sp * (0.35 + Math.random() * 0.65);
            vx = Math.cos(a) * s; vy = Math.sin(a) * s;
        }
        const life = 60 + Math.random() * 35;
        fwSparks.push({
            x, y, px: x, py: y, vx, vy, life, max: life,
            hue: hue + (Math.random() * 30 - 15), w: 2.2,
            g: heart ? 0.02 : 0.045, f: heart ? 0.965 : 0.975
        });
    }
}

// pháo giấy bắn chéo từ 2 góc dưới
function fireCannons() {
    if (!fwCv) return;
    const W = window.innerWidth, H = window.innerHeight;
    const colors = ["#f472b6", "#22d3ee", "#facc15", "#a78bfa", "#4ade80", "#fb7185", "#ffffff", "#ff85c0"];
    [0, 260, 520].forEach(delay => setTimeout(() => {
        for (const side of [-1, 1]) {                      // -1 = góc trái, 1 = góc phải
            for (let i = 0; i < 46; i++) {
                const h = H * (0.5 + Math.random() * 0.45);
                const vy0 = Math.sqrt(2 * 0.2 * h);
                fwConfetti.push({
                    x: side < 0 ? 8 : W - 8, y: H - 8,
                    vx: -side * vy0 * (0.18 + Math.random() * 0.5),
                    vy: -vy0,
                    w: 6 + Math.random() * 5, h: 10 + Math.random() * 6,
                    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
                    tilt: Math.random() * Math.PI * 2, vt: 0.1 + Math.random() * 0.2,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }
        }
        startFw();
    }, delay));
}

function fwFrame(now) {
    const dt = Math.min((now - fwLast) / 16.67, 3) || 1;
    fwLast = now;
    const W = fwCv.width, H = fwCv.height;
    fwCtx.clearRect(0, 0, W, H);

    // tên lửa bay lên
    fwCtx.globalCompositeOperation = "lighter";
    for (let i = fwRockets.length - 1; i >= 0; i--) {
        const r = fwRockets[i];
        r.y += r.vy * dt;
        fwSparks.push({ x: r.x, y: r.y, px: r.x, py: r.y + 6, vx: (Math.random() - 0.5) * 0.6, vy: 0.3 + Math.random() * 0.6, life: 16, max: 16, hue: r.hue, w: 1.6, g: 0.02, f: 0.96 });
        fwCtx.globalAlpha = 1;
        fwCtx.fillStyle = `hsl(${r.hue},100%,80%)`;
        fwCtx.beginPath(); fwCtx.arc(r.x, r.y, 2.6, 0, Math.PI * 2); fwCtx.fill();
        if (r.y <= r.ty) { fwExplode(r.x, r.y, r.hue, r.heart); fwRockets.splice(i, 1); }
    }

    // tia lửa
    fwCtx.lineCap = "round";
    for (let i = fwSparks.length - 1; i >= 0; i--) {
        const s = fwSparks[i];
        s.px = s.x; s.py = s.y;
        s.vx *= Math.pow(s.f, dt);
        s.vy = s.vy * Math.pow(s.f, dt) + s.g * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) { fwSparks.splice(i, 1); continue; }
        const k = s.life / s.max;
        fwCtx.globalAlpha = Math.min(1, k * 1.4);
        fwCtx.strokeStyle = `hsl(${s.hue},100%,${60 + 20 * k}%)`;
        fwCtx.lineWidth = s.w;
        fwCtx.beginPath(); fwCtx.moveTo(s.px, s.py); fwCtx.lineTo(s.x, s.y); fwCtx.stroke();
    }

    // pháo giấy
    fwCtx.globalCompositeOperation = "source-over";
    fwCtx.globalAlpha = 1;
    for (let i = fwConfetti.length - 1; i >= 0; i--) {
        const c = fwConfetti[i];
        c.vx *= Math.pow(0.996, dt);
        c.vy = Math.min(c.vy + 0.2 * dt, 4.2);
        c.x += (c.vx + Math.sin(c.tilt) * 0.5) * dt;
        c.y += c.vy * dt;
        c.rot += c.vr * dt;
        c.tilt += c.vt * dt;
        if (c.y > H + 30 && c.vy > 0) { fwConfetti.splice(i, 1); continue; }
        fwCtx.save();
        fwCtx.translate(c.x, c.y);
        fwCtx.rotate(c.rot);
        fwCtx.scale(1, Math.cos(c.tilt));
        fwCtx.fillStyle = c.color;
        fwCtx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        fwCtx.restore();
    }

    if (fwRockets.length || fwSparks.length || fwConfetti.length) {
        requestAnimationFrame(fwFrame);
    } else {
        fwCtx.clearRect(0, 0, W, H);
        fwLoopOn = false;
    }
}

// ================= "ƯỚC ĐI NÀO" → PHÁO HOA → CHIBI =================
function celebrate(key) {
    runWishMoment(key, () => {
        launchShow(key);
        fireCannons();
        setTimeout(() => spawnChibis(key), 600);
    });
}

function launchShow(key) {
    const hues = key === "jjk" ? [185, 330, 48, 265, 140] : [330, 290, 265, 340, 48];
    for (let i = 0; i < 11; i++) {
        setTimeout(() => fwLaunch(hues[i % hues.length], key === "kuromi" ? i % 3 === 0 : i % 5 === 4), i * 380);
    }
}

function runWishMoment(key, done) {
    const ov = document.createElement("div");
    ov.id = "wish-moment";
    ov.className = `wm-${key}`;
    ov.innerHTML = `<p class="wm-line">Nhắm mắt ước một điều nha...</p><p class="wm-sub">✨ chỉ cậu biết thôi ✨</p>`;
    for (let i = 0; i < 26; i++) {
        const s = document.createElement("i");
        s.className = "wm-star";
        s.style.left = `${Math.random() * 100}%`;
        s.style.top = `${Math.random() * 100}%`;
        s.style.setProperty("--s", `${2 + Math.random() * 3}px`);
        s.style.setProperty("--dl", `${-Math.random() * 2.2}s`);
        ov.appendChild(s);
    }
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add("show"));

    setTimeout(shootStar, 2800);                         // sao băng vụt qua
    setTimeout(() => ov.classList.remove("show"), 4300); // màn tối mờ dần
    setTimeout(done, 4500);                              // bùm: pháo hoa
    setTimeout(() => ov.remove(), 5400);
}

function shootStar() {
    const s = document.createElement("div");
    s.className = "shoot-star";
    s.style.top = `${8 + Math.random() * 14}%`;
    s.style.left = `${70 + Math.random() * 12}%`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1400);
    try {
        if (soundEnabled && synthBell) {
            synthBell.triggerAttackRelease("E6", "16n");
            synthBell.triggerAttackRelease("B6", "8n", Tone.now() + 0.12);
            synthBell.triggerAttackRelease("E7", "8n", Tone.now() + 0.25);
        }
    } catch (e) {}
}

// ================= THẺ KỶ NIỆM (sau khi đóng hộp quà) =================
const MEMORY_CARD = {
    photo: "1.jpg", 
    fallbackPhoto: "1.jpg", 
    title: "Gửi Thư",
    message: "Bà oi, đủ tuổi đi tù rồi, đừng đi tù nha tui nhớ bà lắm TT",
    sign: "Vanh"
};
let memoryShown = false;

function showMemoryCard() {
    if (memoryShown) return;
    memoryShown = true;

    const wrap = document.createElement("div");
    wrap.id = "memory-wrap";
    wrap.innerHTML = `
        <div class="memory-card">
            <i class="tape tape-l"></i><i class="tape tape-r"></i>
            <div class="memory-photo"><img alt=""></div>
            <h3 class="memory-title"></h3>
            <p class="memory-msg"></p>
            <svg class="memory-sign" viewBox="0 0 240 84"><text x="14" y="60"></text></svg>
            <button class="memory-close" type="button">Đóng</button>
        </div>`;
    wrap.querySelector(".memory-title").textContent = MEMORY_CARD.title;
    wrap.querySelector(".memory-msg").textContent = MEMORY_CARD.message;
    wrap.querySelector(".memory-sign text").textContent = MEMORY_CARD.sign;

    const img = wrap.querySelector("img");
    let tried = 0;
    img.onerror = () => {
        if (tried++ === 0 && MEMORY_CARD.fallbackPhoto) {
            img.src = MEMORY_CARD.fallbackPhoto;
        } else {
            const e = document.createElement("div");
            e.className = "memory-emoji";
            e.textContent = "🎀";
            img.replaceWith(e);
        }
    };
    img.src = MEMORY_CARD.photo;

    wrap.querySelector(".memory-close").addEventListener("click", () => {
        wrap.classList.add("leaving");
        setTimeout(() => wrap.remove(), 450);
    });
    document.body.appendChild(wrap);

    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    fxRing(cx, cy, 0, "pink");
    fxHearts(cx, cy, 22);
    playKuromiSound();
}