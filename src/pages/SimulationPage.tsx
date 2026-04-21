import { useSimulationSocket } from '../hooks/useSimulationSocket';
import { useChatSocket } from '../hooks/useChatSocket';
import { useHistorySocket } from '../hooks/useHistorySocket';
import MapView from '../components/MapView/MapView';
import Sidebar from '../components/Sidebar/Sidebar';
import SimNavbar from '../components/Navbar/Navbar';
import '../pages/SimulationPage.css';

export default function SimulationPage() {
  const simSocket = useSimulationSocket();
  const chatSocket = useChatSocket();
  const historySocket = useHistorySocket();

  return (
    <div className="sim-root">
      <SimNavbar simSocket={simSocket} />
      <div className="sim-body">
        <div className="sim-map">
          <MapView simSocket={simSocket} />
        </div>
        <Sidebar simSocket={simSocket} chatSocket={chatSocket} historySocket={historySocket} />
      </div>
    </div>
  );
}
