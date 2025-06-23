let hasBlown = false;

// Mikrofon izni ve ses analizi
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const mic = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;

        mic.connect(analyser);

        const data = new Uint8Array(analyser.fftSize);

        function detectBlow() {
            analyser.getByteTimeDomainData(data);
            const volume = Math.max(...data.map(v => Math.abs(v - 128))) / 128;

            if (volume > 0.3 && !hasBlown) {  // Bu eşik sesi algılamak için yeterli ve daha önce üflenmedi
                hasBlown = true;
                console.log("Üfleme algılandı!");
                blowOutCandles();
            }

            requestAnimationFrame(detectBlow);
        }

        detectBlow();
    })
    .catch(err => {
        console.error("Mikrofon erişimi reddedildi:", err);
        alert("Lütfen mikrofon izni verin, yoksa mumları üfleyemezsiniz 🎂🎤");
    });

// Mumu söndür ve mesajı göster
function blowOutCandles() {
    const flame = document.querySelector(".flame");
    if (flame) {
        flame.style.transition = "opacity 1s ease-out";
        flame.style.opacity = 0;
        setTimeout(() => flame.style.display = "none", 1000);
    }

    const message = document.getElementById("message");
    if (message) {
        message.style.display = "block";
        message.style.animation = "fadeIn 1s ease-out";
    }

    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });

    const music = document.getElementById("bg-music");
    if (music) music.volume = 1;
}