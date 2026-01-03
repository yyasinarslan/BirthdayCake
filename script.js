const Config = {
    texts: {
        title: "Happy Birthday 🎂",
        permissionTitle: "🎤 Mikrofon İzni Gerekli",
        permissionStatus: "Sürpriz için lütfen mikrofon izni ver.",
        permissionBtn: "Mikrofonu Aç",
        permissionHint: "İzin verdikten sonra sürpriz ekrana gelecek 😋",
        cakeMessage: "🎉 Sürpriz! 🎉<br />Canımın içi, iyi ki doğdun ❤️",
        blowHint: "Hadi üfle mumları artık 🤩",
        letterBtn: "Okumak için tıkla",
        modalTitle: "💌 Sana Bir Mektubum Var",
        modalContent: `
            <p>Canım,</p>
            <p>Bugün senin doğum günün! 🎂</p>
            <p>Hayatıma kattığın tüm güzellikler için teşekkür ederim. Seninle geçen her gün benim için bir hediye.</p>
            <p>Yeni yaşında yüzünden gülümseme hiç eksik olmasın. Seni çok seviyorum! ❤️</p>
            <p class="signature">Sevgilerinle,<br><strong>Yasin</strong></p>`,
        micRequesting: 'Mikrofon izni isteniyor... Lütfen "İzin ver" seç.',
        micDenied: 'Mikrofon izni verilmedi. Tarayıcıdan mikrofon iznini açıp tekrar dene.',
        micNotFound: 'Mikrofon bulunamadı. Cihazında mikrofon olduğundan emin ol.',
        micError: 'Mikrofon başlatılamadı. Lütfen tekrar dene.'
    },
    timeouts: {
        blowHint: 5000,
        letterShow: 5000,
        balloonRemove: 7000,
        balloonLoop: 1000,
        flameFade: 1000,
        messagePop: 1000
    },
    thresholds: {
        micVolume: 0.35
    },
    confetti: {
        count: 150,
        spread: 70,
        originY: 0.6
    },
    balloons: {
        minDuration: 2,
        randomDuration: 3
    },
    cssVars: {
        '--balloon-float-duration': '6s',
        '--message-pop-duration': '1s'
    }
};

let hasBlown = false;
let micStream = null; // stream saklanacak
let analyser = null;
let data = null;
let rafId = null;
let blowHintTimeoutId = null;
let blowHintEl = null;

let showLetterTimeoutId = null;

function qs(sel) {
    return document.querySelector(sel);
}

function applyConfig() {
    document.title = Config.texts.title;
    const setTxt = (sel, txt) => { const el = qs(sel); if(el) el.textContent = txt; };
    const setHtml = (sel, html) => { const el = qs(sel); if(el) el.innerHTML = html; };

    setTxt('.permission-title', Config.texts.permissionTitle);
    setTxt('#permission-status', Config.texts.permissionStatus);
    setTxt('#permission-btn', Config.texts.permissionBtn);
    setTxt('.permission-hint', Config.texts.permissionHint);
    setHtml('#message', Config.texts.cakeMessage);
    setTxt('.letter-text', Config.texts.letterBtn);
    setTxt('.paper-title', Config.texts.modalTitle);

    const root = document.documentElement;
    for (const [key, value] of Object.entries(Config.cssVars)) {
        root.style.setProperty(key, value);
    }
}

function showCakeAndHidePermission() {
    const permissionScreen = qs('#permission-screen');
    const cake = qs('#cake');

    if (permissionScreen) permissionScreen.style.display = 'none';
    if (cake) cake.style.display = 'block';

    // If user doesn't blow for 5 seconds after cake appears, show a gentle hint
    scheduleBlowHint();
    resetLetterUI();
}

function setPermissionStatus(text) {
    const status = qs('#permission-status');
    if (status) status.textContent = text;
}

function ensureBlowHintElement() {
    if (blowHintEl) return blowHintEl;

    const cake = qs('#cake');
    if (!cake) return null;

    const el = document.createElement('div');
    el.className = 'blow-hint';
    el.textContent = Config.texts.blowHint;
    el.style.display = 'none';

    cake.appendChild(el);
    blowHintEl = el;
    return el;
}

function scheduleBlowHint() {
    // Clear any previous timer
    if (blowHintTimeoutId) {
        clearTimeout(blowHintTimeoutId);
        blowHintTimeoutId = null;
    }

    const el = ensureBlowHintElement();
    if (el) {
        el.style.display = 'none';
        el.classList.remove('show');
    }

    blowHintTimeoutId = setTimeout(() => {
        if (!hasBlown) {
            const hint = ensureBlowHintElement();
            if (hint) {
                hint.style.display = 'block';
                hint.classList.remove('show');
                // restart animation
                void hint.offsetWidth;
                hint.classList.add('show');
            }
        }
    }, Config.timeouts.blowHint);
}

function hideBlowHint() {
    if (blowHintTimeoutId) {
        clearTimeout(blowHintTimeoutId);
        blowHintTimeoutId = null;
    }
    if (blowHintEl) {
        blowHintEl.style.display = 'none';
        blowHintEl.classList.remove('show');
    }
}

function showLetterWithAnimation() {
    const letter = qs('#letter');
    if (!letter) return;

    letter.style.display = 'flex';
    letter.classList.remove('show');
    void letter.offsetWidth; // restart animation
    letter.classList.add('show');
}

function openLetter() {
    const modal = qs('#letter-modal');
    const body = qs('#paper-body');
    if (body) body.innerHTML = Config.texts.modalContent;

    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeLetter() {
    const modal = qs('#letter-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}

function scheduleLetterAfterBlow() {
    if (showLetterTimeoutId) {
        clearTimeout(showLetterTimeoutId);
        showLetterTimeoutId = null;
    }

    showLetterTimeoutId = setTimeout(() => {
        showLetterWithAnimation();
    }, Config.timeouts.letterShow);
}

function resetLetterUI() {
    if (showLetterTimeoutId) {
        clearTimeout(showLetterTimeoutId);
        showLetterTimeoutId = null;
    }
    closeLetter();

    const letter = qs('#letter');
    if (letter) {
        letter.style.display = 'none';
        letter.classList.remove('show');
    }
}

function detectBlow() {
    if (!analyser || !data) return;

    analyser.getByteTimeDomainData(data);
    const volume = Math.max(...data.map(v => Math.abs(v - 128))) / 128;

    if (volume > Config.thresholds.micVolume && !hasBlown) {
        hasBlown = true;
        hideBlowHint();
        console.log('Üfleme algılandı!');
        blowOutCandles();
        return;
    }

    if (!hasBlown) {
        rafId = requestAnimationFrame(detectBlow);
    }
}

async function initMicAndStart() {
    // Reset state if user retries
    hideBlowHint();
    resetLetterUI();
    hasBlown = false;
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    try {
        setPermissionStatus(Config.texts.micRequesting);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream = stream;

        // Some browsers suspend AudioContext until a user gesture; since this function
        // is triggered by a click (and also tried on load), we handle both cases.
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            try { await audioContext.resume(); } catch (_) {}
        }

        const mic = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        mic.connect(analyser);

        data = new Uint8Array(analyser.fftSize);

        // Permission granted -> show cake and proceed with normal flow
        showCakeAndHidePermission();
        detectBlow();
    } catch (err) {
        console.error('Mikrofon erişimi reddedildi / başarısız:', err);

        // Keep permission screen visible and allow retry
        if (err && err.name === 'NotAllowedError') {
            setPermissionStatus(Config.texts.micDenied);
        } else if (err && err.name === 'NotFoundError') {
            setPermissionStatus(Config.texts.micNotFound);
        } else {
            setPermissionStatus(Config.texts.micError);
        }
    }
}

// Start after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    applyConfig();

    const btn = qs('#permission-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            initMicAndStart();
        });
    }

    // Letter interactions
    const letter = qs('#letter');
    if (letter) {
        letter.addEventListener('click', openLetter);
    }

    const closeBtn = qs('#letter-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLetter);
    }

    const modal = qs('#letter-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            // click outside the paper closes
            if (e.target === modal) closeLetter();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLetter();
    });

    // Try once automatically (works on many browsers). If the browser requires a user gesture,
    // the overlay remains and the user can click the button.
    initMicAndStart();
});

function blowOutCandles() {
    hideBlowHint();
    // Mikrofona erişimi durdur
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        console.log('Mikrofon kapatıldı.');
    }

    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    const flame = document.querySelector('.flame');
    if (flame) {
        flame.style.transition = `opacity ${Config.timeouts.flameFade / 1000}s ease-out`;
        flame.style.opacity = 0;
        setTimeout(() => (flame.style.display = 'none'), Config.timeouts.flameFade);
    }

    startBalloonLoop();
    scheduleLetterAfterBlow();

    const message = document.getElementById('message');
    if (message) {
        message.style.display = 'block';
        message.style.animation = 'none';
        void message.offsetWidth; // Reflow
        message.style.animation = `popIn var(--message-pop-duration) ease-out`;
    }

    confetti({
        particleCount: Config.confetti.count,
        spread: Config.confetti.spread,
        origin: { y: Config.confetti.originY }
    });

    const music = document.getElementById('bg-music');
    if (music) music.volume = 1;
}

function startBalloonLoop() {
    const container = document.getElementById('balloon-container');

    setInterval(() => {
        const balloon = document.createElement('div');
        balloon.classList.add('balloon');

        balloon.style.left = `${Math.random() * 90 + 5}%`; // %5 - %95
        const r = 200 + Math.random() * 55;
        const g = 100 + Math.random() * 155;
        const b = 150 + Math.random() * 105;
        balloon.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.65)`;
        balloon.style.animationDuration = `${Config.balloons.minDuration + Math.random() * Config.balloons.randomDuration}s`;

        container.appendChild(balloon);

        setTimeout(() => {
            if (balloon.parentElement) {
                balloon.remove();
            }
        }, Config.timeouts.balloonRemove);
    }, Config.timeouts.balloonLoop);
}
