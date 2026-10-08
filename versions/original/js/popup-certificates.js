  // Udemy sertifikası popup açma
  const modalUdemy = document.getElementById('modalUdemy');
  const udemyTitle = document.getElementById('udemyTitle');
  const spanUdemy = document.getElementById('spanUdemy');

  udemyTitle.addEventListener('click', function() {
      modalUdemy.style.display = 'block';
  });

  spanUdemy.addEventListener('click', function() {
      modalUdemy.style.display = 'none';
  });

  // BTK Akademi sertifikası popup açma
  const modalBTK = document.getElementById('modalBTK');
  const btkTitle = document.getElementById('btkTitle');
  const spanBTK = document.getElementById('spanBTK');

  btkTitle.addEventListener('click', function() {
      modalBTK.style.display = 'block';
  });

  spanBTK.addEventListener('click', function() {
      modalBTK.style.display = 'none';
  });

  // Hackathon / Gamejam Projects sertifikası popup açma
  const modalHackathon = document.getElementById('modalHackathon');
  const hackathonTitle = document.getElementById('hackathonTitle');
  const spanHackathon = document.getElementById('spanHackathon');

  hackathonTitle.addEventListener('click', function() {
      modalHackathon.style.display = 'block';
  });

  spanHackathon.addEventListener('click', function() {
      modalHackathon.style.display = 'none';
  });

  // Others sertifikası popup açma
  const modalOthers = document.getElementById('modalOthers');
  const othersTitle = document.getElementById('othersTitle');
  const spanOthers = document.getElementById('spanOthers');

  othersTitle.addEventListener('click', function() {
      modalOthers.style.display = 'block';
  });

  spanOthers.addEventListener('click', function() {
      modalOthers.style.display = 'none';
  });
