import type { Group } from '../types';

export interface SettlementBreakdown {
  memberId: string;
  memberName: string;
  address: string;
  fixedCostShare: number;
  variableCostShare: number;
  totalOwed: number;
  hasPaid: boolean;
}

export const calculateSettlements = (group: Group): SettlementBreakdown[] => {
  const totalMembers = group.members.length;
  if (totalMembers === 0) return [];

  let totalFixed = 0;
  let totalVariable = 0;

  group.expenses.forEach(exp => {
    if (exp.isFixed) {
      totalFixed += exp.amount;
    } else {
      totalVariable += exp.amount;
    }
  });

  const fixedSharePerMember = totalFixed / totalMembers;
  const totalGoodsOrdered = group.members.reduce((acc, m) => acc + m.orderAmount, 0);

  return group.members.map(member => {
    // If no one ordered anything yet, avoid NaN by defaulting to 0
    const proportion = totalGoodsOrdered > 0 ? (member.orderAmount / totalGoodsOrdered) : 0;
    const variableShare = totalVariable * proportion;
    
    return {
      memberId: member.id,
      memberName: member.name,
      address: member.address,
      fixedCostShare: fixedSharePerMember,
      variableCostShare: variableShare,
      totalOwed: fixedSharePerMember + variableShare,
      hasPaid: member.hasPaid
    };
  });
};
