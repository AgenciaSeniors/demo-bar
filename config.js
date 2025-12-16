const CONFIG = {
    SUPABASE_URL: 'https://qspwtmfmolvqlzsbwlzv.supabase.co',
    SUPABASE_KEY: 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU',
    // Usamos el modelo más estable para evitar errores 404
    GEMINI_KEY: 'AIzaSyDDqPRUFilvcpVlFlMnxkYYju4RnVAFGv4' 
};

// Cliente Global de Supabase
//para obtener el SUPABASE_KEY voy a https://supabase.com/dashboard/project/mvtatdvpsjynvayhhksc/settings/api-keys?showConnect=true&connectTab=frameworks 
//entonce NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_XtV2kYHISXME2K-STuHmdw_UUGTZyvS
//SUPABASE_URL https://supabase.com/dashboard/project/mvtatdvpsjynvayhhksc/settings/api ====== Project URL
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);


