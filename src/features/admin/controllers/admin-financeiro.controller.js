import User from '../../../models/User.js';
import Subscription from '../../../models/Subscription.js';
import Plan from '../../../models/Plan.js';
import { sendSuccess } from '../../../utils/api-response.js';

export const getFinancialSummary = async (req, res, next) => {
  try {
    // 1. Fetch all subscriptions including User and Plan Details
    const subscriptions = await Subscription.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'fullName']
        },
        {
          model: Plan,
          as: 'planDetails',
          attributes: ['key', 'name', 'price']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // 2. Calculate summary statistics
    let activeSubscriptions = 0;
    let totalRevenue = 0;
    let mrr = 0;

    subscriptions.forEach(sub => {
      if (sub.status === 'active') {
        activeSubscriptions++;
        const price = sub.planDetails ? parseFloat(sub.planDetails.price) : 0;
        totalRevenue += price;

        const key = String(sub.plan || '').toLowerCase();
        const isYearly = key.includes('yearly') || key.includes('annual') || key.includes('anual');

        if (isYearly) {
          mrr += price / 12;
        } else {
          mrr += price;
        }
      }
    });

    const summary = {
      metrics: {
        activeSubscriptions,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        mrr: parseFloat(mrr.toFixed(2))
      },
      history: subscriptions.map(sub => ({
        id: sub.id,
        userEmail: sub.user?.email || 'N/A',
        userName: sub.user?.fullName || 'N/A',
        planName: sub.planDetails?.name || sub.plan,
        planPrice: sub.planDetails?.price || 0,
        status: sub.status,
        paymentMethod: sub.paymentMethod || 'Manual',
        startsAt: sub.startsAt,
        endsAt: sub.endsAt,
        createdAt: sub.created_at
      }))
    };

    return sendSuccess(res, summary, 'Resumo financeiro recuperado com sucesso.');
  } catch (error) {
    return next(error);
  }
};
