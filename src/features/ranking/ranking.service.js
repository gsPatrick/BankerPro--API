import { UserProfile, User } from '../../models/index.js';
import { cacheRead } from '../../utils/redis-cache.js';

// O ranking é o mesmo para todo mundo e roda a cada abertura da tela, ordenando
// a tabela por XP. Cachear 60s troca essa ordenação repetida por uma leitura
// instantânea; um XP recém-ganho aparece no ranking em até 1 minuto, o que é
// irrelevante para um placar.
export const getRanking = async () =>
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
