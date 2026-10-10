import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";

export function useAuth() {
  const me = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => void me.refetch(),
  });

  return {
    user: me.data ?? null,
    loading: me.isLoading,
    error: me.error,
    isAuthenticated: Boolean(me.data),
    login: () => startLogin(),
    logout: () => logoutMutation.mutate(),
    loggingOut: logoutMutation.isPending,
  };
}
