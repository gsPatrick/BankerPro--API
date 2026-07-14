export const detectProductsOffered = (messages = []) => {
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const products = {
    credito: false,
    consorcio: false,
    seguro: false,
    capitalizacao: false
  };

  if (/consorcio|consórcio/i.test(userMessages)) {
    products.consorcio = true;
  }
  if (/seguro|proteção|protecao|vida|residencial/i.test(userMessages)) {
    products.seguro = true;
  }
  if (/capitalização|capitalizacao|título|titulo/i.test(userMessages)) {
    products.capitalizacao = true;
  }
  if (/crédito|credito|empréstimo|emprestimo|consignado|financiamento/i.test(userMessages)) {
    products.credito = true;
  }

  const listOffered = Object.keys(products).filter(p => products[p]);
  return {
    offered: listOffered,
    count: listOffered.length
  };
};
