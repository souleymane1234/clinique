import { Helmet } from 'react-helmet-async';

import RolesPermissionsView from 'src/sections/admin/roles-permissions/roles-permissions-view';

// ----------------------------------------------------------------------

export default function RolesPermissionsPage() {
  return (
    <>
      <Helmet>
        <title> Rôles & Permissions | AnnourTravel </title>
      </Helmet>

      <RolesPermissionsView />
    </>
  );
}

