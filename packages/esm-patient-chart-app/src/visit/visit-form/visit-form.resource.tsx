import { openmrsFetch, OpenmrsResource } from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import useSWR from 'swr';
const url = `/ws/rest/v1/appointments/search`;

interface Appointment {
  appointmentKind: string;
  appointmentNumber: string;
  comments: string;
  endDateTime: Date | number;
  location: OpenmrsResource;
  patient: fhir.Patient;
  provider: OpenmrsResource;
  providers: Array<OpenmrsResource>;
  recurring: boolean;
  service: OpenmrsResource;
  startDateTime: number | any;
  status: string;
  uuid: string;
}

export const useCurrentPatientAppointments = (patientUuid: string, ac: AbortController) => {
  const fetcher = () =>
    openmrsFetch(url, {
      method: 'POST',
      signal: ac.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        patientUuid: patientUuid,
        startDate: dayjs(new Date().setHours(0, 0, 0, 0)).toISOString(),
      },
    });

  const { data, error } = useSWR<{ data: Array<Appointment> }>(url, fetcher);
  return { currentAppointments: data?.data ?? [], error: error, isLoading: !data && !error };
};

export const changeAppointmentStatus = (toStatus: string, appointmentUuid: string, ac: AbortController) => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const statusChangeTime = dayjs(new Date()).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
  const url = `/ws/rest/v1/appointments/${appointmentUuid}/status-change`;
  return openmrsFetch(url, {
    body: { toStatus, onDate: statusChangeTime, timeZone: timeZone },
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};
