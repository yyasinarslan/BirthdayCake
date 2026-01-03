let hasBlown = false;
let micStream = null; // stream saklanacak
let analyser = null;
let data = null;
let rafId = null;
let blowHintTimeoutId = null;
let blowHintEl = null;

// Letter content (edit this text later)
const LETTER_TEXT = `Merhaba!\n\nBuraya uzun mektubunu yapıştıracaksın.\n\nİstersen satır satır yazabilirsin; \"\\n\" satır atlatır.`;

let showLetterTimeoutId = null;

function qs(sel) {
    return document.querySelector(sel);
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
    el.textContent = 'Hadi üfle mumları artık 🤩';
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
    }, 5000);
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
    if (body) body.textContent = LETTER_TEXT;

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
    }, 5000);
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

    if (volume > 0.35 && !hasBlown) {
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
        setPermissionStatus('Mikrofon izni isteniyor... Lütfen "İzin ver" seç.');

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
            setPermissionStatus('Mikrofon izni verilmedi. Tarayıcıdan mikrofon iznini açıp tekrar dene.');
        } else if (err && err.name === 'NotFoundError') {
            setPermissionStatus('Mikrofon bulunamadı. Cihazında mikrofon olduğundan emin ol.');
        } else {
            setPermissionStatus('Mikrofon başlatılamadı. Lütfen tekrar dene.');
        }
    }
}

// Start after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
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
        flame.style.transition = 'opacity 1s ease-out';
        flame.style.opacity = 0;
        setTimeout(() => (flame.style.display = 'none'), 1000);
    }

    startBalloonLoop();
    scheduleLetterAfterBlow();

    const message = document.getElementById('message');
    if (message) {
        message.style.display = 'block';
        message.style.animation = 'none';
        void message.offsetWidth; // Reflow
        message.style.animation = 'popIn 1s ease-out';
    }

    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
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
        balloon.style.animationDuration = `${2 + Math.random() * 3}s`;

        container.appendChild(balloon);

        setTimeout(() => {
            if (balloon.parentElement) {
                balloon.remove();
            }
        }, 7000);
    }, 1000);
}
