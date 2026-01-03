const Config = {
    // Kullanıcı arayüzünde görünen metinler
    texts: {
        title: "Happy Birthday", // Tarayıcı sekmesindeki başlık
        permissionTitle: "🎤 Mikrofon İzni Gerekli", // İzin ekranı başlığı
        permissionStatus: "Sürpriz için lütfen mikrofon izni ver.", // İzin durumu mesajı
        permissionBtn: "Mikrofonu Aç", // Buton metni
        permissionHint: "İzin verdikten sonra sürpriz ekrana gelecek 😋", // Buton altındaki ipucu
        cakeMessage: "🎉 Sürpriiiiiiz! 🎉<br />Canımın içiii, iyi ki doğduunnnn 🥳🥳🎉🎉💕💕", // Pasta üflendikten sonra çıkan mesaj
        blowHint: "Hadiii üfle mumları artık 😋", // Üfleme gecikirse çıkan ipucu
        modalTitle: "", // Başlık artık modalContent içinde (çerçeve düzeni için)
        modalContent: `
            <div class="framed-content">
                <div class="paper-title">💌 Biricik sevgilimee 💌</div>
                <div class="slideshow-container">
                    <!-- Resimler script.js tarafından Config.slideshow.photos dizisinden doldurulacak -->
                </div>
                <div class="paper-text">
                    <p>Bugüüün canım aşkımın doğum günüüü 🥳,</p>
                    <p>Doğum günün kutlu olsun hayatımmm 🎂🎊</p>
                    <p>Hayatıma kattığın tüm güzellikler için teşekkür ederim. Seninle geçen her gün benim için bir hediye.</p>
                    <p>Yeni yaşında yüzünden gülümseme hiç eksik olmasın. Seni çok seviyorummm 🤍</p>
                    <p class="signature">Sana çok aşık olan sevgilinnn,<br><strong>Yasin</strong></p>
                </div>
            </div>`, // Mektup içeriği (HTML destekler)
        micRequesting: 'Mikrofon izni isteniyor... Lütfen "İzin ver" seç.', // İzin istenirken
        micDenied: 'Mikrofon izni verilmedi. Tarayıcıdan mikrofon iznini açıp tekrar dene.', // İzin reddedilirse
        micNotFound: 'Mikrofon bulunamadı. Cihazında mikrofon olduğundan emin ol.', // Mikrofon yoksa
        micError: 'Mikrofon başlatılamadı. Lütfen tekrar dene.' // Genel hata
    },
    // Zamanlamalar (milisaniye cinsinden)
    timeouts: {
        blowHint: 5000, // Üfleme ipucunun çıkması için bekleme süresi
        letterShow: 5000, // Mum söndükten sonra mektubun belirmesi için bekleme süresi
        balloonRemove: 7000, // Oluşan balonun DOM'dan silinme süresi
        balloonLoop: 1000, // Yeni balon üretme sıklığı
        flameFade: 1000, // Alevin sönme animasyonu süresi
        messagePop: 1000 // Mesajın ekrana gelme animasyonu süresi
    },
    // Algılama eşik değerleri
    thresholds: {
        micVolume: 0.35 // Mikrofon hassasiyeti (0.0 - 1.0 arası). Düşük değer daha hassas.
    },
    // Konfeti efekti ayarları
    confetti: {
        count: 150, // Konfeti parçacık sayısı
        spread: 70, // Yayılma açısı
        originY: 0.6 // Dikey çıkış noktası (0.0 üst, 1.0 alt)
    },
    // Balon animasyon süreleri (saniye cinsinden)
    balloons: {
        minDuration: 2, // En hızlı balonun yukarı çıkış süresi
        randomDuration: 3 // Rastgele eklenecek ek süre (min + random)
    },
    // Slayt gösterisi ayarları
    slideshow: {
        interval: 3000, // Geçiş süresi (ms)
        photos: [
            "photos/our-image-1.png",
            "photos/our-image-2.png",
            "photos/our-image-3.png"
        ]
    },
    // Yıldız efekti ayarları
    stars: {
        count: 60, // Ekranda görünecek yıldız sayısı
        minSize: 1, // Minimum boyut (px)
        maxSize: 3, // Maksimum boyut (px)
        minDuration: 2, // Minimum yanıp sönme süresi (sn)
        maxDuration: 5 // Maksimum yanıp sönme süresi (sn)
    },
    // CSS değişkenlerini buradan dinamik olarak güncellemek için
    cssVars: {
        '--balloon-float-duration': '6s', // CSS'deki balon uçuş süresi
        '--message-pop-duration': '1s' // CSS'deki mesaj belirme süresi
    }
};