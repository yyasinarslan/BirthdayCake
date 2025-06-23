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

            if (volume > 0.3 && !hasBlown) {
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
