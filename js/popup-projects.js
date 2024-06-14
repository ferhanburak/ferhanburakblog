// Popup açma fonksiyonu
function openModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

// Popup kapatma fonksiyonu
function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Modal linklerini ve spanları içeren veri yapısı
const modals = [
    {
        linkSelector: '.popup-link[href="#modalInterview"]',
        spanId: 'spanInterview',
        modalId: 'modalInterview'
    },
    {
        linkSelector: '.popup-link[href="#modalBOTAS"]',
        spanId: 'spanBOTAS',
        modalId: 'modalBOTAS'
    },
    {
        linkSelector: '.popup-link[href="#modalBlackjack"]',
        spanId: 'spanBlackjack',
        modalId: 'modalBlackjack'
    },
    {
        linkSelector: '.popup-link[href="#modalCourseFeedback"]',
        spanId: 'spanCourseFeedback',
        modalId: 'modalCourseFeedback'
    }
];

// Her bir modal için açma ve kapama olaylarını tanımla
modals.forEach(modal => {
    const link = document.querySelector(modal.linkSelector);
    const span = document.getElementById(modal.spanId);

    if (link && span) {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            openModal(modal.modalId);
        });

        span.addEventListener('click', function() {
            closeModal(modal.modalId);
        });

        // Click event listener for closing modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target == document.getElementById(modal.modalId)) {
                closeModal(modal.modalId);
            }
        });
    }
});
