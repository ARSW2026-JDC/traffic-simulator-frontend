import { useSimulationSocket } from '../hooks/useSimulationSocket';
import { useChatSocket } from '../hooks/useChatSocket';
import { useHistorySocket } from '../hooks/useHistorySocket';
import MapView from '../components/MapView/MapView';
import Sidebar from '../components/Sidebar/Sidebar';
import Navbar from '../components/Navbar/Navbar';

export default function SimulationPage() {
  const simSocket = useSimulationSocket();
  const chatSocket = useChatSocket();
  const historySocket = useHistorySocket();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface">
      <Navbar simSocket={simSocket} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <MapView simSocket={simSocket} />
        </div>
        <Sidebar simSocket={simSocket} chatSocket={chatSocket} historySocket={historySocket} />
      </div>
    </div>
  );
}
