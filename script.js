let hasBlown = false;
let micStream = null; // stream saklanacak

navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        micStream = stream; // global değişkene kaydet
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const mic = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;

        mic.connect(analyser);

        const data = new Uint8Array(analyser.fftSize);

        function detectBlow() {
            analyser.getByteTimeDomainData(data);
            const volume = Math.max(...data.map(v => Math.abs(v - 128))) / 128;

            if (volume > 0.35 && !hasBlown) {
                hasBlown = true;
                console.log("Üfleme algılandı!");
                blowOutCandles();
            }

            if (!hasBlown) {
                requestAnimationFrame(detectBlow);
            }
        }

        detectBlow();
    })
    .catch(err => {
        console.error("Mikrofon erişimi reddedildi:", err);
        alert("Lütfen mikrofon izni verin, yoksa mumları üfleyemezsiniz 🎂🎤");
    });

function blowOutCandles() {
    // Mikrofona erişimi durdur
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        console.log("Mikrofon kapatıldı.");
    }

    const flame = document.querySelector(".flame");
    if (flame) {
        flame.style.transition = "opacity 1s ease-out";
        flame.style.opacity = 0;
        setTimeout(() => flame.style.display = "none", 1000);
    }

    startBalloonLoop(); // balon animasyon döngüsünü başlat

    const message = document.getElementById("message");
    if (message) {
        message.style.display = "block";
        message.style.animation = "none";
        void message.offsetWidth; // Reflow
        message.style.animation = "popIn 1s ease-out";
    }

    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });

    const music = document.getElementById("bg-music");
    if (music) music.volume = 1;
}

function createBalloons(count) {
    const container = document.getElementById("balloon-container");

    for (let i = 0; i < count; i++) {
        const balloon = document.createElement("div");
        balloon.classList.add("balloon");

        // Rastgele konum ve renk tonlaması
        balloon.style.left = `${Math.random() * 100}%`;
        balloon.style.backgroundColor = `rgba(${200 + Math.random()*55}, ${100 + Math.random()*155}, ${150 + Math.random()*105}, 0.5)`;
        balloon.style.animationDuration = `${4 + Math.random() * 2}s`;

        container.appendChild(balloon);

        // Balon uçup kaybolunca DOM'dan sil
        setTimeout(() => container.removeChild(balloon), 6000);
    }
}

function startBalloonLoop() {
    const container = document.getElementById("balloon-container");

    setInterval(() => {
        const balloon = document.createElement("div");
        balloon.classList.add("balloon");

        balloon.style.left = `${Math.random() * 90 + 5}%`; // %5 - %95 arası
        const r = 200 + Math.random() * 55;
        const g = 100 + Math.random() * 155;
        const b = 150 + Math.random() * 105;
        balloon.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.4)`;

        // balloon.style.animationDuration = `${4 + Math.random() * 2}s`; // faster
        balloon.style.animationDuration = `${2 + Math.random() * 3}s`; // faster
        // balloon.style.animationDuration = `${6 + Math.random() * 3}s`; // slower

        container.appendChild(balloon);

        setTimeout(() => {
            if (balloon.parentElement) {
                balloon.remove();
            }
        }, 7000);
    }, 1000); // Her 1 saniyede bir balon
}
