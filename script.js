let hasBlown = false;
let micStream = null; // stream saklanacak
let analyser = null;
let data = null;
let rafId = null;
let blowHintTimeoutId = null;
let blowHintEl = null;
let balloonInterval = null;

let showLetterTimeoutId = null;
let slideshowInterval = null;

function qs(sel) {
    return document.querySelector(sel);
}

function setFavicon(emoji) {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'icon';
    link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
    document.getElementsByTagName('head')[0].appendChild(link);
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
    setTxt('#wait-title', Config.texts.waitTitle);
    setTxt('#wait-message', Config.texts.waitMessage);
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

    // Update browser tab for the celebration
    document.title = Config.texts.title;
    setFavicon('🎂');

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
    if (body) {
        body.innerHTML = Config.texts.modalContent;

        // Resimleri dinamik olarak ekle
        const container = body.querySelector('.slideshow-container');
        if (container) {
            const photos = Config.slideshow && Config.slideshow.photos;
            if (photos && photos.length > 0) {
                let failCount = 0;
                photos.forEach((src, index) => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.className = index === 0 ? 'slide active first-entry' : 'slide';
                    img.alt = `Anı ${index + 1}`;
                    img.onerror = function() {
                        this.style.display = 'none';
                        failCount++;
                        if (failCount === photos.length) {
                            container.style.display = 'none';
                        }
                    };
                    container.appendChild(img);
                });
            } else {
                container.style.display = 'none';
            }
        }
    }

    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        startSlideshow();
    }
}

function closeLetter() {
    stopSlideshow();
    const modal = qs('#letter-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    // Eğer mum üflendiyse ve mektup kapatılıyorsa tekrar oynat butonunu göster
    if (hasBlown) {
        const replayBtn = qs('#replay-btn');
        if (replayBtn) replayBtn.style.display = 'block';
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

    const replayBtn = qs('#replay-btn');
    if (replayBtn) replayBtn.style.display = 'none';
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

    // Set browser tab for permission stage
    document.title = Config.texts.permissionTitle;
    setFavicon('🎤');

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

function checkDateAccess() {
    if (!Config.date) return true; // Tarih ayarlanmamışsa her zaman çalışır

    // Config.date formatı: "YYYY-MM-DD"
    const parts = Config.date.split('-');
    // Javascript'te aylar 0-11 arasıdır, o yüzden ay kısmından 1 çıkarıyoruz
    const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
    
    if (Config.time) {
        const timeParts = Config.time.split(':');
        targetDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
    } else {
        targetDate.setHours(0, 0, 0, 0);
    }

    const now = new Date();

    // Eğer şu anki tarih, hedef tarihten küçükse (daha gelmediyse)
    if (now < targetDate) {
        const waitScreen = qs('#wait-screen');
        const permScreen = qs('#permission-screen');
        
        if (permScreen) permScreen.style.display = 'none';
        if (waitScreen) waitScreen.style.display = 'flex';

        if (Config.texts.waitBrowserTitle) {
            document.title = Config.texts.waitBrowserTitle;
        }
        
        startCountdown(targetDate);
        return false;
    }
    return true;
}

function startCountdown(targetDate) {
    const countdownEl = qs('#countdown');
    if (!countdownEl) return;

    const update = () => {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) {
            // Süre dolduysa sayfayı yenile
            location.reload();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownEl.innerHTML = `
            <div class="time-unit"><span>${days}</span><label>Gün</label></div>
            <div class="time-unit"><span>${hours}</span><label>Saat</label></div>
            <div class="time-unit"><span>${minutes}</span><label>Dk</label></div>
            <div class="time-unit"><span>${seconds}</span><label>Sn</label></div>
        `;
    };

    update();
    setInterval(update, 1000);
}

// Start after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    applyConfig();
    createStars();

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
    // Önce tarihi kontrol et, eğer günüyse başlat
    if (checkDateAccess()) {
        initMicAndStart();
    }

    const adminTrigger = qs('#admin-trigger');
    if (adminTrigger) {
        adminTrigger.addEventListener('click', () => {
            const pwd = prompt("Admin Girişi:");
            if (pwd === Config.adminPassword) {
                const waitScreen = qs('#wait-screen');
                const permScreen = qs('#permission-screen');
                if (waitScreen) waitScreen.style.display = 'none';
                if (permScreen) permScreen.style.display = 'flex';
                document.title = Config.texts.permissionTitle;
                setFavicon('🎤');
            }
        });
    }

    const replayBtn = qs('#replay-btn');
    if (replayBtn) {
        replayBtn.addEventListener('click', resetExperience);
    }
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

    const flames = document.querySelectorAll('.flame');
    flames.forEach(flame => {
        flame.style.transition = `opacity ${Config.timeouts.flameFade / 1000}s ease-out`;
        flame.style.opacity = 0;
        setTimeout(() => (flame.style.display = 'none'), Config.timeouts.flameFade);
    });

    const smokes = document.querySelectorAll('.smoke');
    smokes.forEach(smoke => {
        smoke.classList.add('puff');
    });

    document.body.classList.add('lights-on');

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
}

function startBalloonLoop() {
    const container = document.getElementById('balloon-container');

    if (balloonInterval) clearInterval(balloonInterval);
    balloonInterval = setInterval(() => {
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

function createStars() {
    const container = document.getElementById('star-container');
    if (!container) return;

    for (let i = 0; i < Config.stars.count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Config.stars.minSize + Math.random() * (Config.stars.maxSize - Config.stars.minSize);
        const duration = Config.stars.minDuration + Math.random() * (Config.stars.maxDuration - Config.stars.minDuration);
        const delay = Math.random() * 5;

        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.setProperty('--twinkle-duration', `${duration}s`);
        star.style.animationDelay = `${delay}s`;

        container.appendChild(star);
    }
}

function startSlideshow() {
    const slides = document.querySelectorAll('.slideshow-container .slide');
    if (slides.length === 0) return;

    let slideIndex = 0;
    stopSlideshow();

    const interval = (Config.slideshow && Config.slideshow.interval) ? Config.slideshow.interval : 3000;

    slideshowInterval = setInterval(() => {
        slides[slideIndex].classList.remove('active');
        slides[slideIndex].classList.remove('first-entry');
        slideIndex = (slideIndex + 1) % slides.length;
        slides[slideIndex].classList.add('active');
    }, interval);
}

function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
}

function resetExperience() {
    const message = qs('#message');
    if (message) message.style.display = 'none';

    const container = document.getElementById('balloon-container');
    if (container) container.innerHTML = '';

    if (balloonInterval) {
        clearInterval(balloonInterval);
        balloonInterval = null;
    }

    const flames = document.querySelectorAll('.flame');
    flames.forEach(flame => {
        flame.style.transition = 'none';
        flame.style.opacity = 1;
        flame.style.display = 'block';
    });

    const smokes = document.querySelectorAll('.smoke');
    smokes.forEach(smoke => {
        smoke.classList.remove('puff');
    });

    document.body.classList.remove('lights-on');

    initMicAndStart();
}
