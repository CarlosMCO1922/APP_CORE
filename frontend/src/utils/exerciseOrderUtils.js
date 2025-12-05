// frontend/src/utils/exerciseOrderUtils.js
// Função utilitária para garantir ordenação consistente de exercícios

/**
 * Ordena exercícios de um plano de treino por order e internalOrder
 * Esta função garante que a ordem criada pelo PT é sempre respeitada
 * 
 * @param {Array} exercises - Array de exercícios do plano
 * @returns {Array} - Array de exercícios ordenados
 */
export const sortPlanExercises = (exercises) => {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return exercises || [];
  }

  // Criar cópia para não mutar o array original
  const sorted = [...exercises].sort((a, b) => {
    // Primeiro por order (bloco)
    const orderA = a.order !== null && a.order !== undefined ? a.order : 0;
    const orderB = b.order !== null && b.order !== undefined ? b.order : 0;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Se estão no mesmo bloco, ordenar por internalOrder (ordem dentro do bloco)
    const internalOrderA = a.internalOrder !== null && a.internalOrder !== undefined ? a.internalOrder : 0;
    const internalOrderB = b.internalOrder !== null && b.internalOrder !== undefined ? b.internalOrder : 0;
    
    return internalOrderA - internalOrderB;
  });

  return sorted;
};

/**
 * Garante que um plano de treino tem os exercícios ordenados
 * 
 * @param {Object} plan - Plano de treino
 * @returns {Object} - Plano com exercícios ordenados
 */
export const ensurePlanExercisesOrdered = (plan) => {
  if (!plan) return plan;
  
  if (plan.planExercises && Array.isArray(plan.planExercises)) {
    return {
      ...plan,
      planExercises: sortPlanExercises(plan.planExercises)
    };
  }
  
  return plan;
};

/**
 * Garante que um array de planos tem os exercícios ordenados
 * 
 * @param {Array} plans - Array de planos de treino
 * @returns {Array} - Array de planos com exercícios ordenados
 */
export const ensurePlansExercisesOrdered = (plans) => {
  if (!Array.isArray(plans)) return plans;
  
  return plans.map(plan => ensurePlanExercisesOrdered(plan));
};

