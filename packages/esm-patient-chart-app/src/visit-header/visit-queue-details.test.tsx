import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import VisitQueueDetail from './visit-queue-details.component';
import { STATUS, PRIORITY } from '../constants';
import { showModal } from '@openmrs/esm-framework';

jest.mock('@openmrs/esm-framework', () => ({
  showModal: jest.fn(),
}));

describe('VisitQueueDetail', () => {
  const mockQueueEntry = {
    service: 'Test Service',
    status: STATUS.IN_SERVICE,
  };

  const mockPriority = PRIORITY.EMERGENCY;

  it('renders without crashing', () => {
    const { container } = render(<VisitQueueDetail queueEntry={mockQueueEntry} priority={mockPriority} />);
    expect(container).toBeInTheDocument();
  });

  it('displays the correct service message', () => {
    const { getByText } = render(<VisitQueueDetail queueEntry={mockQueueEntry} priority={mockPriority} />);
    expect(getByText(`Attending ${mockQueueEntry.service}`)).toBeInTheDocument();
  });

  it('displays the correct tag type based on priority', () => {
    render(<VisitQueueDetail queueEntry={mockQueueEntry} priority={mockPriority} />);
    const attendingService = screen.getByText(`Attending ${mockQueueEntry.service}`);
    expect(attendingService).toBeInTheDocument();

    const emergencyTag = screen.getByText(mockPriority);
    expect(emergencyTag).toBeInTheDocument();
  });

  it('calls showModal on edit button click', () => {
    render(<VisitQueueDetail queueEntry={mockQueueEntry} priority={mockPriority} />);
    const moveToNextServiceButton = screen.getByRole('button', { name: /move to next service/i });
    expect(moveToNextServiceButton).toBeInTheDocument();
    fireEvent.click(moveToNextServiceButton);
    expect(showModal).toHaveBeenCalled();
  });
});