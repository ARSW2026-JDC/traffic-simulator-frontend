import { useSimulationSocket } from '../hooks/useSimulationSocket';
import { useChatSocket } from '../hooks/useChatSocket';
import { useHistorySocket } from '../hooks/useHistorySocket';
import MapView from '../components/MapView/MapView';
import LeftPanel from '../components/Sidebar/LeftPanel';
import RightPanel from '../components/Sidebar/RightPanel';
import SimNavbar from '../components/Navbar/Navbar';
import UserManagementModal from '../components/UserManagementModal/UserManagementModal';
import { useState } from 'react';
import '../pages/SimulationPage.css';

export default function SimulationPage() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const simSocket = useSimulationSocket();
  const chatSocket = useChatSocket();
  const historySocket = useHistorySocket();
  void historySocket;

  return (
    <div className="sim-root">
      <SimNavbar 
        simSocket={simSocket} 
        onToggleLeft={() => setLeftOpen((prev) => !prev)}
        onToggleUsers={() => setUsersOpen((prev) => !prev)}
        onToggleRight={() => setRightOpen((prev) => !prev)}
      />
      <div className="sim-body">
        <LeftPanel simSocket={simSocket} openMobile={leftOpen} onCloseMobile={() => setLeftOpen(false)} />
        <div className="sim-map">
          <MapView simSocket={simSocket} />
        </div>
        <RightPanel
          chatSocket={chatSocket}
          openMobile={rightOpen}
          onCloseMobile={() => setRightOpen(false)}
        />
      </div>
      
      {usersOpen && (
        <UserManagementModal onClose={() => setUsersOpen(false)} />
      )}
    </div>
  );
}