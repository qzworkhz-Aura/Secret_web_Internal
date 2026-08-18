let pages = [];
let currentIndex = 0;

/**
 * Preload gambar sekitar halaman saat ini (prev + next beberapa halaman).
 * Ini sebagai "turbo boost" di atas Service Worker cache.
 */
function preloadNearby() {
    const range = 3; // preload 3 halaman ke depan & belakang
    for (let i = currentIndex - range; i <= currentIndex + range; i++) {
        if (i >= 0 && i < pages.length && i !== currentIndex) {
            const page = pages[i];
            const src = typeof page === "string" ? page : page.src;
            const img = new Image();
            img.src = src;
        }
    }
}

export function initNavigation(mangaPages) {
    pages = mangaPages;
    currentIndex = 0;
    updatepage();
    preloadNearby();
}

function updatepage() {
    const currentPage = pages[currentIndex];
    
    let imageSrc = "";
    let dialogText = "Penjelasan setiap dialog";
    let meaningText = "Penjelasan arti/maksud panel manga";

    // Cek apakah item berupa object (fitur teks dinamis) atau cuma string path gambar
    if (typeof currentPage === "string") {
        imageSrc = currentPage;
    } else {
        imageSrc = currentPage.src;
        dialogText = currentPage.dialog || "Tidak ada dialog";
        meaningText = currentPage.meaning || "Tidak ada penjelasan";
    }

    document.getElementById("comic-page").src = imageSrc;
    document.getElementById("page-num").innerText = currentIndex + 1;
    
    // Perbarui teks di HTML
    const dialogEl = document.getElementById("dialog-text");
    const meaningEl = document.getElementById("meaning-text");
    
    if (dialogEl) {
        if (Array.isArray(dialogText)) {
            dialogEl.innerHTML = "<ul style='text-align: left; margin: 0; padding-left: 20px;'>" + dialogText.map(text => `<li>${text}</li>`).join("") + "</ul>";
        } else {
            dialogEl.innerHTML = dialogText;
        }
    }
    
    if (meaningEl) {
        if (Array.isArray(meaningText)) {
            meaningEl.innerHTML = "<ul style='text-align: left; margin: 0; padding-left: 20px;'>" + meaningText.map(text => `<li>${text}</li>`).join("") + "</ul>";
        } else {
            meaningEl.innerHTML = meaningText;
        }
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') {
        e.preventDefault(); // biar gak ikut scroll halaman
        window.nextpage();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        window.prevpage();
    }
});

window.nextpage = function() {
    if (currentIndex < pages.length - 1) {
        currentIndex ++;
        updatepage();
        preloadNearby();
    }
}

window.prevpage = function() {
    if (currentIndex > 0) {
        currentIndex --;
        updatepage();
        preloadNearby();
    }
}

window.addEventListener('resize', function() {
    updatepage();
});