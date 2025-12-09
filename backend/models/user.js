// backend/models/user.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // [수정] 'email' -> 'username'
  username: {
    type: String,
    required: [true, '아이디는 필수입니다.'], // '이메일' -> '아이디'
    unique: true,
    trim: true,
    lowercase: true, // ID도 소문자로 통일하는 것이 좋음
  },
  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다.'],
  },
}, {
  timestamps: true
});

// [수정] 단순 비밀번호 비교
userSchema.methods.comparePassword = async function (candidatePassword) {
  return this.password === candidatePassword;
};


const User = mongoose.model('User', userSchema);
export default User;