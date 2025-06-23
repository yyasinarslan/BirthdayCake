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

            if (volume > 0.3) {  // Bu eşik sesi algılamak için yeterli
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
    if (flame) flame.style.display = "none";

    const message = document.getElementById("message");
    if (message) message.style.display = "block";
}