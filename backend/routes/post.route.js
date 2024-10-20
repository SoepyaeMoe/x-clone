import { Router } from "express";
import { commentOnPost, createPost, deletePost, followingPosts, getAllPosts, getLikedPosts, getUserPosts, likeUnlikePost } from "../controllers/post.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
const router = Router();

router.get('/all', protectRoute, getAllPosts);
router.get('/likes/:username', protectRoute, getLikedPosts);
router.get('/following', protectRoute, followingPosts);
router.get('/user/:username', protectRoute, getUserPosts);
router.post('/', protectRoute, createPost);
router.delete('/:postId', protectRoute, deletePost);
router.post('/comment/:postId', protectRoute, commentOnPost);
router.post('/like/:postId', protectRoute, likeUnlikePost);

export default router;