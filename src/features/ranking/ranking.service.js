import { UserProfile, User } from '../../models/index.js';
import { cacheRead } from '../../utils/redis-cache.js';

// O ranking é o mesmo para todo mundo e roda a cada abertura da tela, ordenando
// a tabela por XP. Cachear 60s troca essa ordenação repetida por uma leitura
// instantânea; um XP recém-ganho aparece no ranking em até 1 minuto, o que é
// irrelevante para um placar.
const rankingBruto = async () =>
  cacheRead('ranking:top100', 60, async () => {
    const ranking = await UserProfile.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'fullName']
        }
      ],
      order: [['xpPoints', 'DESC']],
      limit: 100
    });

    return ranking.map(profile => ({
      userId: profile.userId,
      userEmail: profile.user ? profile.user.email : null,
      userName: profile.user ? profile.user.fullName : null,
      roleTitle: profile.roleTitle,
      totalSimulations: profile.totalSimulations,
      averageScore: parseFloat(profile.averageScore || 0),
      xpPoints: profile.xpPoints
    }));
  });

/**
 * Um placar precisa de nome, não de e-mail. Cada um vê o próprio e-mail (o front
 * usa para destacar "você" na lista); o dos outros sai da resposta — senão
 * qualquer usuário coleta o e-mail dos 100 primeiros só abrindo a tela.
 */
export const getRanking = async (requestingUserId) => {
  const ranking = await rankingBruto();
  return ranking.map((entry) => ({
    ...entry,
    userEmail: entry.userId === requestingUserId ? entry.userEmail : null
  }));
};
