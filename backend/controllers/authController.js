// backend/controllers/authController.js
import * as authService from '../services/authService.js';
import * as favoriteService from '../services/favoriteService.js';
import * as reviewService from '../services/reviewService.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const JWT_EXPIRES_IN = '7d';

// 공통 토큰 생성 함수
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: '아이디와 비밀번호는 필수입니다.' });
    }

    const result = await authService.registerUser(username, password);

    const token = generateToken(result.user);

    // { user: {id, username}, token } 형태로 응답
    res.status(201).json({
      ...result,
      token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: '아이디와 비밀번호를 입력해주세요.' });
    }

    const result = await authService.loginUser(username, password);

    const token = generateToken(result.user);

    // { user: {id, username}, token } 형태로 응답
    res.status(200).json({
      ...result,
      token,
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// GET /api/auth/profile/:userId
export const getMyProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const tokenUserId = req.user?.id;

    if (!tokenUserId) {
      return res.status(401).json({ message: '인증 정보가 없습니다.' });
    }

    // URL에 들어온 userId와 토큰의 userId가 다르면 접근 불가
    if (userId && tokenUserId !== userId) {
      return res
        .status(403)
        .json({ message: '다른 사용자의 정보에는 접근할 수 없습니다.' });
    }

    const targetUserId = tokenUserId;

    const user = await User.findById(targetUserId).select('-password');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const favoritesPromise =
      favoriteService.getFavoritesByUserId(targetUserId);
    const reviewsPromise = reviewService.getReviewsByUserId(targetUserId);

    const [favorites, reviews] = await Promise.all([
      favoritesPromise,
      reviewsPromise,
    ]);

    res.status(200).json({
      id: user._id,
      username: user.username,
      favorites,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: '서버 오류: ' + error.message });
  }
};
