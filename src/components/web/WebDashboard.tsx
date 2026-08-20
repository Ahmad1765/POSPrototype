import React from 'react';
import { WebSidebar } from './WebSidebar';
import { WebTopHeader } from './WebTopHeader';
import { WebHomeSection } from './WebHomeSection';
import { WebCardsSection } from './WebCardsSection';
import { WebLoansSection } from './WebLoansSection';
import { WebAnalyticsSection } from './WebAnalyticsSection';
import { WebProfileSection } from './WebProfileSection';
import { QRScannerModal } from '../QRScannerModal';
import { QuickPayModal } from '../QuickPayModal';
import { ManageCardModal } from '../ManageCardModal';
import { RewardPointsModal } from '../RewardPointsModal';
import { DigitalReceiptModal } from '../DigitalReceiptModal';
import { SearchModal, NotificationDrawer } from '../HeaderModals';
import { useAppStore } from '../../store/useAppStore';

export const WebDashboard: React.FC = () => {
  const { currentScreen } = useAppStore();

  const renderActiveSection = () => {
    switch (currentScreen) {
      case 'CARDS':
        return <WebCardsSection />;
      case 'LOANS':
        return <WebLoansSection />;
      case 'ANALYTICS':
        return <WebAnalyticsSection />;
      case 'PROFILE':
        return <WebProfileSection />;
      case 'HOME':
      default:
        return <WebHomeSection />;
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-zinc-50 text-zinc-900 antialiased selection:bg-brand-500 selection:text-white">
      {/* 1. Left Fixed Sidebar Navigation */}
      <WebSidebar />

      {/* 2. Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <WebTopHeader />

        {/* Dynamic Section Content */}
        <main className="flex-1 pb-16 overflow-y-auto">
          {renderActiveSection()}
        </main>
      </div>

      {/* Shared Interactive Modals */}
      <QRScannerModal />
      <QuickPayModal />
      <ManageCardModal />
      <RewardPointsModal />
      <DigitalReceiptModal />
      <SearchModal />
      <NotificationDrawer />
    </div>
  );
};
