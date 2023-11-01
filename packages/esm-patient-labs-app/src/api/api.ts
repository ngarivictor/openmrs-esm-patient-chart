type OrderStatus = 'pending' | 'completed';

export function useLabOrders(patientUuid: string, status: OrderStatus) {
  return {
    data: [],
    error: null,
    isLoading: false,
    isValidating: false,
    mutate: () => {},
  };
}
