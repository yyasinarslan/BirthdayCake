let hasBlown = false;
let micStream = null; // stream saklanacak
let analyser = null;
let data = null;
let rafId = null;

function qs(sel) {
    return document.querySelector(sel);
}

function showCakeAndHidePermission() {
    const permissionScreen = qs('#permission-screen');
    const cake = qs('#cake');

    if (permissionScreen) permissionScreen.style.display = 'none';
    if (cake) cake.style.display = 'block';
}

function setPermissionStatus(text) {
    const status = qs('#permission-status');
    if (status) status.textContent = text;
}

function detectBlow() {
    if (!analyser || !data) return;

    analyser.getByteTimeDomainData(data);
    const volume = Math.max(...data.map(v => Math.abs(v - 128))) / 128;

    if (volume > 0.35 && !hasBlown) {
        hasBlown = true;
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

    // Try once automatically (works on many browsers). If the browser requires a user gesture,
    // the overlay remains and the user can click the button.
    initMicAndStart();
});

function blowOutCandles() {
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
