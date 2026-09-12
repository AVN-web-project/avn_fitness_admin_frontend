import { useAdminAuthContext } from '../context/AdminAuthContext.jsx';

export const useAdminAuth = () => {
  return useAdminAuthContext();
};

export default useAdminAuth;
