const CLAVE_SECRETA = "1234"; 
if (prompt("🔒 Clave:") !== CLAVE_SECRETA) { window.location.href = "index.html"; }

// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://qspwtmfmolvqlzsbwlzv.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. CARGAR LISTA
async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    lista.innerHTML = 'Cargando...';

    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: false });

    if (error) { alert("Error al cargar"); return; }
    lista.innerHTML = '';

    productos.forEach(item => {
        const esAgotado = item.estado === 'agotado';
        const badge = esAgotado ? '<span class="status-agotado">AGOTADO</span>' : '<span class="status-disponible">OK</span>';
        const favClass = item.destacado ? 'is-fav' : '';
        
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <img src="${item.imagen_url}" alt="img">
                <div class="item-details">
                    <strong>${item.nombre}</strong> ($${item.precio})
                    ${badge} ${item.destacado ? '🌟' : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-sm btn-star ${favClass}" onclick="toggleDestacado(${item.id}, ${item.destacado})">★</button>
                <button class="btn-sm btn-toggle" onclick="toggleEstado(${item.id}, '${item.estado}')">I/O</button>
                <button class="btn-sm btn-delete" onclick="eliminarProducto(${item.id})">X</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// 2. GENERAR CURIOSIDAD CON IA (GOOGLE GEMINI)
async function generarCuriosidad() {
    const nombre = document.getElementById('nombre').value;
    const campo = document.getElementById('curiosidad');
    const loader = document.getElementById('loader-ia');
    const btn = document.getElementById('btn-ia');

    if (!nombre) { alert("Escribe primero el nombre del producto."); return; }

    btn.disabled = true; loader.style.display = "block"; campo.value = "";

    // --- ¡PEGA TU CLAVE DE GOOGLE AQUÍ ABAJO! ---
    const API_KEY = 'AIzaSyBNjg0xD2OVdBZ6EOe3bhSic73ilMrfGQI'; 
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    const prompt = `Escribe un dato curioso histórico o cultural muy breve (máximo 20 palabras) sobre la comida o bebida: "${nombre}". No uses introducciones, ve directo al dato.`;

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        campo.value = data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error(e);
        alert("Error con la IA. Revisa tu API Key.");
    } finally {
        loader.style.display = "none"; btn.disabled = false;
    }
}

// 3. GUARDAR PRODUCTO
document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = "Subiendo..."; btn.disabled = true;

    try {
        const nombre = document.getElementById('nombre').value;
        const precio = document.getElementById('precio').value;
        const categoria = document.getElementById('categoria').value;
        const desc = document.getElementById('descripcion').value;
        const curiosidad = document.getElementById('curiosidad').value;
        const destacado = document.getElementById('destacado').checked;
        const fileInput = document.getElementById('imagen-file');

        if (fileInput.files.length === 0) throw new Error("Falta la imagen");
        const archivo = fileInput.files[0];
        const nombreArchivo = Date.now() + '_' + archivo.name.replace(/\s/g, '');

        // Subir Imagen
        const { error: upErr } = await supabaseClient.storage.from('imagenes').upload(nombreArchivo, archivo);
        if (upErr) throw upErr;

        const { data: urlData } = supabaseClient.storage.from('imagenes').getPublicUrl(nombreArchivo);

        // Guardar Datos
        const { error: dbErr } = await supabaseClient.from('productos').insert([{
            nombre, precio, categoria, descripcion, curiosidad, destacado,
            imagen_url: urlData.publicUrl, estado: 'disponible', activo: true
        }]);

        if (dbErr) throw dbErr;
        
        alert("¡Producto Guardado!");
        document.getElementById('form-producto').reset();
        cargarAdmin();

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.textContent = "GUARDAR"; btn.disabled = false;
    }
});

// 4. ACCIONES RAPIDAS
async function toggleDestacado(id, val) {
    await supabaseClient.from('productos').update({ destacado: !val }).eq('id', id);
    cargarAdmin();
}
async function toggleEstado(id, estado) {
    const nuevo = estado === 'disponible' ? 'agotado' : 'disponible';
    await supabaseClient.from('productos').update({ estado: nuevo }).eq('id', id);
    cargarAdmin();
}
async function eliminarProducto(id) {
    if(confirm("¿Eliminar?")) {
        await supabaseClient.from('productos').update({ activo: false }).eq('id', id);
        cargarAdmin();
    }
}

cargarAdmin();