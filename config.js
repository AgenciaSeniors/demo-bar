// CONFIGURACIÓN CENTRAL
// ⚠️ En un entorno real de producción, estas claves deberían protegerse mejor.
const CONFIG = {
    SUPABASE_URL: 'https://qspwtmfmolvqlzsbwlzv.supabase.co', // Tu URL de Supabase
    SUPABASE_KEY: 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU', // Tu Key Pública
    // Tu nueva clave de Gemini
    GEMINI_KEY: 'AIzaSyCXWHwntRNF_IcZAjPPJyARZp_uAhn8QL8' 
};

// Inicializar cliente Supabase globalmente
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);