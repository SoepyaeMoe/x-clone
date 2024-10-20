import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';

const useFollow = () => {
    const queryClient = useQueryClient();
    const { mutate: follow, isPending } = useMutation({
        mutationFn: async (id) => {
            try {
                const res = await fetch(`/api/users/follow/${id}`, {
                    method: 'POST',
                });
                const data = await res.json();
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: () => {
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ['authUser'] }),
                queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] })
            ]);
        },
        onError: (error) => {
            toast.error(error.message)
        }
    });
    return { follow, isPending };
}

export default useFollow