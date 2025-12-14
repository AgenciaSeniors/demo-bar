// --- admin.js ---
// NOTA: Configuración ya cargada en config.js

// 1. SEGURIDAD
async function checkAuth() {
    // Verificamos si config.js cargó bien
    if (typeof supabaseClient === 'undefined') {
        alert("Error crítico: config.js no cargó.");
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
    } else {
        cargarAdmin();
    }
}

async function cerrarSesion() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
}

// 2. CARGAR INVENTARIO
async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    if (lista) lista.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">⟳ Cargando inventario...</div>';

    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: false });

    if (error) { alert("Error cargando productos: " + error.message); return; }
    
    const html = productos.map(item => {
        const esAgotado = item.estado === 'agotado';
        const statusClass = esAgotado ? 'status-bad' : 'status-ok';
        const statusText = esAgotado ? 'AGOTADO' : 'ACTIVO';
        const favColor = item.destacado ? 'var(--gold)' : '#444';
        const img = item.imagen_url || 'https://via.placeholder.com/60';

        return `
            <div class="inventory-item">
                <img src="${img}" class="item-thumb" alt="img">
                <div class="item-meta">
                    <div class="item-title">${item.nombre} ${item.destacado ? '🌟' : ''}</div>
                    <div class="item-price">$${item.precio}</div>
                    <span class="item-status ${statusClass}">${statusText}</span>
                </div>
                <div class="action-btn-group">
                    <button class="icon-btn" style="color:${favColor}; background:#222;" onclick="toggleDestacado(${item.id}, ${item.destacado})"><span class="material-icons">star</span></button>
                    <button class="icon-btn btn-edit" onclick="toggleEstado(${item.id}, '${item.estado}')"><span class="material-icons">power_settings_new</span></button>
                    <button class="icon-btn btn-del" onclick="eliminarProducto(${item.id})"><span class="material-icons">delete</span></button>
                </div>
            </div>
        `;
    }).join('');

    if (lista) lista.innerHTML = html || '<p style="text-align:center;">Inventario vacío.</p>';
}

// 3. IA GEMINI (USANDO MODELO ESTABLE)
async function generarCuriosidad() {
    const nombre = document.getElementById('nombre').value;
    const campo = document.getElementById('curiosidad');
    const loader = document.getElementById('loader-ia');
    const btn = document.getElementById('btn-ia');

    if (!nombre) { alert("Escribe el nombre primero."); return; }

    btn.disabled = true; loader.style.display = "inline-block"; campo.value = "";

    const API_KEY = CONFIG.GEMINI_KEY; 
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    const prompt = `Escribe un dato curioso histórico o cultural breve (máximo 25 palabras) sobre: "${nombre}". Tono interesante. Sin introducciones.`;

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            campo.value = data.candidates[0].content.parts[0].text.trim();
        } else {
            campo.value = "No se pudo generar. Intenta de nuevo.";
        }
    } catch (e) {
        console.error(e);
        campo.value = "Error de conexión con IA.";
    } finally {
        loader.style.display = "none"; btn.disabled = false;
    }
}

// 4. GUARDAR
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

            const { error: upErr } = await supabaseClient.storage.from('imagenes').upload(nombreArchivo, archivo);
            if (upErr) throw upErr;

            const { data: urlData } = supabaseClient.storage.from('imagenes').getPublicUrl(nombreArchivo);

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