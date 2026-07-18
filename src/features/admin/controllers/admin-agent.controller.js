import { sequelize, User, UserProfile, Plan, Scenario, ProductKnowledge, SystemPrompt, SystemSetting, Subscription } from '../../../models/index.js';
import { getSettingValue } from '../../../utils/settings-resolver.js';
import * as adminPlansService from '../services/admin-plans.service.js';
import { PlanFeatureKeys } from '../../../config/constants.js';
import Anthropic from '@anthropic-ai/sdk';
import bcrypt from 'bcryptjs';

export const runAgentCommand = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'O prompt de comando é obrigatório.' });
    }

    const apiKey = await getSettingValue('ANTHROPIC_API_KEY');
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      return res.status(400).json({ error: 'API Key do Claude não configurada no painel de administração.' });
    }

    const anthropic = new Anthropic({ apiKey });

    // Definindo as ferramentas de controle do sistema
    const tools = [
      {
        name: 'manage_scenario',
        description: 'Permite criar, atualizar, listar ou excluir cenários de simulação no banco de dados.',
        input_schema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['create', 'update', 'delete', 'list'], description: 'Ação a ser executada.' },
            id: { type: 'string', description: 'ID do cenário (necessário para update e delete).' },
            fields: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Título do cenário.' },
                category: { type: 'string', enum: ['Investimentos', 'Previdência', 'Seguros', 'Crédito', 'Cartões', 'Consórcio', 'Capitalização'] },
                difficultyLevel: { type: 'string', enum: ['Iniciante', 'Intermediário', 'Avançado', 'Especialista'] },
                clientName: { type: 'string', description: 'Nome do cliente simulado.' },
                clientAge: { type: 'number', description: 'Idade do cliente.' },
                clientPersona: { type: 'string', description: 'Traços de personalidade do cliente.' },
                description: { type: 'string', description: 'Contexto/Descrição da visita.' },
                commercialClues: { type: 'string', description: 'Pistas comerciais a serem reveladas.' }
              }
            }
          },
          required: ['action']
        }
      },
      {
        name: 'manage_user',
        description: 'Permite gerenciar usuários, alterar cargo, dar gratuidade, gerenciar plano ou listar usuários.',
        input_schema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['list', 'update_role', 'update_status', 'give_free_months', 'assign_plan'], description: 'Ação a ser executada.' },
            email: { type: 'string', description: 'Email do usuário alvo.' },
            role: { type: 'string', enum: ['user', 'admin'] },
            isActive: { type: 'boolean' },
            planKey: { type: 'string', description: 'Key exata de um plano existente (ex: standard_monthly, premium_yearly, black_monthly). Use manage_plan com action "list" para descobrir as keys disponíveis.' },
            monthsCount: { type: 'number', description: 'Número de meses grátis.' }
          },
          required: ['action']
        }
      },
      {
        name: 'manage_plan',
        description: 'Permite criar, atualizar ou listar os planos de assinatura disponíveis.',
        input_schema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['create', 'update', 'list'], description: 'Ação a ser executada.' },
            id: { type: 'string', description: 'ID do plano para atualização.' },
            fields: {
              type: 'object',
              properties: {
                key: { type: 'string', description: 'Key do plano, com o sufixo de cobrança (ex: standard_monthly, standard_yearly). Não pode ser alterada depois de criada.' },
                name: { type: 'string', description: 'Nome visível do plano (ex: "Standard - Mensal").' },
                price: { type: 'number', description: 'Preço em reais (ex: 29.00).' },
                limitSimulations: { type: 'number', description: 'Limite de simulações por mês (-1 para ilimitado).' },
                permissions: {
                  type: 'array',
                  items: { type: 'string', enum: PlanFeatureKeys },
                  description: `Funcionalidades que o plano libera. É esta lista que bloqueia ou não as telas para o assinante, e é dela que sai o card do plano. Valores válidos: ${PlanFeatureKeys.join(', ')}. Uma key fora dessa lista é rejeitada.`
                }
              }
            }
          },
          required: ['action']
        }
      },
      {
        name: 'execute_sql',
        description: 'Ferramenta avançada para executar uma query SQL bruta no banco de dados. Use apenas quando as ferramentas estruturadas não forem suficientes para atender ao prompt (ex: consultas customizadas ou relatórios complexos).',
        input_schema: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'O comando SQL completo.' }
          },
          required: ['sql']
        }
      }
    ];

    const systemPrompt = `Você é o Assistente Executivo IA (Auto-Gestor) do painel de controle do Closer.IA.
Você tem acesso de super-administrador do sistema e pode criar/atualizar cenários, gerenciar perfis de usuários, conceder planos/isenções e realizar consultas avançadas utilizando ferramentas específicas.

Ao receber uma ordem do administrador:
1. Identifique qual ferramenta é a mais apropriada. Sempre prefira as ferramentas estruturadas (manage_scenario, manage_user, manage_plan) em vez de raw SQL (execute_sql) sempre que possível para garantir estabilidade.
2. Formule os parâmetros corretos.
3. Se o resultado indicar sucesso, explique ao administrador o que foi feito em português claro.
4. Se o administrador solicitar a criação de cenários, capriche nos traços de personalidade e no contexto comercial para que fique realista.

Seja prestativo, eficiente e aja exatamente como um agente de execução (action agent).`;

    let messages = [{ role: 'user', content: prompt }];
    let executionLogs = [];
    let loopLimit = 5;
    let finalResponseText = '';

    while (loopLimit > 0) {
      loopLimit--;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 4000,
        system: systemPrompt,
        messages: messages,
        tools: tools
      });

      // Armazena a resposta no histórico de mensagens
      messages.push({
        role: 'assistant',
        content: response.content
      });

      const toolCalls = response.content.filter(block => block.type === 'tool_use');

      if (toolCalls.length === 0) {
        finalResponseText = response.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');
        break;
      }

      const toolResults = [];

      for (const call of toolCalls) {
        const { name, input, id } = call;
        let resultData = '';

        try {
          if (name === 'manage_scenario') {
            const { action, id: scenarioId, fields } = input;

            if (action === 'list') {
              const list = await Scenario.findAll({ order: [['created_at', 'DESC']] });
              resultData = JSON.stringify(list);
            } else if (action === 'create') {
              const newScenario = await Scenario.create(fields);
              resultData = JSON.stringify({ success: true, scenario: newScenario });
            } else if (action === 'update') {
              const target = await Scenario.findByPk(scenarioId);
              if (!target) throw new Error('Cenário não encontrado.');
              await target.update(fields);
              resultData = JSON.stringify({ success: true, scenario: target });
            } else if (action === 'delete') {
              const target = await Scenario.findByPk(scenarioId);
              if (!target) throw new Error('Cenário não encontrado.');
              await target.destroy();
              resultData = JSON.stringify({ success: true, message: 'Cenário deletado.' });
            }
            executionLogs.push({ tool: name, input, success: true });

          } else if (name === 'manage_user') {
            const { action, email, role, isActive, planKey, monthsCount } = input;
            
            if (action === 'list') {
              const list = await User.findAll({
                include: [
                  { model: UserProfile, as: 'profile' },
                  { model: Subscription, as: 'subscriptions', where: { status: 'active' }, required: false }
                ]
              });
              resultData = JSON.stringify(list);
            } else {
              const targetUser = await User.findOne({ where: { email } });
              if (!targetUser) throw new Error('Usuário não encontrado.');

              if (action === 'update_role') {
                targetUser.role = role;
                await targetUser.save();
                resultData = JSON.stringify({ success: true, user: targetUser });
              } else if (action === 'update_status') {
                targetUser.isActive = isActive;
                await targetUser.save();
                resultData = JSON.stringify({ success: true, user: targetUser });
              } else if (action === 'give_free_months' || action === 'assign_plan') {
                // Cancelar assinaturas ativas antigas
                await Subscription.update(
                  { status: 'cancelled' },
                  { where: { userId: targetUser.id, status: 'active' } }
                );

                if (!planKey) throw new Error('Informe a key do plano a associar.');
                const targetPlan = await Plan.findOne({ where: { key: planKey } });
                if (!targetPlan) throw new Error(`Plano "${planKey}" não encontrado.`);

                const count = monthsCount || 1;
                const newSub = await Subscription.create({
                  userId: targetUser.id,
                  plan: targetPlan.key,
                  status: 'active',
                  startsAt: new Date(),
                  endsAt: new Date(Date.now() + count * 30 * 24 * 60 * 60 * 1000)
                });
                resultData = JSON.stringify({ success: true, subscription: newSub });
              }
            }
            executionLogs.push({ tool: name, input, success: true });

          } else if (name === 'manage_plan') {
            const { action, id: planId, fields } = input;

            // Passa pelo mesmo service do painel: é ele que rejeita uma key de
            // permissão inexistente. Escrevendo no model direto, uma key errada
            // salvaria sem erro e a funcionalidade nunca abriria.
            if (action === 'list') {
              const list = await adminPlansService.listPlans();
              resultData = JSON.stringify(list);
            } else if (action === 'create') {
              const newPlan = await adminPlansService.createPlan(fields);
              resultData = JSON.stringify({ success: true, plan: newPlan });
            } else if (action === 'update') {
              const target = await adminPlansService.updatePlan(planId, fields);
              resultData = JSON.stringify({ success: true, plan: target });
            }
            executionLogs.push({ tool: name, input, success: true });

          } else if (name === 'execute_sql') {
            console.log(`⚠️ Raw SQL Tool Executing: ${input.sql}`);
            const [queryResult] = await sequelize.query(input.sql);
            resultData = JSON.stringify(queryResult);
            executionLogs.push({ tool: name, input, success: true });
          }
        } catch (err) {
          console.error(`Erro ao rodar ferramenta ${name}:`, err);
          resultData = JSON.stringify({ error: err.message });
          executionLogs.push({ tool: name, input, success: false, error: err.message });
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: id,
          content: resultData
        });
      }

      messages.push({
        role: 'user',
        content: toolResults
      });
    }

    return res.status(200).json({
      success: true,
      response: finalResponseText || 'Comando processado com sucesso.',
      logs: executionLogs
    });

  } catch (err) {
    next(err);
  }
};
