// backend/controllers/authController.js
import * as authService from '../services/authService.js';
import * as favoriteService from '../services/favoriteService.js';
import * as reviewService from '../services/reviewService.js';
import User from '../models/user.js';

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    // [수정]
    const { username, password } = req.body; 
    if (!username || !password) { // 'email' -> 'username'
      return res.status(400).json({ message: '아이디와 비밀번호는 필수입니다.' }); // '이메일' -> '아이디'
    }
    // [수정]
    const result = await authService.registerUser(username, password); 
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    // [수정]
    const { username, password } = req.body; 
    if (!username || !password) { // 'email' -> 'username'
      return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' }); // '이메일' -> '아이디'
    }
    // [수정]
    const result = await authService.loginUser(username, password); 
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// GET /api/auth/profile/:userId
export const getMyProfile = async (req, res) => {
  try {
    const { userId } = req.params; 

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const favoritesPromise = favoriteService.getFavoritesByUserId(userId);
    const reviewsPromise = reviewService.getReviewsByUserId(userId);

    const [favorites, reviews] = await Promise.all([
      favoritesPromise,
      reviewsPromise
    ]);

    res.status(200).json({
      id: user._id,
      username: user.username, // [수정] 'email' -> 'username'
      favorites: favorites,
      reviews: reviews,
    });

  } catch (error) {
    res.status(500).json({ message: '서버 오류: ' + error.message });
  }
};