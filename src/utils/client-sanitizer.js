export const sanitizeText = (text) => {
  if (typeof text !== 'string') return text || '';
  
  let t = text
    .replace(/\binvestir\b/gi, 'aplicar recursos')
    .replace(/\binvestimento(s)?\b/gi, 'planejamento')
    .replace(/\brentabilidade\b/gi, 'benefício')
    .replace(/\bpoupança\b/gi, 'guardar dinheiro')
    .replace(/\bCDB\b/gi, 'alternativa fora da proposta atual')
    .replace(/\brenda fixa\b/gi, 'alternativa fora da proposta atual')
    .replace(/\bfundo(s)?\b/gi, 'alternativa fora da proposta atual')
    .replace(/\bnecessidade imediata\b/gi, 'finalidade real')
    .replace(/\bdeseja (o|um|uma|contratar|adquirir|fazer)\b/gi, 'pode se interessar por')
    .replace(/\bpretende (contratar|fazer|adquirir|pegar)\b/gi, 'pode avaliar')
    .replace(/\brentável\b/gi, 'vantajoso')
    .replace(/\brendimento(s)?\b/gi, 'resultado')
    .replace(/\b(venda fechada|produto contratado|contratação realizada|cliente aceitou|pode contratar)\b/gi, 'próximo passo sugerido')
    .replace(/\bjuross?\b/gi, 'Juros')
    .replace(/\bbuildar\b/gi, 'fortalecer')
    .replace(/R\$\s*X\b/gi, 'uma parcela que caiba no seu mês')
    .replace(/\bvalor\s+X\b/gi, 'valor que caiba no seu mês')
    .replace(/\bparcela\s+X\b/gi, 'parcela que caiba no seu mês')
    .replace(/\bcliente deseja\b/gi, 'há oportunidade de ofertar para o cliente')
    .replace(/\bcliente busca\b/gi, 'há oportunidade de apresentar ao cliente')
    .replace(/\bcliente quer\b/gi, 'o banco pode ofertar ao cliente')
    .replace(/\bcliente precisa de\b/gi, 'existe a possibilidade de apresentar')
    .replace(/\bcliente solicitou\b/gi, 'o banco tem disponível para ofertar')
    .replace(/\bcliente veio interessado\b/gi, 'há uma oportunidade comercial para abordar')
    .replace(/\bnecessidade do cliente [eé]\b/gi, 'oportunidade comercial identificada:')
    .replace(/\bpode ser (provedor|provedora) familiar\b/gi, 'não há informação suficiente sobre perfil familiar')
    .replace(/\bpode ter dependentes\b/gi, 'não há informação sobre dependentes')
    .replace(/\bmelhorando a avaliação de crédito\b/gi, 'fortalecendo relacionamento e histórico com o banco, sem garantir crédito futuro')
    .replace(/\bmelhora avaliação de crédito\b/gi, 'fortalece relacionamento e histórico com o banco, sem garantir crédito futuro')
    .replace(/\bmelhora oferta de crédito futura\b/gi, 'fortalece relacionamento e histórico com o banco, sem garantir crédito futuro');
    
  return t;
};

export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => typeof item === 'object' ? sanitizeObject(item) : sanitizeText(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};
