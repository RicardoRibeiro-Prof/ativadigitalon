const menuButton = document.querySelector('#menuBtn');
const nav = document.querySelector('#mainNav');
menuButton?.addEventListener('click', () => nav.classList.toggle('open'));
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

document.querySelectorAll('.audioToggle, .playlist button').forEach(button => {
  button.addEventListener('click', () => {
    const wasActive = button.classList.contains('active');
    document.querySelectorAll('.audioToggle, .playlist button').forEach(item => item.classList.remove('active'));
    if (!wasActive) button.classList.add('active');
    const play = button.matches('.audioToggle') ? button : button.querySelector('.play');
    if (play) play.textContent = wasActive ? '▶' : 'Ⅱ';
  });
});
