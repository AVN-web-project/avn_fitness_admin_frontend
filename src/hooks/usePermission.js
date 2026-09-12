import { usePermissionContext } from '../context/PermissionContext.jsx';

export const usePermission = () => {
  return usePermissionContext();
};

export default usePermission;
