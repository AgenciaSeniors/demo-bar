// (Configuración viene de config.js)

async function checkAuth() {
    if (typeof supabaseClient === 'undefined') { alert("Config error"); return; }
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) window.location.href = "login.html";
    else cargarAdmin();
}

async function cerrarSesion() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
}

// En admin.js: Reemplaza la función cargarAdmin por esta

async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    if (lista) lista.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">⟳ Cargando...</div>';

    // Traemos los productos activos
    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true) // Solo trae los que NO han sido eliminados (papelera)
        .order('id', { ascending: false });

    if (error) { alert("Error: " + error.message); return; }
    
    if (!productos || productos.length === 0) {
        if (lista) lista.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">El inventario está vacío.<br><small>Si borraste productos por error, contacta al soporte de base de datos.</small></p>';
        return;
    }

    const html = productos.map(item => {
        // Lógica de Estado
        const esAgotado = item.estado === 'agotado';
        
        // Textos y Colores solicitados
        const statusText = esAgotado ? 'AGOTADO' : 'DISPONIBLE'; // Ahora dice DISPONIBLE
        const statusClass = esAgotado ? 'status-bad' : 'status-ok'; // Rojo o Verde
        
        // Icono del botón de estado (cambia visualmente para indicar la acción)
        const iconState = esAgotado ? 'toggle_off' : 'toggle_on';
        const colorStateBtn = esAgotado ? '#666' : 'var(--green-success)';

        const favColor = item.destacado ? 'var(--gold)' : '#444';
        const img = item.imagen_url || 'https://via.placeholder.com/60';

        return `
            <div class="inventory-item">
                <img src="${img}" class="item-thumb" alt="img">
                
                <div class="item-meta">
                    <span class="item-title">
                        ${item.nombre} ${item.destacado ? '🌟' : ''}
                    </span>
                    <span class="item-price">$${item.precio}</span>
                    
                    <span class="item-status ${statusClass}">${statusText}</span>
                </div>

                <div class="action-btn-group">
                    <button class="icon-btn" style="color:${favColor}" onclick="toggleDestacado(${item.id}, ${item.destacado})" title="Destacar en carta">
                        <span class="material-icons">star</span>
                    </button>

                    <button class="icon-btn" style="color:${colorStateBtn}" onclick="toggleEstado(${item.id}, '${item.estado}')" title="Cambiar Disponibilidad">
                        <span class="material-icons">${iconState}</span>
                    </button>

                    <button class="icon-btn btn-del" onclick="eliminarProducto(${item.id})" title="Eliminar definitivamente">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (lista) lista.innerHTML = html;
}


// Copia el resto de tu admin.js aquí (generarCuriosidad, form submit, etc.)
// Solo asegúrate de que generarCuriosidad use la API KEY desde CONFIG.GEMINI_KEY
// y el modelo 'gemini-1.5-flash-001'
// Y al final: document.addEventListener('DOMContentLoaded', checkAuth);

// --- PEGA AQUÍ EL RESTO DE TU ADMIN.JS (Funciones lógicas) ---
// (Si necesitas el código completo de esas funciones dímelo, pero con lo de arriba corriges el diseño)

// 3. IA GEMINI (CORREGIDA)
async function generarCuriosidad() {
    const nombre = document.getElementById('nombre').value;
    const campo = document.getElementById('curiosidad');
    const loader = document.getElementById('loader-ia');
    const btn = document.getElementById('btn-ia');

    if (!nombre) { alert("Escribe el nombre primero."); return; }

    btn.disabled = true; loader.style.display = "inline-block"; campo.value = "";

    const API_KEY = CONFIG.GEMINI_KEY; 
    // Usamos modelo más compatible
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${API_KEY}`;
    const prompt = `Dato curioso corto sobre: "${nombre}"`;

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        
        if (data.candidates && data.candidates[0].content) {
            campo.value = data.candidates[0].content.parts[0].text;
        } else {
            // Fallback
            generarCuriosidadLegacy(nombre);
        }
    } catch (e) {
        generarCuriosidadLegacy(nombre);
    } finally {
        loader.style.display = "none"; btn.disabled = false;
    }
}

async function generarCuriosidadLegacy(nombre) {
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.GEMINI_KEY}`;
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Dato curioso sobre ${nombre}` }] }] })
        });
        const data = await res.json();
        if(data.candidates) document.getElementById('curiosidad').value = data.candidates[0].content.parts[0].text;
    } catch(e){}
}

const form = document.getElementById('form-producto');
if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = "Guardando..."; btn.disabled = true;

        try {
            const fileInput = document.getElementById('imagen-file');
            if (fileInput.files.length === 0) throw new Error("Falta imagen");
            const archivo = fileInput.files[0];
            const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${archivo.name.split('.').pop()}`;

            const { error: upErr } = await supabaseClient.storage.from('imagenes').upload(nombreArchivo, archivo);
            if (upErr) throw upErr;

            const { data: urlData } = supabaseClient.storage.from('imagenes').getPublicUrl(nombreArchivo);

            const { error: dbErr } = await supabaseClient.from('productos').insert([{
                nombre: document.getElementById('nombre').value,
                precio: document.getElementById('precio').value,
                categoria: document.getElementById('categoria').value,
                descripcion: document.getElementById('descripcion').value,
                curiosidad: document.getElementById('curiosidad').value,
                destacado: document.getElementById('destacado').checked,
                imagen_url: urlData.publicUrl, estado: 'disponible', activo: true
            }]);

            if (dbErr) throw dbErr;
            alert("¡Guardado!");
            form.reset();
            cargarAdmin();
        } catch (error) { alert(error.message); } 
        finally { btn.textContent = "GUARDAR PRODUCTO"; btn.disabled = false; }
    });
}

async function toggleDestacado(id, val) { await supabaseClient.from('productos').update({ destacado: !val }).eq('id', id); cargarAdmin(); }
async function toggleEstado(id, estado) { const nuevo = estado === 'disponible' ? 'agotado' : 'disponible'; await supabaseClient.from('productos').update({ estado: nuevo }).eq('id', id); cargarAdmin(); }
async function eliminarProducto(id) { if(confirm("¿Eliminar?")) { await supabaseClient.from('productos').update({ activo: false }).eq('id', id); cargarAdmin(); } }

document.addEventListener('DOMContentLoaded', checkAuth);

// 3. IA GEMINI (CORREGIDA: USANDO MODELO ESPECÍFICO)
async function generarCuriosidad() {
    const nombre = document.getElementById('nombre').value;
    const campo = document.getElementById('curiosidad');
    const loader = document.getElementById('loader-ia');
    const btn = document.getElementById('btn-ia');

    if (!nombre) { alert("Escribe el nombre primero."); return; }

    btn.disabled = true; loader.style.display = "inline-block"; campo.value = "";

    const API_KEY = CONFIG.GEMINI_KEY; 
    // Usamos modelo más compatible
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${API_KEY}`;
    const prompt = `Dato curioso corto sobre: "${nombre}"`;

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        
        if (data.candidates && data.candidates[0].content) {
            campo.value = data.candidates[0].content.parts[0].text;
        } else {
            // Fallback
            generarCuriosidadLegacy(nombre);
        }
    } catch (e) {
        generarCuriosidadLegacy(nombre);
    } finally {
        loader.style.display = "none"; btn.disabled = false;
    }
}

async function generarCuriosidadLegacy(nombre) {
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.GEMINI_KEY}`;
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Dato curioso sobre ${nombre}` }] }] })
        });
        const data = await res.json();
        if(data.candidates) document.getElementById('curiosidad').value = data.candidates[0].content.parts[0].text;
    } catch(e){}
}

const form = document.getElementById('form-producto');
if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = "Guardando..."; btn.disabled = true;

        try {
            const fileInput = document.getElementById('imagen-file');
            if (fileInput.files.length === 0) throw new Error("Falta imagen");
            const archivo = fileInput.files[0];
            const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${archivo.name.split('.').pop()}`;

            const { error: upErr } = await supabaseClient.storage.from('imagenes').upload(nombreArchivo, archivo);
            if (upErr) throw upErr;

            const { data: urlData } = supabaseClient.storage.from('imagenes').getPublicUrl(nombreArchivo);

            const { error: dbErr } = await supabaseClient.from('productos').insert([{
                nombre: document.getElementById('nombre').value,
                precio: document.getElementById('precio').value,
                categoria: document.getElementById('categoria').value,
                descripcion: document.getElementById('descripcion').value,
                curiosidad: document.getElementById('curiosidad').value,
                destacado: document.getElementById('destacado').checked,
                imagen_url: urlData.publicUrl, estado: 'disponible', activo: true
            }]);

            if (dbErr) throw dbErr;
            alert("¡Guardado!");
            form.reset();
            cargarAdmin();
        } catch (error) { alert(error.message); } 
        finally { btn.textContent = "GUARDAR PRODUCTO"; btn.disabled = false; }
    });
}

// 4. GUARDAR PRODUCTO
const form = document.getElementById('form-producto');
if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = "Guardando..."; btn.disabled = true;

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
            const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

            // Subir imagen
            const { error: upErr } = await supabaseClient.storage.from('imagenes').upload(nombreArchivo, archivo);
            if (upErr) throw upErr;

            // Obtener URL
            const { data: urlData } = supabaseClient.storage.from('imagenes').getPublicUrl(nombreArchivo);

            // Guardar en BD
            const { error: dbErr } = await supabaseClient.from('productos').insert([{
                nombre, precio, categoria, descripcion, curiosidad, destacado,
                imagen_url: urlData.publicUrl, estado: 'disponible', activo: true
            }]);

            if (dbErr) throw dbErr;
            
            alert("¡Producto Guardado!");
            form.reset();
            cargarAdmin();

        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            btn.textContent = originalText; btn.disabled = false;
        }
    });
}

// 5. ACCIONES
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

document.addEventListener('DOMContentLoaded', checkAuth);