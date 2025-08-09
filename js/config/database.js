// Configuração do Supabase
const SUPABASE_URL = 'https://eiguglyibkjvzedavune.supabase.co'; // Vamos configurar depois
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZ3VnbHlpYmtqdnplZGF2dW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODQzOTQsImV4cCI6MjA3MDI2MDM5NH0.FLlsGaPEMw0MHVfvlzedqzgUovc4aOMttTpjSqfHj_0'; // Vamos configurar depois

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Database functions usando Supabase
const Database = {
    // Empresas
    async getEmpresas() {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('ativo', true)
            .order('nome');
        
        if (error) throw error;
        return data || [];
    },

    async getEmpresaById(id) {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    async createEmpresa(empresa) {
        const { data, error } = await supabase
            .from('empresas')
            .insert([empresa])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async updateEmpresa(id, empresa) {
        const { data, error } = await supabase
            .from('empresas')
            .update({ ...empresa, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async deleteEmpresa(id) {
        const { error } = await supabase
            .from('empresas')
            .update({ ativo: false })
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    // Controle Mensal
    async getControleByMes(mesAno) {
        const { data, error } = await supabase
            .from('controle_mensal')
            .select('*')
            .eq('mes_ano', mesAno);
        
        if (error) throw error;
        return data || [];
    },

    async getControleByEmpresa(empresaId, mesAno) {
        const { data, error } = await supabase
            .from('controle_mensal')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('mes_ano', mesAno)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async createControle(controle) {
        const { data, error } = await supabase
            .from('controle_mensal')
            .insert([controle])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async updateControle(id, controle) {
        const { data, error } = await supabase
            .from('controle_mensal')
            .update({ ...controle, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Preços
    async getPrecos() {
        const { data, error } = await supabase
            .from('precos_marmitas')
            .select('*')
            .eq('ativo', true);
        
        if (error) throw error;
        
        // Converter para objeto { P: 8.00, M: 10.00, G: 12.00 }
        const precos = {};
        data.forEach(item => {
            precos[item.tamanho] = parseFloat(item.preco);
        });
        
        return precos;
    },

    async updatePrecos(precos) {
        const updates = [];
        
        for (const [tamanho, preco] of Object.entries(precos)) {
            updates.push(
                supabase
                    .from('precos_marmitas')
                    .update({ preco })
                    .eq('tamanho', tamanho)
            );
        }
        
        await Promise.all(updates);
        return precos;
    }
};