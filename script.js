
let searchTimeout;
let todosLosProductos = [];
let productoActual = null;
let puntuacion = 0;

// --- SISTEMA TOAST ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return; // Protección si no existe
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span style="font-size:0.9rem">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 1. CARGAR MENÚ (BLINDADO)
async function cargarMenu() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = Array(6).fill('<div class="skeleton skeleton-card"></div>').join('');

    try {
        // Intento 1: Cargar Productos + Opiniones
        let { data: productos, error } = await supabaseClient
            .from('productos')
            .select(`*, opiniones(puntuacion)`)
            .eq('activo', true)
            .order('destacado', { ascending: false })
            .order('id', { ascending: false });

        if (error) throw error;

        // Si funciona, calculamos ratings
        todosLosProductos = productos.map(prod => {
            // Protección por si opiniones viene null
            const opiniones = prod.opiniones || [];
            const total = opiniones.length;
            const suma = opiniones.reduce((acc, curr) => acc + curr.puntuacion, 0);
            prod.ratingPromedio = total ? (suma / total).toFixed(1) : null;
            return prod;
        });

    } catch (err) {
        console.warn("Fallo carga compleja, intentando modo simple...", err);
        
        // Intento 2: Cargar SOLO productos (Respaldo de seguridad)
        let { data: productosSimple, error: errorSimple } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('activo', true)
            .order('destacado', { ascending: false });

        if (errorSimple) {
            console.error("Error crítico:", errorSimple);
            grid.innerHTML = '<div style="text-align:center; padding:20px; color:#ff5252">Error de conexión. Por favor recarga.</div>';
            return;
        }

        todosLosProductos = productosSimple.map(p => ({...p, ratingPromedio: null}));
    }

    renderizarMenu(todosLosProductos);
}

// 2. RENDERIZAR
function renderizarMenu(lista) {
    const contenedor = document.getElementById('menu-grid');
    contenedor.innerHTML = '';

    if (!lista || lista.length === 0) {
        contenedor.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;"><h4>Carta Vacía 🍽️</h4><p>Estamos preparando nuevos platos.</p></div>';
        return;
    }

    let html = '';
    lista.forEach((item, index) => {
        const claseAgotado = item.estado === 'agotado' ? 'agotado' : '';
        const img = item.imagen_url || 'https://via.placeholder.com/300?text=Sin+Imagen';
        const badge = item.destacado ? `<span class="badge-destacado">👑 TOP</span>` : '';
        const rating = item.ratingPromedio ? `★ ${item.ratingPromedio}` : '★ Nuevo';
        
        // Animación progresiva
        const delay = index * 0.05;

        html += `
            <div class="card ${claseAgotado}" style="animation: fadeUp 0.6s forwards ${delay}s; opacity: 0;" onclick="abrirDetalle(${item.id})">
                ${badge}
                <div class="img-box"><img src="${img}" loading="lazy" alt="${item.nombre}"></div>
                <div class="info">
                    <h3>${item.nombre}</h3>
                    <p class="short-desc">${item.descripcion || 'Sin descripción'}</p>
                    <div class="card-footer">
                         <span class="price">$${item.precio}</span>
                         <span class="rating-pill">${rating}</span>
                    </div>
                </div>
            </div>
        `;
    });
    contenedor.innerHTML = html;
}

// 3. DETALLE
function abrirDetalle(id) {
    productoActual = todosLosProductos.find(p => p.id === id);
    if (!productoActual) return;

    const imgEl = document.getElementById('det-img');
    const box = document.getElementById('box-curiosidad');
    
    if(imgEl) imgEl.src = productoActual.imagen_url || '';
    
    setText('det-titulo', productoActual.nombre);
    setText('det-desc', productoActual.descripcion);
    setText('det-precio', `$${productoActual.precio}`);
    
    // Rating grande
    const ratingBig = productoActual.ratingPromedio ? `★ ${productoActual.ratingPromedio}` : '★ --';
    setText('det-rating-big', ratingBig);

    // Curiosidad
    if (productoActual.curiosidad && productoActual.curiosidad.length > 5) {
        box.style.display = "flex";
        setText('det-curiosidad', productoActual.curiosidad);
    } else {
        box.style.display = "none";
    }
    
    const modal = document.getElementById('modal-detalle');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }
}

// Helper seguro para texto
function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
}

function cerrarDetalle() {
    const modal = document.getElementById('modal-detalle');
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// 4. OPINIONES
function abrirOpinionDesdeDetalle() {
    cerrarDetalle();
    const modal = document.getElementById('modal-opinion');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        puntuacion = 0;
        actualizarEstrellas();
    }
}

function cerrarModalOpiniones() {
    const modal = document.getElementById('modal-opinion');
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// Estrellas
const starsContainer = document.getElementById('stars-container');
if(starsContainer) {
    starsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN') {
            puntuacion = parseInt(e.target.dataset.val);
            actualizarEstrellas();
            e.target.style.transform = "scale(1.3)";
            setTimeout(()=>e.target.style.transform = "scale(1)", 200);
        }
    });
}

function actualizarEstrellas() {
    document.querySelectorAll('#stars-container span').forEach(s => {
        const val = parseInt(s.dataset.val);
        s.style.color = val <= puntuacion ? 'var(--gold)' : '#444';
        s.textContent = val <= puntuacion ? '★' : '☆';
    });
}

async function enviarOpinion() {
    if (puntuacion === 0) { showToast("¡Toca las estrellas para calificar!", "error"); return; }
    
    const nombre = document.getElementById('cliente-nombre').value || "Anónimo";
    const comentario = document.getElementById('cliente-comentario').value;
    const btn = document.querySelector('#modal-opinion .btn-big-action'); // Corrección de selector

    if(btn) { btn.textContent = "Enviando..."; btn.disabled = true; }

    const { error } = await supabaseClient.from('opiniones').insert([{
        producto_id: productoActual.id,
        cliente_nombre: nombre,
        comentario: comentario,
        puntuacion: puntuacion
    }]);

    if (!error) {
        showToast("¡Gracias por tu opinión!", "success");
        cerrarModalOpiniones();
        // Limpiar campos
        document.getElementById('cliente-comentario').value = "";
        cargarMenu(); 
    } else {
        showToast("Error al enviar.", "error");
    }
    if(btn) { btn.textContent = "ENVIAR"; btn.disabled = false; }
}

// 5. FILTROS & BUSCADOR
function filtrar(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    // Scroll suave
    if(btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.value = '';
    
    const lista = cat === 'todos' ? todosLosProductos : todosLosProductos.filter(p => p.categoria === cat);
    renderizarMenu(lista);
}

const searchInput = document.getElementById('search-input');
if(searchInput) {
    searchInput.addEventListener('input', (e) => {
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
}

document.addEventListener('DOMContentLoaded', cargarMenu);