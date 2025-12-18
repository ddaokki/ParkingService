# ParkingService

## 👥 팀 구성 및 역할

| 이름 | 역할 |
|---|---|
| 서정민 (ddaokki) | 풀스택 개발 |
| 박재석 (paksak4) | 백엔드 개발 |
| 안형주 (gudwn97) | 데이터 수집·정제, DB 관리 |
| 안준현 (Propeex) | 프론트엔드 개발 |

---

## 🚗 자리차지 (Spot Charge)
**서울시 주차장 통합 정보 서비스**

서울시 공공데이터를 기반으로  
주차장 및 전기차 충전소 정보를 통합 제공하는  
**웹·모바일 멀티플랫폼 주차 정보 서비스**입니다.

---

## 📌 프로젝트 개요

**자리차지(Spot Charge)**는  
서울시 내 분산되어 있는 주차장 및 전기차 충전소 정보를 하나의 플랫폼으로 통합하여,  
사용자가 **위치·요금·운영 조건을 고려한 최적의 주차 선택**을 할 수 있도록 돕는 서비스입니다.

---

## 🛠 기술 스택

### Frontend (Web)
- React  
- Tailwind CSS  
- Axios  
- Kakao Map API  
- AWS S3 Static Hosting  

### Frontend (Mobile)
- React Native (Expo)  
- TypeScript  
- expo-router  
- AsyncStorage  
- Kakao Map API  

### Backend
- Node.js / Express  
- RESTful API  
- MongoDB → MongoDB Atlas  
- JWT Authentication  

### Cloud / DevOps
- AWS S3 (정적 웹 호스팅)  
- AWS API Gateway  
- AWS Lambda  
- CloudFront (CDN)  

---

## ✨ 주요 기능

### 📍 위치 기반 주차장 조회
- 사용자 현재 위치 기반 주차장 목록 제공  
- 지도 및 리스트 UI 동시 제공  

### 🔍 검색 · 정렬 · 필터
- 이름 / 주소 기반 검색  
- 거리순 / 기본요금순 / 추가요금순 정렬  
- 무료 / 유료, 전기차 충전 가능 여부 필터링  

### ⭐ 즐겨찾기 기능
- 로그인 사용자별 즐겨찾기 관리  
- 서버(DB)와 실시간 동기화  

### 🔐 사용자 인증
- JWT 기반 로그인 / 회원가입  
- 웹(LocalStorage) 및 모바일(AsyncStorage) 환경별 인증 유지  

---

## 📱 모바일 앱의 차별점
- 실제 단말 GPS를 활용한 정확한 위치 기반 서비스  
- 모바일 저장소 기반 로그인 상태 유지  
- 터치 UI에 최적화된 카드·지도 인터페이스  
- 웹과 동일한 API를 사용한 멀티플랫폼 구조  

---

## ☁ AWS 배포 구성

### Web 배포
- React 빌드 결과물을 **AWS S3 정적 웹 호스팅**으로 배포  
- 퍼블릭 접근 가능 URL 제공  
- CloudFront 연동을 통한 CDN 확장 가능  

### Backend 연동
- API Gateway + Lambda 기반 서버리스 API  
- 모바일 / 웹에서 동일한 엔드포인트 사용  

---

## ▶ 실행 방법

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend 
```bash
cd frontend
npm install
npm run build
```

### Moblie App
```bash
cd mobile
npm install
npx expo start
```

---
