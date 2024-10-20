import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from '@tanstack/react-query';
import { useEffect } from "react";

const Posts = ({ feedType, username }) => {

    const getEndPoint = () => {
        switch (feedType) {
            case 'forYou':
                return '/api/posts/all';
            case 'following':
                return '/api/posts/following';
            case 'posts':
                return `/api/posts/user/${username}`;
            case 'likes':
                return `/api/posts/likes/${username}`
            default:
                return '/api/posts/all';
        }
    }

    const END_POINT = getEndPoint();

    const { isPending, data: POSTS, refetch, isRefetching } = useQuery({
        queryKey: ['posts'],
        queryFn: async () => {
            try {
                const res = await fetch(END_POINT);
                const data = await res.json();
                return data;
            } catch (error) {
                throw new Error(error.message || 'Something went wroung')
            }
        }
    });

    useEffect(() => {
        refetch();
    }, [feedType, refetch, username])

    return (
        <>
            {isPending || isRefetching && (
                <div className='flex flex-col justify-center'>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            )}
            {!isPending && !isRefetching && POSTS?.length === 0 && <p className='text-center my-4'>No posts in this tab. Switch 👻</p>}
            {!isPending && !isRefetching && POSTS && (
                <div>
                    {POSTS.map((post) => (
                        <Post key={post._id} post={post} />
                    ))}
                </div>
            )}
        </>
    );
};
export default Posts;