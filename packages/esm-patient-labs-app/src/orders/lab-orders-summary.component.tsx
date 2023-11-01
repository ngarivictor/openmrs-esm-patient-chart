import React, { useMemo } from 'react';
import { parseDate } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { useLabOrders } from '../api/api';
import { DataTableSkeleton } from '@carbon/react';
import { EmptyState, ErrorState, Order } from '@openmrs/esm-patient-common-lib';
import { useLaunchWorkspaceRequiringVisit } from '@openmrs/esm-patient-common-lib/src/useLaunchWorkspaceRequiringVisit';
import OrderDetailsTable from '../components/orders-details-table.component';

export interface LabOrdersSummaryProps {
  patientUuid: string;
}

export default function LabOrdersSummary({ patientUuid }: LabOrdersSummaryProps) {
  const { t } = useTranslation();

  // const launchLabOrdersWorkspace = useLaunchWorkspaceRequiringVisit<LabOrderWorkspaceAdditionalProps>('lab-order');

  const {
    data: allOrders,
    error: error,
    isLoading: isLoading,
    isValidating: isValidating,
  } = useLabOrders(patientUuid, 'pending');

  const [pastOrders, activeOrders] = useMemo(() => {
    const currentDate = new Date();
    const pastOrders: Array<Order> = [];
    const activeOrders: Array<Order> = [];

    if (allOrders) {
      for (let i = 0; i < allOrders.length; i++) {
        const order = allOrders[i];
        if (order.autoExpireDate && parseDate(order.autoExpireDate) < currentDate) {
          pastOrders.push(order);
        } else if (order.dateStopped && parseDate(order.dateStopped) < currentDate) {
          pastOrders.push(order);
        } else {
          activeOrders.push(order);
        }
      }
    }

    return [pastOrders, activeOrders];
  }, [allOrders]);

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        {(() => {
          const pendingOrdersDisplayText = t('pendingOrders', 'Pending orders');
          const pendingOrdersHeaderTitle = t('pendingOrdersTitle', 'pending orders');

          if (isLoading) return <DataTableSkeleton role="progressbar" />;

          if (error) return <ErrorState error={error} headerTitle={pendingOrdersHeaderTitle} />;

          if (activeOrders?.length) {
            return (
              <OrderDetailsTable
                isValidating={isValidating}
                title={pendingOrdersHeaderTitle}
                labOrders={activeOrders}
                patientUuid={patientUuid}
              />
            );
          }

          return (
            <EmptyState
              displayText={pendingOrdersDisplayText}
              headerTitle={pendingOrdersHeaderTitle}
              // launchForm={launchLabOrdersWorkspace}
            />
          );
        })()}
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        {(() => {
          const completedDisplayText = t('completedOrders', 'Completed orders');
          const completedHeaderTitle = t('completedOrdersTitle', 'completed orders');

          if (isLoading) return <DataTableSkeleton role="progressbar" />;

          if (error) return <ErrorState error={error} headerTitle={completedHeaderTitle} />;

          if (pastOrders?.length) {
            return (
              <OrderDetailsTable
                isValidating={isValidating}
                title={completedDisplayText}
                labOrders={pastOrders}
                patientUuid={patientUuid}
              />
            );
          }

          return <EmptyState displayText={completedDisplayText} headerTitle={completedHeaderTitle} />;
        })()}
      </div>
    </>
  );
}
