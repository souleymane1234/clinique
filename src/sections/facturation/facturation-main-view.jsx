import { useLocation } from 'react-router-dom';

import { routesName } from 'src/constants/routes';

import FacturesView from './factures-view';
import BonsDeSortieView from './bons-de-sortie-view';

// ----------------------------------------------------------------------

// const TABS = [
//   { value: 'factures', label: 'Factures', path: routesName.factures },
//   { value: 'bons-de-sortie', label: 'Bons de sortie', path: routesName.bonsDeSortie },
// ];

export default function FacturationMainView() {
  const location = useLocation();
  // const navigate = useNavigate();

  // Déterminer l'onglet actif basé sur la route
  // const getCurrentTab = () => {
  //   if (location.pathname.includes('/bons-de-sortie') && !location.pathname.includes('/bons-de-sortie/')) {
  //     return 'bons-de-sortie';
  //   }
  //   if (location.pathname === routesName.factures || location.pathname.startsWith('/facturation/factures')) {
  //     return 'factures';
  //   }
  //   return 'factures';
  // };

  // const [currentTab, setCurrentTab] = useState(getCurrentTab());

  // useEffect(() => {
  //   setCurrentTab(getCurrentTab());
  // }, [location.pathname]);

  // const handleTabChange = (event, newValue) => {
  //   setCurrentTab(newValue);
  //   const tab = TABS.find((t) => t.value === newValue);
  //   if (tab) {
  //     navigate(tab.path);
  //   }
  // };

  // Ne pas afficher les onglets si on est sur une page de détails, le bilan, les factures ou les bons de sortie
  const isDetailPage = location.pathname.includes('/factures/') || location.pathname.includes('/bons-de-sortie/');
  const isBilanPage = location.pathname.includes('/bilan');
  const isBonsDeSortiePage = location.pathname === routesName.bonsDeSortie || location.pathname.includes('/bons-de-sortie');
  const isFacturesPage = location.pathname === routesName.factures || (location.pathname.startsWith('/facturation/factures') && !location.pathname.includes('/factures/'));

  if (isDetailPage || isBilanPage) {
    return null; // Laisser la page de détails ou le bilan s'afficher sans les onglets
  }

  // Si on est sur la page des bons de sortie, afficher directement sans les onglets
  if (isBonsDeSortiePage) {
    return <BonsDeSortieView />;
  }

  // Si on est sur la page des factures, afficher directement sans les onglets
  if (isFacturesPage) {
    return <FacturesView />;
  }

  return null;
}

