import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useUserUpdateProfile = () => {

    const queryClient = useQueryClient();

    const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
        mutationFn: async (formData) => {
            const res = await fetch('/api/users/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wroung');
            return data;
        },
        onSuccess: () => {
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ['userProfile'] }),
                queryClient.invalidateQueries({ queryKey: ['authUser'] })
            ]);
            toast.success('Profile update success');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
    return { updateProfile, isUpdatingProfile };
}

export default useUserUpdateProfile