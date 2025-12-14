// --- 1. CONFIGURACIÓN ---
const SUPABASE_URL = 'https://qspwtmfmolvqlzsbwlzv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU';

let todosLosProductos = [];

// --- 2. CARGAR PRODUCTOS ---
async function cargarMenu() {
    // Pedimos a la base de datos solo los productos activos (no los eliminados)
    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true) 
        .order('id', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    todosLosProductos = productos;
    renderizarMenu(todosLosProductos);
}

// --- 3. PINTAR EN PANTALLA ---
function renderizarMenu(lista) {
    const contenedor = document.getElementById('menu-grid');
    contenedor.innerHTML = '';

    lista.forEach(item => {
        // Verificar si está agotado para añadir la clase CSS
        const claseAgotado = item.estado === 'agotado' ? 'agotado' : '';
        
        const html = `
            <div class="card ${claseAgotado}">
                <div class="img-box">
                    <img src="${item.imagen_url || 'https://via.placeholder.com/150'}" alt="${item.nombre}">
                </div>
                <div class="info">
                    <div class="row">
                        <h3>${item.nombre}</h3>
                        <span class="price">$${item.precio}</span>
                    </div>
                    <p class="short-desc">${item.descripcion || ''}</p>
                </div>
            </div>
        `;
        contenedor.innerHTML += html;
    });
}

// --- 4. FILTROS ---
function filtrar(categoria, boton) {
    // Cambiar botón activo
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    boton.classList.add('active');

    if (categoria === 'todos') {
        renderizarMenu(todosLosProductos);
    } else {
        const filtrados = todosLosProductos.filter(p => p.categoria === categoria);
        renderizarMenu(filtrados);
    }
}

// Iniciar al cargar
document.addEventListener('DOMContentLoaded', cargarMenu);