// --- BASE DE DATOS DEL MENÚ ---
const menuData = [
    {
        id: 1,
        category: 'cocteles',
        title: 'Mojito Cubano',
        price: 350,
        img: 'img/mojito.avif',
        desc: 'El clásico indiscutible. Ron Havana Club 3 Años, hierbabuena fresca macerada, azúcar blanca, jugo de limón y un toque de soda.'
    },
    {
        id: 2,
        category: 'cocteles',
        title: 'Piña Colada',
        price: 400,
        img: 'img/pina.webp',
        desc: 'Dulce y cremosa. Mezcla de crema de coco natural, jugo de piña fresco y Ron Blanco. Decorado con trozos de piña.'
    },
    {
        id: 3,
        category: 'cocteles',
        title: 'Daiquiri Frappé',
        price: 380,
        img: 'img/daiquiri.avif',
        desc: 'La cuna del Daiquiri. Ron, limón y azúcar batidos con hielo frappé hasta el punto de nieve.'
    },
    {
        id: 4,
        category: 'cervezas',
        title: 'Cerveza Cristal',
        price: 250,
        img: 'img/cereveza.avif',
        desc: 'La preferida de Cuba. Lager clara, suave y refrescante. Servida bien fría.'
    },
    {
        id: 5,
        category: 'cervezas',
        title: 'Cerveza Importada',
        price: 300,
        img: 'img/cerveza2.avif',
        desc: 'Selección premium: Heineken, Corona o similar según disponibilidad. Preguntar al bartender.'
    },
    {
        id: 6,
        category: 'tapas',
        title: 'Tostones Rellenos',
        price: 450,
        img: 'img/tostones.webp',
        desc: '3 tostones gigantes de plátano macho, rellenos de Ropa Vieja cubana o Jamón y Queso gratinado.'
    },
    {
        id: 7,
        category: 'tapas',
        title: 'Tabla de Quesos',
        price: 800,
        img: 'img/tabla.webp',
        desc: 'Perfecta para compartir. Selección de quesos gouda, azul y blanco, acompañados de aceitunas y jamón serrano.'
    }
];

// --- 1. RENDERIZADO DEL MENÚ ---
const container = document.getElementById('menu-container');

function renderMenu(filter = 'todos') {
    container.innerHTML = ''; // Limpiar
    
    // Filtrar datos
    const itemsToShow = filter === 'todos' 
        ? menuData 
        : menuData.filter(item => item.category === filter);

    // Animación de entrada
    itemsToShow.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card item-enter';
        card.style.animationDelay = `${index * 0.05}s`; // Efecto cascada
        
        card.innerHTML = `
            <div class="img-box">
                <img src="${item.img}" alt="${item.title}" loading="lazy">
            </div>
            <div class="info">
                <div class="card-header">
                    <h3>${item.title}</h3>
                    <span class="price-badge">$${item.price}</span>
                </div>
                <p class="short-desc">${item.desc.substring(0, 50)}...</p>
            </div>
        `;
        
        // Click para abrir modal
        card.onclick = () => openModal(item);
        
        container.appendChild(card);
    });
}

// --- 2. SISTEMA DE FILTRADO ---
function filterMenu(category) {
    // Actualizar botones
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active'); // Nota: event debe pasarse o usarse globalmente con cuidado, aquí funciona inline.
    
    renderMenu(category);
}

// --- 3. MODAL & WHATSAPP ---
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close-btn');

function openModal(item) {
    document.getElementById('modal-title').textContent = item.title;
    document.getElementById('modal-price').textContent = `$${item.price} CUP`;
    document.getElementById('modal-desc').textContent = item.desc;
    document.getElementById('modal-img').src = item.img;
    document.getElementById('modal-cat').textContent = item.category.toUpperCase();
    
    // Configurar botón de WhatsApp
    const btn = document.getElementById('whatsapp-btn');
    const phone = "5350000000"; // TU NÚMERO AQUÍ
    const msg = `Hola! Quisiera pedir: ${item.title} ($${item.price}).`;
    btn.onclick = () => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');

    modal.style.display = 'flex';
}

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

// --- 4. ESTADO DEL LOCAL ---
function checkStatus() {
    const badge = document.getElementById('status-badge');
    const now = new Date();
    const hour = now.getHours();
    const isOpen = (hour >= 18 || hour < 2);

    if (isOpen) {
        badge.innerHTML = "🟢 Abierto Ahora";
        badge.className = "badge open pulse";
    } else {
        badge.innerHTML = "🔴 Cerrado";
        badge.className = "badge closed";
    }
}

// INICIALIZAR
document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    checkStatus();
});