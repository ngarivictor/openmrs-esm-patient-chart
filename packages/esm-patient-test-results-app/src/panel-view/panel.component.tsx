import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RowData } from '../filter/filter-types';
import styles from './result-panel.scss';
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Layer,
} from '@carbon/react';
import { getClass, getShorterText } from './helper';
import { ObsRecord } from './types';
import { formatDate, isDesktop, useLayoutType, usePatient } from '@openmrs/esm-framework';

interface LabSetPanelProps {
  panel: ObsRecord;
  observations: Array<ObsRecord>;
  activePanel: ObsRecord;
  setActivePanel: React.Dispatch<React.SetStateAction<ObsRecord>>;
}

const LabSetPanel: React.FC<LabSetPanelProps> = ({ panel, observations, activePanel, setActivePanel }) => {
  const { t } = useTranslation();
  const date = new Date(panel.effectiveDateTime);
  const layout = useLayoutType();

  const hasRange = panel.meta?.range;

  const headers = useMemo(
    () =>
      hasRange
        ? [
            {
              id: 'testName',
              key: 'testName',
              header: t('testName', 'Test name'),
              colSpan: 1,
            },
            {
              id: 'value',
              key: 'value',
              header: t('value', 'Value'),
              colSpan: 1,
            },
            {
              id: 'range',
              key: 'range',
              header: t('referenceRange', 'Reference range'),
              colSpan: 1,
            },
          ]
        : [
            {
              id: 'testName',
              key: 'testName',
              header: t('testName', 'Test name'),
              colSpan: 1,
            },
            {
              id: 'value',
              key: 'value',
              header: t('value', 'Value'),
              colSpan: 1,
            },
          ],
    [t, hasRange],
  );

  const rowsData = useMemo(
    () =>
      hasRange
        ? observations.map((test) => ({
            id: test.id,
            testName: getShorterText(test.name),
            value: {
              content: !isNaN(parseFloat(test.value)) ? (
                <span className={styles.result}>{`${test.value} ${test?.meta?.units ?? ''}`}</span>
              ) : (
                getShorterText(test.value)
              ),
            },
            interpretation: test.interpretation,
            range: test?.meta.range ? `${test?.meta?.range} ${test?.meta?.units ?? ''}` : '--',
          }))
        : observations.map((test) => ({
            id: test.id,
            testName: getShorterText(test.name),
            value: {
              content: !isNaN(parseFloat(test.value)) ? (
                <span className={styles.result}>{`${test.value} ${test?.meta?.units ?? ''}`}</span>
              ) : (
                getShorterText(test.value)
              ),
            },
            interpretation: test.interpretation,
          })),
    [observations, hasRange],
  );

  return (
    <Layer>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setActivePanel(panel)}
        className={`${styles.labSetPanel} ${activePanel?.conceptUuid === panel.conceptUuid && styles.activePanel}`}
      >
        <div className={styles.panelHeader}>
          <h2 className={styles.productiveHeading02}>{panel.name}</h2>
          <p className={styles.subtitleText}>
            {formatDate(date, {
              mode: 'wide',
            })}{' '}
            &bull; {`${date.getUTCHours()}:${date.getUTCMinutes()}`}
          </p>
        </div>
        <DataTable rows={rowsData} headers={headers}>
          {({ rows, headers, getHeaderProps, getTableProps }) => (
            <TableContainer>
              <Table {...getTableProps()} size={isDesktop(layout) ? 'sm' : 'md'}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header, colSpan: header.colSpan })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, indx) => {
                    return (
                      <TableRow key={row.id} className={`${getClass(rowsData[indx]?.interpretation)} check`}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell?.value?.content ?? cell.value}</TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </div>
    </Layer>
  );
};

export default LabSetPanel;
