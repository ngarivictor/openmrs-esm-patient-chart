import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import capitalize from 'lodash-es/capitalize';
import {
  DataTable,
  Button,
  IconButton,
  InlineLoading,
  OverflowMenu,
  OverflowMenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { CardHeader, Order, useOrderBasket } from '@openmrs/esm-patient-common-lib';
import { Add, User, Printer } from '@carbon/react/icons';
import { age, formatDate, useConfig, useLayoutType, usePatient } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { useLaunchWorkspaceRequiringVisit } from '@openmrs/esm-patient-common-lib/src/useLaunchWorkspaceRequiringVisit';
import styles from './order-details-table.scss';
import { ConfigObject } from '../config-schema';
import { useReactToPrint } from 'react-to-print';
import { LabOrderBasketItem } from '../lab-order-basket/api';

export interface LabOrdersProps {
  isValidating?: boolean;
  title?: string;
  labOrders?: Array<Order> | null;
  showAddButton?: boolean;
  patientUuid: string;
}

const OrderDetailsTable: React.FC<LabOrdersProps> = ({
  isValidating,
  title,
  labOrders,
  showAddButton,
  patientUuid,
}) => {
  const { t } = useTranslation();
  const launchOrderBasket = useLaunchWorkspaceRequiringVisit('order-basket');
  const launchAddDrugOrder = useLaunchWorkspaceRequiringVisit('add-drug-order');
  const config = useConfig() as ConfigObject;
  const showPrintButton = config.showPrintButton;
  const contentToPrintRef = useRef(null);
  const patient = usePatient(patientUuid);
  const { excludePatientIdentifierCodeTypes } = useConfig();
  const [isPrinting, setIsPrinting] = useState(false);

  const { orders, setOrders } = useOrderBasket<LabOrderBasketItem>('order-basket');

  const tableHeaders = [
    {
      key: 'startDate',
      header: t('startDate', 'Start date'),
      isSortable: true,
      isVisible: true,
    },
    {
      key: 'details',
      header: t('details', 'Details'),
      isSortable: true,
      isVisible: true,
    },
  ];

  const tableRows = labOrders?.map((medication, id) => ({
    id: `${id}`,
    details: {
      sortKey: medication.drug?.display,
      content: (
        <div className={styles.medicationRecord}>
          <div>
            <p className={styles.bodyLong01}>
              <strong>{capitalize(medication.drug?.display)}</strong>{' '}
              {medication.drug?.strength && <>&mdash; {medication.drug?.strength.toLowerCase()}</>}{' '}
              {medication.drug?.dosageForm?.display && <>&mdash; {medication.drug.dosageForm.display.toLowerCase()}</>}
            </p>
            <p className={styles.bodyLong01}>
              <span className={styles.label01}>{t('dose', 'Dose').toUpperCase()}</span>{' '}
              <span className={styles.dosage}>
                {medication.dose} {medication.doseUnits?.display.toLowerCase()}
              </span>{' '}
              {medication.route?.display && <>&mdash; {medication.route?.display.toLowerCase()}</>}{' '}
              {medication.frequency?.display && <>&mdash; {medication.frequency?.display.toLowerCase()}</>} &mdash;{' '}
              {!medication.duration
                ? t('medicationIndefiniteDuration', 'Indefinite duration').toLowerCase()
                : t('medicationDurationAndUnit', 'for {{duration}} {{durationUnit}}', {
                    duration: medication.duration,
                    durationUnit: medication.durationUnits?.display.toLowerCase(),
                  })}{' '}
              {medication.numRefills !== 0 && (
                <span>
                  <span className={styles.label01}> &mdash; {t('refills', 'Refills').toUpperCase()}</span>{' '}
                  {medication.numRefills}
                </span>
              )}
              {medication.dosingInstructions && (
                <span> &mdash; {medication.dosingInstructions.toLocaleLowerCase()}</span>
              )}
            </p>
          </div>
          <p className={styles.bodyLong01}>
            {medication.orderReasonNonCoded ? (
              <span>
                <span className={styles.label01}>{t('indication', 'Indication').toUpperCase()}</span>{' '}
                {medication.orderReasonNonCoded}
              </span>
            ) : null}
            {medication.quantity ? (
              <span>
                <span className={styles.label01}> &mdash; {t('quantity', 'Quantity').toUpperCase()}</span>{' '}
                {medication.quantity} {medication.quantityUnits.display}
              </span>
            ) : null}
            {medication.dateStopped ? (
              <span>
                <span className={styles.label01}> &mdash; {t('endDate', 'End date').toUpperCase()}</span>{' '}
                {formatDate(new Date(medication.dateStopped))}
              </span>
            ) : null}
          </p>
        </div>
      ),
    },
    startDate: {
      sortKey: dayjs(medication.dateActivated).toDate(),
      content: (
        <div className={styles.startDateColumn}>
          <span>{formatDate(new Date(medication.dateActivated))}</span>
          {!isPrinting && <InfoTooltip orderer={medication.orderer?.person?.display ?? '--'} />}
        </div>
      ),
    },
  }));

  const sortRow = (cellA, cellB, { sortDirection, sortStates }) => {
    return sortDirection === sortStates.DESC
      ? compare(cellB.sortKey, cellA.sortKey)
      : compare(cellA.sortKey, cellB.sortKey);
  };

  const patientDetails = useMemo(() => {
    const getGender = (gender: string): string => {
      switch (gender) {
        case 'male':
          return t('male', 'Male');
        case 'female':
          return t('female', 'Female');
        case 'other':
          return t('other', 'Other');
        case 'unknown':
          return t('unknown', 'Unknown');
        default:
          return gender;
      }
    };

    const identifiers =
      patient?.patient?.identifier?.filter(
        (identifier) => !excludePatientIdentifierCodeTypes?.uuids.includes(identifier.type.coding[0].code),
      ) ?? [];

    return {
      name: `${patient?.patient?.name?.[0]?.given?.join(' ')} ${patient?.patient?.name?.[0].family}`,
      age: age(patient?.patient?.birthDate),
      gender: getGender(patient?.patient?.gender),
      location: patient?.patient?.address?.[0].city,
      identifiers: identifiers?.length ? identifiers.map(({ value, type }) => value) : [],
    };
  }, [patient, t, excludePatientIdentifierCodeTypes?.uuids]);

  const onBeforeGetContentResolve = useRef(null);

  useEffect(() => {
    if (isPrinting && onBeforeGetContentResolve.current) {
      onBeforeGetContentResolve.current();
    }
  }, [isPrinting]);

  const handlePrint = useReactToPrint({
    content: () => contentToPrintRef.current,
    documentTitle: `OpenMRS - ${patientDetails.name} - ${title}`,
    onBeforeGetContent: () =>
      new Promise((resolve) => {
        if (patient && patient.patient && title) {
          onBeforeGetContentResolve.current = resolve;
          setIsPrinting(true);
        }
      }),
    onAfterPrint: () => {
      onBeforeGetContentResolve.current = null;
      setIsPrinting(false);
    },
  });

  return (
    <div className={styles.widgetCard}>
      <CardHeader title={title}>
        {isValidating ? (
          <span>
            <InlineLoading />
          </span>
        ) : null}
        <div className={styles.buttons}>
          {showPrintButton && (
            <Button
              kind="ghost"
              renderIcon={Printer}
              iconDescription="Add vitals"
              className={styles.printButton}
              onClick={handlePrint}
            >
              {t('print', 'Print')}
            </Button>
          )}
          {showAddButton ?? true ? (
            <Button
              kind="ghost"
              renderIcon={(props) => <Add size={16} {...props} />}
              iconDescription="Launch order basket"
              onClick={launchAddDrugOrder}
            >
              {t('add', 'Add')}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <div ref={contentToPrintRef}>
        {/* <PrintComponent subheader={title} patientDetails={patientDetails} /> */}
        <DataTable
          data-floating-menu-container
          size="sm"
          headers={tableHeaders}
          rows={tableRows}
          isSortable
          sortRow={sortRow}
          overflowMenuOnHover={false}
          useZebraStyles
        >
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader
                        {...getHeaderProps({
                          header,
                          isSortable: header.isSortable,
                        })}
                      >
                        {header.header}
                      </TableHeader>
                    ))}
                    <TableHeader />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, rowIndex) => (
                    <TableRow className={styles.row} {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <TableCell className={styles.tableCell} key={cell.id}>
                          {cell.value?.content ?? cell.value}
                        </TableCell>
                      ))}
                      {!isPrinting && <TableCell className="cds--table-column-menu">{/* TBD add actions */}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </div>
    </div>
  );
};

function InfoTooltip({ orderer }: { orderer: string }) {
  return (
    <IconButton
      className={styles.tooltip}
      align="top-left"
      direction="top"
      label={orderer}
      renderIcon={(props) => <User size={16} {...props} />}
      iconDescription={orderer}
      kind="ghost"
      size="sm"
    />
  );
}

/**
 * Enables a comparison of arbitrary values with support for undefined/null.
 * Requires the `<` and `>` operators to return something reasonable for the provided values.
 */
function compare<T>(x?: T, y?: T) {
  if (x == undefined && y == undefined) {
    return 0;
  } else if (x == undefined) {
    return -1;
  } else if (y == undefined) {
    return 1;
  } else if (x < y) {
    return -1;
  } else if (x > y) {
    return 1;
  } else {
    return 0;
  }
}

export default OrderDetailsTable;
