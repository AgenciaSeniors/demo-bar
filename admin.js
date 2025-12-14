// --- 1. CONFIGURACIÓN (MISMA QUE EN SCRIPT.JS) ---
const SUPABASE_URL = 'TU_URL_DE_SUPABASE';
const SUPABASE_KEY = 'TU_KEY_ANONIMA';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. CARGAR LISTA PARA EDITAR ---
async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    lista.innerHTML = 'Cargando inventario...';

    let { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true) // Solo mostrar los que no has borrado
        .order('id', { ascending: false });

    if (error) { alert('Error cargando'); return; }

    lista.innerHTML = '';

    productos.forEach(item => {
        // Definir color y texto según estado
        const esAgotado = item.estado === 'agotado';
        const estadoBadge = esAgotado 
            ? '<span class="status-text status-agotado">AGOTADO</span>' 
            : '<span class="status-text status-disponible">DISPONIBLE</span>';
        
        const btnTexto = esAgotado ? 'Marcar Disponible' : 'Marcar Agotado';

        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <img src="${item.imagen_url}" alt="img">
                <div class="item-details">
                    <strong>${item.nombre}</strong> ($${item.precio})
                    ${estadoBadge}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-sm btn-toggle" onclick="toggleEstado(${item.id}, '${item.estado}')">
                    ${btnTexto}
                </button>
                <button class="btn-sm btn-delete" onclick="eliminarProducto(${item.id})">
                    Eliminar
                </button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// --- 3. AÑADIR PRODUCTO NUEVO ---
document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value;
    const categoria = document.getElementById('categoria').value;
    const imagen = document.getElementById('imagen').value;
    const desc = document.getElementById('descripcion').value;

    const { error } = await supabase
        .from('productos')
        .insert([{
            nombre: nombre,
            precio: precio,
            categoria: categoria,
            imagen_url: imagen,
            descripcion: desc,
            estado: 'disponible'
        }]);

    if (error) {
        alert('Error al guardar: ' + error.message);
    } else {
        alert('¡Producto Agregado!');
        document.getElementById('form-producto').reset();
        cargarAdmin(); // Recargar la lista
    }
});

// --- 4. CAMBIAR ESTADO (AGOTADO/DISPONIBLE) ---
async function toggleEstado(id, estadoActual) {
    const nuevoEstado = estadoActual === 'disponible' ? 'agotado' : 'disponible';

    const { error } = await supabase
        .from('productos')
        .update({ estado: nuevoEstado })
        .eq('id', id);

    if (!error) cargarAdmin(); // Refrescar vista
}

// --- 5. ELIMINAR PRODUCTO (SOFT DELETE) ---
async function eliminarProducto(id) {
    if(!confirm("¿Seguro que quieres eliminar este plato del menú?")) return;

    // No borramos el dato, solo ponemos activo=false por seguridad
    const { error } = await supabase
        .from('productos')
        .update({ activo: false })
        .eq('id', id);

    if (!error) cargarAdmin();
}

// Iniciar
cargarAdmin();