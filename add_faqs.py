import re

faqs = {
    "artigos/acoes-iniciantes.html": {
        "insert_before": "  </article>",
        "questions": [
            ("Preciso de muito dinheiro para comprar ações?",
             "Não. É possível comprar ações fracionadas a partir de R$ 10 a R$ 50, dependendo do papel. Muitas corretoras não cobram taxa para compra de ações, e você pode começar com o valor que tiver disponível."),
            ("É seguro investir em ações pela primeira vez?",
             "Ações são investimentos de renda variável — o valor pode subir ou cair. O risco existe, mas pode ser reduzido com diversificação, foco em empresas sólidas (blue chips) e horizonte de longo prazo. Nunca invista dinheiro que vai precisar no curto prazo."),
            ("Quanto tempo leva para abrir uma conta na corretora?",
             "Em média 5 a 10 minutos. A abertura é 100% online, sem precisar ir a nenhuma agência. Você precisa de CPF, RG ou CNH e dados bancários para transferência."),
            ("Posso perder todo o dinheiro investido em ações?",
             "Tecnicamente sim, se a empresa falir. Por isso a diversificação é importante: distribua seus investimentos entre várias empresas e setores. Investindo em ETFs como o BOVA11, você já está diversificado em 80+ empresas automaticamente."),
        ]
    },
    "artigos/cdb-lci-lca.html": {
        "insert_before": "  </article>",
        "questions": [
            ("CDB, LCI e LCA têm garantia do FGC?",
             "Sim. Os três são cobertos pelo Fundo Garantidor de Créditos (FGC) até R$ 250.000 por CPF por instituição financeira. Se o banco emissor quebrar, você recebe de volta até esse limite."),
            ("Posso sacar o dinheiro antes do prazo?",
             "Depende do produto. CDB com liquidez diária pode ser resgatado a qualquer momento. LCI e LCA geralmente têm carência mínima de 90 dias — antes disso, o resgate não é permitido. Verifique sempre as condições antes de investir."),
            ("Qual é a diferença entre CDB e poupança?",
             "O CDB costuma render bem mais que a poupança. Com a Selic a 14,75%, um CDB a 100% do CDI rende cerca de 14,5% ao ano (antes do IR), enquanto a poupança rende cerca de 6,17% ao ano. A poupança é isenta de IR, mas mesmo assim o CDB costuma ganhar na comparação líquida."),
            ("Qual o melhor investimento entre os três para quem é iniciante?",
             "Para quem está começando e quer liquidez, o CDB com liquidez diária de 100% do CDI é o mais indicado — fácil de encontrar em corretoras, cobre o FGC e permite resgatar quando precisar. LCI e LCA são ótimos quando você pode deixar o dinheiro parado por pelo menos 6 meses."),
        ]
    },
    "artigos/orcamento-50-30-20.html": {
        "insert_before": "  </article>",
        "questions": [
            ("A regra 50-30-20 funciona para quem ganha salário mínimo?",
             "Funciona como referência, mas exige adaptação. Para rendas baixas, os gastos essenciais (aluguel, alimentação, transporte) podem consumir mais de 50% da renda, especialmente em grandes cidades. Nesse caso, reduza os desejos ao mínimo e tente guardar pelo menos 5 a 10% em vez de 20%."),
            ("Dívidas entram nos 50% ou nos 20%?",
             "Dívidas com juros altos (cartão de crédito, cheque especial) devem ser tratadas como prioridade máxima — coloque-as nos 20% ou até reduza os desejos temporariamente para quitá-las mais rápido. Parcelas de financiamentos de longo prazo (casa, carro) entram nos 50% de necessidades."),
            ("Como acompanhar se estou seguindo a regra?",
             "A forma mais simples é usar um aplicativo de controle financeiro (como Organizze ou Mobills) ou a nossa planilha gratuita. Categorize cada gasto e veja ao final do mês em qual balde ele caiu. Com 2 a 3 meses de dados, você já tem clareza sobre onde cortar."),
            ("O que fazer se sobrar menos de 20% para investir?",
             "Comece com o que puder — mesmo 5% já é um hábito valioso. O objetivo inicial é criar a disciplina de separar dinheiro antes de gastar, não atingir os 20% de imediato. Com o tempo, corte de desejos e aumento de renda vão ampliar a fatia disponível para investir."),
        ]
    },
    "artigos/renda-extra.html": {
        "insert_before": "  </article>",
        "questions": [
            ("Preciso pagar imposto sobre renda extra?",
             "Depende do valor e da fonte. Se a soma de todas as suas rendas ultrapassar R$ 2.824 por mês (tabela 2026), você pode estar sujeito ao IR. Freelancers e autônomos devem emitir RPA ou nota fiscal. Consulte um contador para valores acima de R$ 3.000 por mês de renda extra."),
            ("Qual é a forma mais rápida de começar a ganhar renda extra?",
             "As opções com menor barreira de entrada são: aulas particulares (começa em dias), freelancer no seu campo de atuação (Workana e 99Freelas têm projetos imediatos) e venda de itens usados no Mercado Livre ou OLX. Para quem tem carro, motorista de app também começa rápido."),
            ("Posso perder meu emprego por trabalhar como freelancer?",
             "A CLT não proíbe trabalhos freelancer fora do horário de trabalho, desde que não haja cláusula de exclusividade no seu contrato e você não trabalhe para concorrentes diretos. Leia seu contrato com atenção antes de começar."),
            ("Como declarar renda extra no Imposto de Renda?",
             "Rendas de trabalho autônomo ou freelancer vão na ficha Rendimentos Tributáveis Recebidos de Pessoa Física. Rendimentos de plataformas como Uber e iFood seguem a mesma lógica. Guarde todos os recibos e comprovantes ao longo do ano para facilitar a declaração."),
        ]
    },
    "artigos/reserva-emergencia.html": {
        "insert_before": "  </article>",
        "questions": [
            ("Devo ter reserva de emergência mesmo estando em dívida?",
             "Sim, mas com equilíbrio. Ter uma reserva mínima de R$ 1.000 a R$ 2.000, mesmo endividado, evita que qualquer imprevisto pequeno se torne uma nova dívida. Após essa reserva inicial, direcione o máximo possível para quitar as dívidas com juros mais altos."),
            ("O que fazer depois que usar a reserva?",
             "Recomponha a reserva antes de voltar a investir em outros produtos. Trate a reposição como uma dívida prioritária — separe um valor mensal fixo até atingir novamente a meta de 3 a 6 meses de gastos."),
            ("Posso usar a reserva de emergência para uma oportunidade de investimento?",
             "Não. Reserva de emergência não é capital de investimento — ela existe para situações imprevistas, não para oportunidades. Se você usar para investir e surgir uma emergência, pode ser obrigado a vender no pior momento. Mantenha a reserva separada e intocável."),
            ("Reserva de emergência e fundo de emergência são a mesma coisa?",
             "Sim, são nomes diferentes para o mesmo conceito: dinheiro guardado em investimento seguro e líquido para cobrir imprevistos. O importante é que esteja em um produto com liquidez diária — Tesouro Selic ou CDB com liquidez diária são as melhores opções."),
        ]
    },
    "artigos/sair-das-dividas.html": {
        "insert_before": "  </article>",
        "questions": [
            ("Devo parar de investir para pagar dívidas?",
             "Depende da taxa de juros da dívida. Se a dívida cobra mais de 10% ao ano (cartão de crédito, cheque especial, empréstimo pessoal), quitar a dívida é matematicamente mais rentável do que qualquer investimento. Exceção: continue contribuindo para o FGTS e previdência com contrapartida do empregador."),
            ("Posso usar os dois métodos ao mesmo tempo?",
             "Sim. Uma estratégia híbrida funciona bem: use a Avalanche para economizar juros nas dívidas mais caras, mas quite alguma dívida pequena pelo método Bola de Neve para manter a motivação. O mais importante é ter um sistema e segui-lo consistentemente."),
            ("O que fazer quando quitar todas as dívidas?",
             "Redirecione imediatamente o valor que pagava nas parcelas para investimentos. Se você pagava R$ 800 por mês em dívidas, esse dinheiro deve ir direto para a reserva de emergência e, depois, para investimentos de médio e longo prazo."),
            ("Como evitar cair em dívidas novamente?",
             "Três hábitos fundamentais: 1) Nunca gaste mais do que ganha — use um método de orçamento como o 50-30-20; 2) Mantenha uma reserva de emergência ativa para não precisar recorrer ao crédito em imprevistos; 3) Se precisar de crédito, compare taxas e prefira sempre os de menor custo."),
        ]
    },
    "artigos/tesouro-direto-2026.html": {
        "insert_before": '    <div class="verdict">',
        "questions": [
            ("O Tesouro Direto tem garantia do governo federal?",
             "Sim. O Tesouro Direto é emitido pelo Tesouro Nacional, ou seja, é garantido pelo próprio governo federal brasileiro. É considerado o investimento mais seguro do país, pois o risco de calote é praticamente nulo."),
            ("Posso perder dinheiro no Tesouro Direto?",
             "No Tesouro Selic, praticamente não. No Prefixado e IPCA+, existe o risco de mercado: se você resgatar antes do vencimento, o preço do título pode estar abaixo do que você pagou. Se mantiver até o vencimento, recebe exatamente a taxa contratada."),
            ("Qual é o investimento mínimo no Tesouro Direto?",
             "A partir de R$ 30. Você pode comprar frações de um título, não precisa comprar o valor nominal inteiro. Isso torna o Tesouro Direto acessível para qualquer perfil de investidor."),
            ("Como declarar o Tesouro Direto no Imposto de Renda?",
             "O IR é retido na fonte automaticamente pela corretora no momento do resgate. Na declaração anual, informe os títulos na ficha Bens e Direitos (código 45) com o saldo em 31/12. Os rendimentos já tributados na fonte aparecem no informe de rendimentos que a corretora envia todo início de ano."),
        ]
    },
}

for filepath, data in faqs.items():
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Build FAQ HTML
    faq_html = '\n    <h2>Perguntas Frequentes</h2>\n'
    for q, a in data["questions"]:
        faq_html += f'\n    <h3>{q}</h3>\n    <p>{a}</p>\n'

    # Insert FAQ before the target point
    insert_point = data["insert_before"]
    content = content.replace(insert_point, faq_html + '\n' + insert_point, 1)

    # Build FAQPage schema items
    items = []
    for q, a in data["questions"]:
        items.append(
            '    {\n'
            '      "@type": "Question",\n'
            f'      "name": "{q}",\n'
            '      "acceptedAnswer": {\n'
            '        "@type": "Answer",\n'
            f'        "text": "{a}"\n'
            '      }\n'
            '    }'
        )
    faq_schema_items = ',\n'.join(items)

    faq_schema = (
        '  <script type="application/ld+json">\n'
        '  {\n'
        '    "@context": "https://schema.org",\n'
        '    "@type": "FAQPage",\n'
        '    "mainEntity": [\n'
        + faq_schema_items + '\n'
        '    ]\n'
        '  }\n'
        '  </script>\n'
        '</head>'
    )

    content = content.replace('</head>', faq_schema, 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"OK: {filepath}")

print("\nConcluido!")
