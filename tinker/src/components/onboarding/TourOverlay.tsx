import React from 'react';
import { Joyride, EventData, STATUS } from 'react-joyride';
import { useUiStore } from '../../stores/uiStore';

const steps = [
  {
    target: 'body',
    content: 'Welcome to Tinker! Let us show you around your new workspace.',
    placement: 'center' as const,
    disableBeacon: true,
  },
  {
    target: '[data-testid="sidebar"]',
    content: 'This is the sidebar. Here you can find your workshops, navigation links, and settings.',
    placement: 'right' as const,
  },
  {
    target: '[data-testid="btn-create-shop"]',
    content: 'Click here anytime to create a new Workshop to group related projects.',
    placement: 'right' as const,
  },
  {
    target: '[data-testid="main-content"]',
    content: 'This is the main workbench. Double-click anywhere to create a project, or drag the canvas to pan around.',
    placement: 'left' as const,
  },
  {
    target: '[data-testid="btn-view-constellation"]',
    content: 'Check out the Constellation view to see a living map of how all your notes and projects connect to each other.',
    placement: 'right' as const,
  }
];

export function TourOverlay() {
  const tourActive = useUiStore(s => s.tourActive);
  const stopTour = useUiStore(s => s.stopTour);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      stopTour();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={tourActive}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideCallback}
      options={{
        showProgress: true,
        primaryColor: '#C16D3B',
        textColor: '#3D3730',
        backgroundColor: '#FAF7F2',
        arrowColor: '#FAF7F2',
        overlayColor: 'rgba(0, 0, 0, 0.45)',
      }}
      styles={{
        tooltip: {
          borderRadius: '16px',
          padding: '24px',
        },
        buttonPrimary: {
          borderRadius: '8px',
          fontWeight: 600,
        },
        buttonBack: {
          color: '#847B6F',
        },
      }}
    />
  );
}
