// backend/services/authService.js
import User from '../models/user.js';
import bcrypt from 'bcryptjs';

/**
 * 사용자 회원가입 (username, password)
 */
export const registerUser = async (username, password) => {
  // 이미 존재하는 아이디인지 확인
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error('이미 사용 중인 아이디입니다.');
  }

  // 비밀번호 해시 처리
  const saltRounds = 10; // 개발용으로 10 정도면 충분
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    password: hashedPassword, // 평문 대신 해시 저장
  });

  await user.save();
  
  return { 
    user: { 
      id: user._id, 
      username: user.username,
    }, 
  };
};

/**
 * 사용자 로그인 (username, password)
 */
export const loginUser = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('아이디 또는 비밀번호가 유효하지 않습니다.');
  }

  // 입력한 비밀번호 vs DB에 저장된 해시 비교
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('아이디 또는 비밀번호가 유효하지 않습니다.');
  }
  
  return { 
    user: { 
      id: user._id, 
      username: user.username,
    }, 
  };
};
