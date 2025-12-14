// --- CONFIGURACIÓN ---
const SUPABASE_URL = 'https://qspwtmfmolvqlzsbwlzv.supabase.co'; // <--- TU URL
const SUPABASE_KEY = 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU'; // <--- TU KEY PÚBLICA (sb_publishable)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let todosLosProductos = [];
let productoActual = null;
let puntuacion = 0;

// 1. CARGAR MENÚ
async function cargarMenu() {
    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('destacado', { ascending: false })
        .order('id', { ascending: false });

    if (error) { console.error(error); return; }
    todosLosProductos = productos;
    renderizarMenu(todosLosProductos);
}

// 2. RENDERIZAR
function renderizarMenu(lista) {
    const contenedor = document.getElementById('menu-grid');
    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; width:100%">No hay resultados 😢</p>';
        return;
    }

    lista.forEach(item => {
        const claseAgotado = item.estado === 'agotado' ? 'agotado' : '';
        const img = item.imagen_url || 'https://via.placeholder.com/300';
        const badge = item.destacado ? `<span class="badge-destacado">★ TOP</span>` : '';

        const html = `
            <div class="card ${claseAgotado}" onclick="abrirDetalle(${item.id})">
                ${badge}
                <div class="img-box"><img src="${img}" loading="lazy"></div>
                <div class="info">
                    <h3>${item.nombre}</h3>
                    <div style="display:flex; justify-content:space-between;">
                         <span class="price">$${item.precio}</span>
                         <small style="color:#777">👆 Ver más</small>
                    </div>
                </div>
            </div>
        `;
        contenedor.innerHTML += html;
    });
}

// 3. DETALLE & CURIOSIDAD
function abrirDetalle(id) {
    productoActual = todosLosProductos.find(p => p.id === id);
    if (!productoActual) return;

    document.getElementById('det-img').src = productoActual.imagen_url;
    document.getElementById('det-titulo').textContent = productoActual.nombre;
    document.getElementById('det-desc').textContent = productoActual.descripcion;
    document.getElementById('det-precio').textContent = `$${productoActual.precio}`;
    document.getElementById('det-curiosidad').textContent = productoActual.curiosidad || "¡Delicioso y preparado al momento!";
    
    document.getElementById('modal-detalle').style.display = 'flex';
}
function cerrarDetalle() { document.getElementById('modal-detalle').style.display = 'none'; }

// 4. OPINIONES
function abrirOpinionDesdeDetalle() {
    cerrarDetalle();
    document.getElementById('modal-opinion').style.display = 'flex';
    puntuacion = 0;
    actualizarEstrellas();
}
function cerrarModalOpiniones() { document.getElementById('modal-opinion').style.display = 'none'; }

document.querySelectorAll('.stars span').forEach(s => {
    s.addEventListener('click', () => {
        puntuacion = parseInt(s.dataset.val);
        actualizarEstrellas();
    });
});
function actualizarEstrellas() {
    document.querySelectorAll('.stars span').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.val) <= puntuacion);
    });
}

async function enviarOpinion() {
    if (puntuacion === 0) { alert("¡Puntúa con estrellas!"); return; }
    const nombre = document.getElementById('cliente-nombre').value || "Anónimo";
    const comentario = document.getElementById('cliente-comentario').value;

    const { error } = await supabaseClient.from('opiniones').insert([{
        producto_id: productoActual.id,
        cliente_nombre: nombre,
        comentario: comentario,
        puntuacion: puntuacion
    }]);

    if (!error) { alert("¡Gracias!"); cerrarModalOpiniones(); }
    else { alert("Error al enviar"); }
}

// 5. FILTROS & BUSCADOR
function filtrar(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('search-input').value = '';
    
    const lista = cat === 'todos' ? todosLosProductos : todosLosProductos.filter(p => p.categoria === cat);
    renderizarMenu(lista);
}

document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const lista = todosLosProductos.filter(p => p.nombre.toLowerCase().includes(term));
    renderizarMenu(lista);
});

document.addEventListener('DOMContentLoaded', cargarMenu);