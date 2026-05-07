import { Outlet } from 'react-router-dom';
import { AppShell } from './layout/AppShell';

const Layout = () => {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

export default Layout;
