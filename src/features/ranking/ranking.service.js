import { UserProfile, User } from '../../models/index.js';

export const getRanking = async () => {
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
};
