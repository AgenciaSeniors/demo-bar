// --- SEGURIDAD ---
const CLAVE_SECRETA = "1234"; 
const entrada = prompt("🔒 Área restringida. Ingresa la contraseña de Administrador:");
if (entrada !== CLAVE_SECRETA) { alert("⛔ Contraseña incorrecta."); window.location.href = "index.html"; }

// --- CONFIG ---
const SUPABASE_URL = 'https://qspwtmfmolvqlzsbwlzv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CARGAR LISTA ---
async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    lista.innerHTML = 'Actualizando...';

    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: false });

    if (error) { alert('Error: ' + error.message); return; }

    lista.innerHTML = '';
    productos.forEach(item => {
        const esAgotado = item.estado === 'agotado';
        const estadoBadge = esAgotado 
            ? '<span class="status-text status-agotado">AGOTADO</span>' 
            : '<span class="status-text status-disponible">DISPONIBLE</span>';
        
        const btnTexto = esAgotado ? 'Activar' : 'Agotar';
        const claseFav = item.destacado ? 'is-fav' : ''; // Para el color dorado

        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <img src="${item.imagen_url}" alt="img">
                <div class="item-details">
                    <strong>${item.nombre}</strong> ($${item.precio})
                    ${estadoBadge}
                    ${item.destacado ? '🌟' : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-sm btn-star ${claseFav}" onclick="toggleDestacado(${item.id}, ${item.destacado})">★</button>
                <button class="btn-sm btn-toggle" onclick="toggleEstado(${item.id}, '${item.estado}')">${btnTexto}</button>
                <button class="btn-sm btn-delete" onclick="eliminarProducto(${item.id})">X</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// --- CREAR PRODUCTO ---
document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = "Guardando..."; btn.disabled = true;

    try {
        const nombre = document.getElementById('nombre').value;
        const precio = document.getElementById('precio').value;
        const categoria = document.getElementById('categoria').value;
        const desc = document.getElementById('descripcion').value;
        const destacado = document.getElementById('destacado').checked; // Valor del checkbox
        const fileInput = document.getElementById('imagen-file');

        if (fileInput.files.length === 0) throw new Error("Falta imagen");
        const archivo = fileInput.files[0];
        const nombreArchivo = Date.now() + '_' + archivo.name.replace(/\s/g, '');

        const { error: upErr } = await supabaseClient.storage.from('imagenes').upload(nombreArchivo, archivo);
        if (upErr) throw upErr;

        const { data: urlData } = supabaseClient.storage.from('imagenes').getPublicUrl(nombreArchivo);

        const { error: dbErr } = await supabaseClient.from('productos').insert([{
            nombre: nombre, precio: precio, categoria: categoria,
            imagen_url: urlData.publicUrl, descripcion: desc, 
            estado: 'disponible', activo: true,
            destacado: destacado // Guardamos si es favorito
        }]);

        if (dbErr) throw dbErr;

        alert("¡Guardado!");
        document.getElementById('form-producto').reset();
        cargarAdmin();

    } catch (err) { alert("Error: " + err.message); } 
    finally { btn.textContent = "GUARDAR EN EL MENÚ"; btn.disabled = false; }
});

// --- ACCIONES ---
async function toggleDestacado(id, valorActual) {
    await supabaseClient.from('productos').update({ destacado: !valorActual }).eq('id', id);
    cargarAdmin();
}

async function toggleEstado(id, estadoActual) {
    const nuevo = estadoActual === 'disponible' ? 'agotado' : 'disponible';
    await supabaseClient.from('productos').update({ estado: nuevo }).eq('id', id);
    cargarAdmin();
}

async function eliminarProducto(id) {
    if(!confirm("¿Eliminar?")) return;
    await supabaseClient.from('productos').update({ activo: false }).eq('id', id);
    cargarAdmin();
}

cargarAdmin();