// --- script.js ---
// Configuración viene de config.js. NO repetir aquí.

let searchTimeout;
let todosLosProductos = [];
let productoActual = null;
let puntuacion = 0;

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; setTimeout(()=>toast.remove(),300); }, 3000);
}

// 1. CARGAR MENÚ
async function cargarMenu() {
    const grid = document.getElementById('menu-grid');
    if (grid) grid.innerHTML = Array(6).fill('<div class="skeleton" style="height:160px; background:#222; border-radius:18px; margin-bottom:10px; opacity:0.5; animation:pulse 1s infinite;"></div>').join('');

    try {
        if (typeof supabaseClient === 'undefined') throw new Error("Supabase off");

        let { data: productos, error } = await supabaseClient
            .from('productos')
            .select(`*, opiniones(puntuacion)`)
            .eq('activo', true)
            .order('destacado', { ascending: false })
            .order('id', { ascending: false });

        if (error) throw error;

        todosLosProductos = productos.map(prod => {
            const opiniones = prod.opiniones || [];
            const total = opiniones.length;
            const suma = opiniones.reduce((acc, curr) => acc + curr.puntuacion, 0);
            prod.ratingPromedio = total ? (suma / total).toFixed(1) : null;
            return prod;
        });

    } catch (err) {
        console.error(err);
        // Fallback
        try {
            let { data: simple } = await supabaseClient.from('productos').select('*').eq('activo', true);
            if(simple) todosLosProductos = simple;
        } catch(e){}
    }

    renderizarMenu(todosLosProductos);
}

// 2. RENDERIZAR
function renderizarMenu(lista) {
    const contenedor = document.getElementById('menu-grid');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (!lista || lista.length === 0) {
        contenedor.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; color:#666;">Sin resultados 🍸</div>';
        return;
    }

    const html = lista.map((item, index) => {
        const claseAgotado = item.estado === 'agotado' ? 'agotado' : '';
        const img = item.imagen_url || 'https://via.placeholder.com/300';
        const badge = item.destacado ? `<span class="badge-destacado">TOP</span>` : '';
        const rating = item.ratingPromedio ? `★ ${item.ratingPromedio}` : 'Nuevo';
        
        return `
            <div class="card ${claseAgotado}" onclick="abrirDetalle(${item.id})">
                ${badge}
                <div class="img-box"><img src="${img}" loading="lazy" alt="${item.nombre}"></div>
                <div class="info">
                    <h3>${item.nombre}</h3>
                    <p class="short-desc">${item.descripcion || ''}</p>
                    <div class="card-footer">
                         <span class="price">$${item.precio}</span>
                         <span class="rating-pill">${rating}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    contenedor.innerHTML = html;
}

// 3. DETALLE
function abrirDetalle(id) {
    productoActual = todosLosProductos.find(p => p.id === id);
    if (!productoActual) return;

    document.getElementById('det-img').src = productoActual.imagen_url || '';
    document.getElementById('det-titulo').textContent = productoActual.nombre;
    document.getElementById('det-desc').textContent = productoActual.descripcion;
    document.getElementById('det-precio').textContent = `$${productoActual.precio}`;
    document.getElementById('det-rating-big').textContent = productoActual.ratingPromedio ? `★ ${productoActual.ratingPromedio}` : '★ --';

    const box = document.getElementById('box-curiosidad');
    if (productoActual.curiosidad && productoActual.curiosidad.length > 5) {
        box.style.display = "block";
        document.getElementById('det-curiosidad').textContent = productoActual.curiosidad;
    } else {
        box.style.display = "none";
    }
    
    const modal = document.getElementById('modal-detalle');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function cerrarDetalle() {
    const modal = document.getElementById('modal-detalle');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}

// 4. OPINIONES
function abrirOpinionDesdeDetalle() {
    cerrarDetalle();
    const modal = document.getElementById('modal-opinion');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    puntuacion = 0;
    actualizarEstrellas();
}

function cerrarModalOpiniones() {
    const modal = document.getElementById('modal-opinion');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}

function actualizarEstrellas() {
    document.querySelectorAll('#stars-container span').forEach(s => {
        const val = parseInt(s.dataset.val);
        s.style.color = val <= puntuacion ? 'var(--gold)' : '#444';
    });
}
document.getElementById('stars-container').addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
        puntuacion = parseInt(e.target.dataset.val);
        actualizarEstrellas();
    }
});

async function enviarOpinion() {
    if (puntuacion === 0) { showToast("Selecciona estrellas", "error"); return; }
    
    const btn = document.getElementById('btn-enviar-opinion');
    btn.textContent = "Enviando..."; btn.disabled = true;

    const { error } = await supabaseClient.from('opiniones').insert([{
        producto_id: productoActual.id,
        cliente_nombre: document.getElementById('cliente-nombre').value || "Anónimo",
        comentario: document.getElementById('cliente-comentario').value,
        puntuacion: puntuacion
    }]);

    if (!error) {
        showToast("¡Gracias!", "success");
        cerrarModalOpiniones();
        cargarMenu(); 
    } else {
        showToast("Error al enviar", "error");
    }
    btn.textContent = "ENVIAR"; btn.disabled = false;
}

// 5. FILTROS
function filtrar(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.value = '';
    
    const lista = cat === 'todos' ? todosLosProductos : todosLosProductos.filter(p => p.categoria === cat);
    renderizarMenu(lista);
}

document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const term = e.target.value.toLowerCase();
    searchTimeout = setTimeout(() => {
        const lista = todosLosProductos.filter(p => p.nombre.toLowerCase().includes(term));
        renderizarMenu(lista);
    }, 300);
});

document.addEventListener('DOMContentLoaded', cargarMenu);