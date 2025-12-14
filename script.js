// CONFIGURACIÓN (Tus claves reales)
const CONFIG = {
    SUPABASE_URL: 'https://qspwtmfmolvqlzsbwlzv.supabase.co',
    SUPABASE_KEY: 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU',
    GEMINI_KEY: 'AIzaSyCXWHwntRNF_IcZAjPPJyARZp_uAhn8QL8'
};

const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let searchTimeout;
let todosLosProductos = [];
let productoActual = null;
let puntuacion = 0;

// --- SISTEMA DE NOTIFICACIONES (TOAST) ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    
    toast.innerHTML = `<span>${icon}</span> <span style="font-size:0.9rem">${message}</span>`;
    container.appendChild(toast);

    // Sonido sutil (opcional)
    // const audio = new Audio('pop.mp3'); audio.play();

    // Eliminar después de 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 1. CARGAR MENÚ (Con Skeleton)
async function cargarMenu() {
    const grid = document.getElementById('menu-grid');
    // Mostrar Skeletons mientras carga
    grid.innerHTML = Array(6).fill('<div class="skeleton skeleton-card"></div>').join('');

    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select(`*, opiniones(puntuacion)`)
        .eq('activo', true)
        .order('destacado', { ascending: false })
        .order('id', { ascending: false });

    if (error) { 
        showToast("Error al cargar el menú", "error");
        grid.innerHTML = '<p style="text-align:center; color:#666">Error de conexión.</p>';
        return; 
    }

    // Calcular ratings
    todosLosProductos = productos.map(prod => {
        const total = prod.opiniones.length;
        const suma = prod.opiniones.reduce((acc, curr) => acc + curr.puntuacion, 0);
        prod.ratingPromedio = total ? (suma / total).toFixed(1) : null;
        return prod;
    });

    renderizarMenu(todosLosProductos);
}

// 2. RENDERIZAR (Animado)
function renderizarMenu(lista) {
    const contenedor = document.getElementById('menu-grid');
    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;"><h4>🤷‍♂️ Sin resultados</h4><p>Intenta con otra palabra</p></div>';
        return;
    }

    // Añadir delay progresivo a la animación
    let html = '';
    lista.forEach((item, index) => {
        const claseAgotado = item.estado === 'agotado' ? 'agotado' : '';
        const img = item.imagen_url || 'https://via.placeholder.com/300?text=Sin+Imagen';
        const badge = item.destacado ? `<span class="badge-destacado">👑 TOP</span>` : '';
        const rating = item.ratingPromedio ? `★ ${item.ratingPromedio}` : '★ Nuevo';
        const delay = index * 0.05; // 50ms de retraso entre cada carta

        html += `
            <div class="card ${claseAgotado}" style="animation-delay: ${delay}s" onclick="abrirDetalle(${item.id})">
                ${badge}
                <div class="img-box"><img src="${img}" loading="lazy" alt="${item.nombre}"></div>
                <div class="info">
                    <h3>${item.nombre}</h3>
                    <p class="short-desc">${item.descripcion || ''}</p>
                    <div class="price-row">
                         <span class="price">$${item.precio}</span>
                         <span class="rating-mini">${rating}</span>
                    </div>
                </div>
            </div>
        `;
    });
    contenedor.innerHTML = html;
}

// 3. MODALES (Con clases activas)
function abrirDetalle(id) {
    productoActual = todosLosProductos.find(p => p.id === id);
    if (!productoActual) return;

    document.getElementById('det-img').src = productoActual.imagen_url || '';
    document.getElementById('det-titulo').textContent = productoActual.nombre;
    document.getElementById('det-desc').textContent = productoActual.descripcion;
    document.getElementById('det-precio').textContent = `$${productoActual.precio}`;
    
    // Curiosidad
    const box = document.getElementById('box-curiosidad');
    const textoCuriosidad = document.getElementById('det-curiosidad');
    if (productoActual.curiosidad && productoActual.curiosidad.length > 5) {
        box.style.display = "flex";
        textoCuriosidad.textContent = productoActual.curiosidad;
    } else {
        box.style.display = "none";
    }
    
    const modal = document.getElementById('modal-detalle');
    modal.classList.add('active'); // Usamos clase para animar
}

function cerrarDetalle() {
    document.getElementById('modal-detalle').classList.remove('active');
}

// 4. OPINIONES
function abrirOpinion() {
    cerrarDetalle();
    const modal = document.getElementById('modal-opinion');
    modal.classList.add('active');
    puntuacion = 0;
    actualizarEstrellas();
}

function cerrarModalOpinion() {
    document.getElementById('modal-opinion').classList.remove('active');
}

// Estrellas
document.getElementById('stars-container').addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
        puntuacion = parseInt(e.target.dataset.val);
        actualizarEstrellas();
        // Feedback visual
        e.target.style.transform = "scale(1.3)";
        setTimeout(()=>e.target.style.transform = "scale(1)", 200);
    }
});

function actualizarEstrellas() {
    document.querySelectorAll('#stars-container span').forEach(s => {
        const val = parseInt(s.dataset.val);
        s.style.color = val <= puntuacion ? 'var(--gold)' : '#444';
        s.textContent = val <= puntuacion ? '★' : '☆'; // Llenas vs vacías
    });
}

async function enviarOpinion() {
    if (puntuacion === 0) { showToast("¡Toca las estrellas para calificar!", "error"); return; }
    
    const nombre = document.getElementById('cliente-nombre').value || "Anónimo";
    const comentario = document.getElementById('cliente-comentario').value;
    const btn = document.getElementById('btn-enviar-opinion');

    btn.textContent = "Enviando..."; btn.disabled = true;

    const { error } = await supabaseClient.from('opiniones').insert([{
        producto_id: productoActual.id,
        cliente_nombre: nombre,
        comentario: comentario,
        puntuacion: puntuacion
    }]);

    if (!error) {
        showToast("¡Gracias por tu opinión!", "success");
        cerrarModalOpinion();
        document.getElementById('cliente-comentario').value = "";
        cargarMenu(); 
    } else {
        showToast("Error al enviar.", "error");
    }
    btn.textContent = "ENVIAR RESEÑA"; btn.disabled = false;
}

// 5. FILTROS & BUSCADOR
function filtrar(cat, btn) {
    // Animación botón activo
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Scroll suave al botón
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    document.getElementById('search-input').value = '';
    
    const lista = cat === 'todos' ? todosLosProductos : todosLosProductos.filter(p => p.categoria === cat);
    renderizarMenu(lista);
}

document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const term = e.target.value.toLowerCase();
    searchTimeout = setTimeout(() => {
        const lista = todosLosProductos.filter(p => 
            p.nombre.toLowerCase().includes(term) || 
            (p.descripcion && p.descripcion.toLowerCase().includes(term))
        );
        renderizarMenu(lista);
    }, 300);
});

document.addEventListener('DOMContentLoaded', cargarMenu);