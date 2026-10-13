# PRODUCT · Sprout (nome de trabalho)

## O que é

Uma webapp de investimento gamificada em que **investidores qualificados financiam lotes reais de commodities agroalimentares** nos três mercados discutidos na reunião de 13/10 (fonte: `docs/fonte/plano-estrategico-10-13.md`): **azeite**, **água engarrafada** e **café**.

O conceito por trás do jogo:

- A Sprout compra lotes diretamente aos produtores (lagares, nascentes, origens de café) e captura a maior parte da margem do embalador (tese: 80–90 %).
- Vende esses lotes a compradores B2B (distribuição, HoReCa, retalho, cash & carry) **10–15 % abaixo da referência de mercado**.
- Os investidores financiam a compra do lote e os custos até à venda, com **janelas de liquidação de 18 meses**, **extensão condicionada** (uma vez, até 6 meses) e um **playbook de refunding por lote**.
- Coberturas de preço (venda a prazo e indexação no azeite; futuros ICE KC no café; nenhuma na água) e **rails de pagamento licenciados na UE** (PSP/IME, contas segregadas, reconciliação diária, sem numerário) protegem o ciclo.

**Fase 1 = piloto fechado**, coorte **azeite + água**, **só investidores qualificados** (retalho bloqueado com explicação respeitosa). O café está visível como **"Fase 2 · abre em 2027"**: explorável e jogável na Academia, não investível.

## Público

- **Investidor qualificado** (pessoa coletiva ou singular tratada como qualificada): quer um ativo palpável e auditável, não especulação. Usa a app para escolher lotes, acompanhar a jornada física e perceber o risco.
- **Visitante**: ainda sem registo. Explora mundos, Academia, Simulador e jornadas; comprometer capital leva ao onboarding.
- **Equipa Sprout**: operações, risco & tesouraria, compliance. Vê Bastidores e o Plano de execução.

Cena de uso: computador de secretária em horário de trabalho, ou telemóvel ao fim do dia a acompanhar o diário de campanha.

## O jogo (um só sistema)

- **Mundos**: O Olival (azeite), A Nascente (água), A Plantação (café), cada um com mapa de mosaico das origens e vocabulário próprio.
- **Estações**: a campanha agrícola é a estação (Campanha 2026/27, colheita out.–jan., armazenagem e vendas fev.–set.). O **Diário de campanha** mostra eventos dos produtores.
- **Lotes como missões**: "encher o depósito" — medidor físico (IBC, palete, sacas) e jornada Colhido → Analisado → Em depósito → Em venda → Expedido → Liquidado.
- **Caderno de colheita**: selos de origem em lacre, um por produtor × região × campanha, ganhos por compromisso **ou** por missões de diligência.
- **Níveis de conhecimento**: Aprendiz → Provador → Lagareiro → Mestre de campanha, **só por aprendizagem e diligência**.
- **Missões de conhecimento** e **mini-jogos** com conteúdo real (Painel de prova, Lê o rótulo, Da cereja à chávena).
- **Simulador de campanha**: o único sítio onde retorno e risco são jogados, com **dinheiro fictício**, incluindo perdas. Serve também de simulação de perdas no espírito do Reg. (UE) 2020/1503 (ECSP).
- **Ritual de compromisso** (dinheiro real): fatores de risco lidos, montante traduzido em mercadoria, pressão contínua para confirmar, selo de lacre, próximos passos calmos (transferência SEPA para a conta segregada).

## Linhas vermelhas (regulatórias e de produto)

Diretiva aprovada no documento-fonte: **zero ludificação de retornos financeiros ou volatilidade**. Por isso, com dinheiro real é proibido:

- pontos, XP ou níveis ligados a montantes investidos;
- rankings ou comparação social de investidores ou de rentabilidades;
- streaks, confetes ou celebrações ligadas a dinheiro ou rentabilidade;
- empurrões para maximizar retorno, contagens decrescentes, escassez ("só faltam 2 vagas!");
- P&L verde/vermelho a piscar; lotaria, roletas, caixas-surpresa;
- qualquer promessa ou "garantia" de rentabilidade.

Todas as vistas com dinheiro real têm **nota de capital em risco** e linguagem neutra: "liquidação prevista", "montante financiado", nunca "lucro garantido". O dinheiro fictício só aparece com a etiqueta **"Simulação educativa · dinheiro fictício · não representa resultados reais"**.

Outras restrições: piloto só com investidores qualificados; nada nesta app é oferta pública nem recomendação; dados de demonstração **fictícios e determinísticos**; pessoas reais do documento-fonte (Gonçalo Almeida, Pedro Marques, Speaker 1, Speaker 2, Tesouraria) **só em /plano**; nunca inventar números de empresas reais.

## Voz

Português europeu (AO90), como uma pessoa de produto e finanças que conhece o campo: frases curtas, concretas, com unidades. Trata o utilizador por "tu" nas ações ("Lê o boletim", "Mantém premido"). Sem marketing genérico ("revolucionário", "desbloqueie o poder"), sem "insights de IA", sem emoji. Os botões dizem o que fazem; os erros dizem o problema e a saída.

Vocabulário fixo: utilizador, equipa, registo, ecrã, contacto, receção, fatura, lote, co-financiador, montante financiado, liquidação prevista, janela de 18 meses, extensão, refunding, cobertura, conta segregada, campanha, colheita, lagar, depósito, IBC, palete, saca.
