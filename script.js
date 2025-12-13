// 1. ESTADO DE APERTURA (Para Bares Nocturnos)
function checkStatus() {
    const badge = document.getElementById('status-badge');
    const now = new Date();
    const hour = now.getHours();

    // Lógica: Está abierto si es mas tarde de las 6PM (18) O es madrugada antes de las 2AM
    const isOpen = (hour >= 18 || hour < 2);

    if (isOpen) {
        badge.textContent = "🟢 ABIERTO AHORA";
        badge.classList.add('open');
        badge.classList.remove('closed');
    } else {
        badge.textContent = "🔴 CERRADO";
        badge.classList.add('closed');
        badge.classList.remove('open');
    }
}
checkStatus(); // Ejecutar al cargar

// 2. FILTRAR MENÚ
function filterMenu(cat) {
    // Manejar estilo botones
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Manejar visualización productos
    document.querySelectorAll('.item').forEach(item => {
        if (cat === 'todos' || item.dataset.category === cat) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 3. POPUP DE DETALLE
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close-btn');

// Al hacer clic en cualquier tarjeta
document.querySelectorAll('.item').forEach(card => {
    card.addEventListener('click', () => {
        // Pasar datos al modal
        document.getElementById('modal-title').textContent = card.dataset.title;
        document.getElementById('modal-price').textContent = card.dataset.price;
        document.getElementById('modal-desc').textContent = card.dataset.desc;
        document.getElementById('modal-img').src = card.dataset.img;

        // Mostrar
        modal.style.display = 'flex';
    });
});

// Cerrar con el botón X
closeBtn.onclick = () => {
    modal.style.display = 'none';
};

// Cerrar si tocan fuera de la tarjeta
window.onclick = (e) => {
    if (e.target == modal) {
        modal.style.display = 'none';
    }
};