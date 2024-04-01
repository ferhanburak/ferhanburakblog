// Popup açma fonksiyonu
function openModal(modalId) {
    var modal = document.getElementById(modalId);
    modal.style.display = 'block';
}

// Popup kapatma fonksiyonu
function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Interview Simulation popup açma
const interviewLink = document.querySelector('.popup-link[href="#modalInterview"]');
const spanInterview = document.getElementById('spanInterview');

interviewLink.addEventListener('click', function() {
    openModal('modalInterview');
});

spanInterview.addEventListener('click', function() {
    closeModal('modalInterview');
});

// BOTAS Warehouse System popup açma
const botasLink = document.querySelector('.popup-link[href="#modalBOTAS"]');
const spanBOTAS = document.getElementById('spanBOTAS');

botasLink.addEventListener('click', function() {
    openModal('modalBOTAS');
});

spanBOTAS.addEventListener('click', function() {
    closeModal('modalBOTAS');
});

// 2D Blackjack popup açma
const blackjackLink = document.querySelector('.popup-link[href="#modalBlackjack"]');
const spanBlackjack = document.getElementById('spanBlackjack');

blackjackLink.addEventListener('click', function() {
    openModal('modalBlackjack');
});

spanBlackjack.addEventListener('click', function() {
    closeModal('modalBlackjack');
});
