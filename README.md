# 🥋 도장 매니저 (Dojang Manager)

무도관(태권도·유도·검도 등) 전용 **통합 운영 관리 플랫폼**입니다.  
MAS9, MyStudio, Spark Membership을 벤치마킹하여 국내 도장 환경에 맞게 설계했습니다.

---

## 목차

1. [기술 스택](#기술-스택)
2. [프로젝트 구조](#프로젝트-구조)
3. [기능 모듈](#기능-모듈)
4. [API 엔드포인트](#api-엔드포인트)
5. [DB 모델](#db-모델)
6. [환경 변수 설정](#환경-변수-설정)
7. [로컬 실행 방법](#로컬-실행-방법)
8. [초기 데이터 세팅](#초기-데이터-세팅)
9. [향후 개발 계획](#향후-개발-계획)

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **프레임워크** | Next.js 14 (App Router) |
| **언어** | TypeScript |
| **데이터베이스** | MongoDB + Mongoose |
| **인증** | NextAuth.js v5 (Credentials Provider, JWT) |
| **UI** | Tailwind CSS + shadcn/ui (Radix UI) |
| **차트** | Recharts |
| **이메일** | Nodemailer |
| **엑셀** | xlsx (SheetJS) |
| **QR코드** | qrcode + BarcodeDetector API |
| **전자서명** | signature_pad |
| **알림 토스트** | Sonner |
| **아이콘** | Lucide React |

---

## 프로젝트 구조

```
dojang-manager/
├── src/
│   ├── app/                        # Next.js App Router 페이지
│   │   ├── page.tsx                # 대시보드 (메인)
│   │   ├── login/                  # 로그인 페이지
│   │   ├── members/                # 회원 관리
│   │   ├── attendance/             # 출결 관리
│   │   │   └── qr-scan/           # QR 체크인 페이지
│   │   ├── tuition/                # 수강료 관리
│   │   ├── belt-rank/              # 승급 관리
│   │   ├── inventory/              # 재고 관리
│   │   ├── contracts/              # 계약서
│   │   │   └── [id]/              # 계약서 상세 (서명/PDF)
│   │   ├── after-school/           # 방과후
│   │   ├── events/                 # 이벤트
│   │   ├── online-classes/         # 온라인 수업
│   │   ├── reports/                # 리포트
│   │   ├── crm/                    # CRM / 리드 관리
│   │   └── api/                    # REST API 라우트
│   │       ├── auth/              # NextAuth 핸들러 + 회원가입
│   │       ├── members/           # 회원 CRUD
│   │       ├── attendance/        # 출결 CRUD + QR + 통계
│   │       ├── tuition/           # 수강료 CRUD
│   │       ├── belt-rank/         # 승급 CRUD + 자동승급
│   │       ├── inventory/         # 재고 CRUD
│   │       ├── contracts/         # 계약서 CRUD
│   │       ├── events/            # 이벤트 CRUD
│   │       ├── online-classes/    # 온라인수업 CRUD
│   │       ├── after-school/      # 방과후 CRUD
│   │       ├── leads/             # CRM 리드 CRUD
│   │       ├── reports/           # 통계 조회 + 엑셀 다운로드
│   │       ├── email/             # 이메일 발송
│   │       └── seed/              # 초기 데이터 세팅
│   │
│   ├── components/
│   │   ├── shared/                # 공통 레이아웃 컴포넌트
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── DashboardCharts.tsx # Recharts 대시보드 차트
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MemberQRCode.tsx   # QR코드 생성/출력
│   │   │   ├── SignaturePad.tsx   # 전자서명 캔버스
│   │   │   └── SessionProvider.tsx
│   │   └── ui/                    # shadcn/ui 컴포넌트
│   │
│   └── lib/
│       ├── auth.ts                # NextAuth 전체 설정 (DB 포함)
│       ├── auth.config.ts         # Edge 호환 auth 설정 (미들웨어용)
│       ├── utils.ts               # cn() 유틸리티
│       ├── db/
│       │   ├── connect.ts         # MongoDB 연결 (싱글톤)
│       │   └── models/            # Mongoose 스키마/모델 (10개)
│       ├── email/
│       │   └── service.ts         # Nodemailer 이메일 서비스
│       └── payment/
│           └── interface.ts       # 결제 모듈 추상화 인터페이스
│
├── middleware.ts                   # 인증 미들웨어 (라우트 보호)
├── .env.local                     # 환경 변수
├── tailwind.config.ts
├── next.config.mjs
└── components.json                # shadcn/ui 설정
```

---

## 기능 모듈

### 🏠 대시보드
- 전체 회원 / 오늘 출석 / 미납 수강료 / 예정 이벤트 요약 카드
- 전월 대비 회원 증감률 뱃지
- **월별 출석 / 수입 / 신규회원 6개월 추이 차트** (Recharts, Area + Bar)
- 빠른 액션 버튼 (회원 등록, 출결 체크, 수강료 등록, 승급 심사)
- 다가오는 이벤트 목록
- 최근 가입 회원 목록
- 수강료 연체 알림 배너

### 🎯 CRM / 리드 관리 _(Spark Membership 벤치마킹)_
- **칸반 보드** 뷰: 신규 → 연락완료 → 체험중 → 회원전환 → 이탈
- **목록** 뷰: 테이블 형식
- 유입경로 관리: 방문 / 소개 / SNS / 웹사이트 / 이벤트 / 기타
- 체험 날짜 / 팔로업 날짜 설정
- 전환율 통계 자동 계산
- 단계 이동 빠른 버튼 ("다음 →")

### 👥 회원 관리
- 회원 정보 CRUD (이름, 이메일, 연락처, 생년월일, 주소)
- 역할 구분: 관리자 / 강사 / 회원 / 학생
- 상태 관리: 활성 / 비활성 / 대기
- 벨트 등급 관리 (흰띠 ~ 검정띠)
- **회원별 QR 코드 생성 및 이미지 다운로드**
- 검색 / 역할별 필터
- 스켈레톤 로딩 / 행별 아바타 + 이니셜

### 📅 출결 관리
- 수동 출결 등록 (출석 / 결석 / 지각 / 공결)
- **QR 코드 체크인** (카메라 스캔 → 자동 출결, BarcodeDetector API)
  - 중복 체크 방지 (당일 동일 회원 재처리 방지)
- 날짜 범위 필터
- 출석 통계 요약 카드
- 출결 상태 변경

### 💰 수강료 관리
- 수강료 등록 / 납부 처리 / 연체 자동 전환
- 상태 관리: 미납 / 납부완료 / 연체 / 취소
- **연체 회원 일괄 이메일 알림 발송**
- 월별 요약 통계 (납부 / 미납 / 연체 / 이번달 수입)

### 🥋 승급 관리
- 심사 기록 탭: 승급 심사 등록, 합격/불합격 처리
- **자동 승급 탭**: 출석 횟수 + 재적 기간 기준으로 승급 가능 여부 자동 판단
  - 벨트별 기준 (예: 흰띠 → 출석 20회 / 30일 이상)
  - 조건 충족 시 "승급 처리" 버튼 원클릭 처리

### 📋 계약서
- 계약서 작성 / 상태 관리 (초안 / 서명대기 / 서명완료 / 만료)
- **계약서 상세 페이지**: 계약 내용 + 당사자 정보 통합 뷰
- **전자서명 캔버스** (signature_pad, 서명 이미지 DB 저장)
- **PDF 출력** (브라우저 인쇄 → PDF 저장)
- 30일 이내 만료 예정 계약 알림

### 📦 재고 관리
- 품목 등록 / 수량 조정 (입고/출고)
- 최소 수량 설정 및 부족 알림
- 카테고리별 관리

### 🎓 방과후
- 프로그램 등록 / 수강생 연결
- 일정 관리 (요일 / 시간대)

### 🎉 이벤트
- 이벤트 공지 등록 (대회 / 세미나 / 심사 / 행사)
- 참가자 / 참가비 / 장소 관리
- **전체 회원 이메일 공지 발송**

### 💻 온라인 수업
- 온라인 강의 링크 및 일정 관리 (Zoom 등 외부 플랫폼)
- 수업 링크 복사 기능

### 📊 리포트
- **연간 통계 차트** (Recharts)
  - 월별 출결 현황 (Bar 차트, 출석/지각/결석 3색)
  - 월별 수강료 수입 (Area 차트)
  - 역할별 회원 분포 (Donut Pie 차트 + 진행 바)
  - 벨트 분포 (Donut Pie 차트)
- **엑셀 다운로드** (xlsx): 회원 목록 / 출결 기록 / 수강료 현황 / 승급 기록
- 연도 선택 필터

---

## API 엔드포인트

### 인증
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/auth/register` | 회원 가입 |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth 핸들러 |

### 회원
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/members` | 목록 조회 (검색, 역할 필터) |
| `POST` | `/api/members` | 회원 등록 |
| `GET` | `/api/members/:id` | 단건 조회 |
| `PATCH` | `/api/members/:id` | 정보 수정 |
| `DELETE` | `/api/members/:id` | 삭제 |

### 출결
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/attendance` | 목록 조회 (날짜 필터) |
| `POST` | `/api/attendance` | 출결 등록 |
| `PATCH` | `/api/attendance/:id` | 상태 수정 |
| `DELETE` | `/api/attendance/:id` | 삭제 |
| `POST` | `/api/attendance/qr` | **QR 체크인** (인증 없이 접근 가능) |
| `GET` | `/api/attendance/stats` | 기간별 통계 |

### 수강료
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/tuition` | 목록 조회 (상태 필터) |
| `POST` | `/api/tuition` | 등록 |
| `PATCH` | `/api/tuition/:id` | 상태/금액 수정 |
| `DELETE` | `/api/tuition/:id` | 삭제 |

### 승급
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/belt-rank` | 심사 기록 조회 |
| `POST` | `/api/belt-rank` | 심사 등록 |
| `PATCH` | `/api/belt-rank/:id` | 결과 수정 (합격 시 회원 벨트 자동 업데이트) |
| `GET` | `/api/belt-rank/auto-promote` | 자동 승급 대상 조회 |
| `POST` | `/api/belt-rank/auto-promote` | 자동 승급 처리 |

### CRM / 리드
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/leads` | 목록 + 상태별 통계 |
| `POST` | `/api/leads` | 리드 등록 |
| `PATCH` | `/api/leads/:id` | 상태/정보 수정 |
| `DELETE` | `/api/leads/:id` | 삭제 |

### 계약서
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/contracts` | 목록 조회 |
| `POST` | `/api/contracts` | 계약서 등록 |
| `GET` | `/api/contracts/:id` | 단건 조회 |
| `PATCH` | `/api/contracts/:id` | 수정 (서명 데이터 포함) |
| `DELETE` | `/api/contracts/:id` | 삭제 |

### 이메일
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/email` | 이메일 발송 (type: `overdue` / `contract_expiry` / `event` / `single`) |

### 리포트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/reports?year=2025` | 연간 통계 데이터 |
| `GET` | `/api/reports/download?type=members` | 엑셀 다운로드 (members / attendance / tuition / belt) |

### 기타
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET/POST` | `/api/inventory` | 재고 CRUD |
| `PATCH` | `/api/inventory/:id` | 수량 조정 (입고/출고) |
| `GET/POST` | `/api/events` | 이벤트 CRUD |
| `GET/POST` | `/api/online-classes` | 온라인수업 CRUD |
| `GET/POST` | `/api/after-school` | 방과후 CRUD |
| `POST` | `/api/seed` | 초기 데이터 생성 (개발용) |

---

## DB 모델

| 모델 | 파일 | 주요 필드 |
|------|------|-----------|
| `User` | `models/User.ts` | name, email, password(bcrypt), role, belt, beltLevel, status |
| `Attendance` | `models/Attendance.ts` | userId, classType, date, status(present/absent/late/excused), method(manual/qr) |
| `Tuition` | `models/Tuition.ts` | userId, amount, dueDate, status(pending/paid/overdue/cancelled), paidAt |
| `BeltRank` | `models/BeltRank.ts` | userId, belt, beltLevel, examDate, examResult(pass/fail/pending) |
| `Contract` | `models/Contract.ts` | userId, title, terms, startDate, endDate, amount, status, signatureData(base64) |
| `InventoryItem` | `models/InventoryItem.ts` | name, category, quantity, minQuantity, price |
| `Event` | `models/Event.ts` | title, type, date, location, maxParticipants, fee, status |
| `OnlineClass` | `models/OnlineClass.ts` | title, instructor, platform, meetingUrl, scheduledAt |
| `AfterSchool` | `models/AfterSchool.ts` | studentId, programName, schedule, startDate, endDate |
| `Lead` | `models/Lead.ts` | name, email, phone, source, status, trialDate, followUpDate |

### 역할(Role) 정의
| 값 | 설명 |
|----|------|
| `admin` | 전체 기능 접근 가능 |
| `instructor` | 강사 (출결, 수업 관리) |
| `member` | 일반 회원 |
| `student` | 학생 (방과후 등) |

---

## 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하세요.

```env
# ✅ 필수
MONGODB_URI=mongodb://localhost:27017/dojang-manager
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# 📧 이메일 알림 (선택, Gmail 사용 시 앱 비밀번호 필요)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="도장 매니저" <your-email@gmail.com>
```

> **Gmail 앱 비밀번호 발급**: Google 계정 → 보안 → 2단계 인증 활성화 → 앱 비밀번호 생성

---

## 로컬 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. MongoDB 실행
```bash
# Homebrew로 설치된 경우
brew services start mongodb-community

# 직접 실행
mongod --dbpath /usr/local/var/mongodb
```

### 3. 환경 변수 설정
`.env.local` 파일 생성 후 위 값 입력

### 4. 개발 서버 실행
```bash
npm run dev
# 포트 지정 시
npm run dev -- -p 3001
```

### 5. 브라우저 접속
```
http://localhost:3000
```

---

## 초기 데이터 세팅

개발 환경에서 테스트용 계정과 샘플 데이터를 생성합니다.

```bash
curl -X POST http://localhost:3000/api/seed
```

생성되는 계정:

| 이메일 | 비밀번호 | 역할 |
|--------|----------|------|
| `admin@dojang.com` | `admin1234` | 관리자 |
| `instructor@dojang.com` | `inst1234` | 강사 |
| `member@dojang.com` | `member1234` | 회원 |

> ⚠️ seed API는 `NODE_ENV=production` 환경에서 비활성화됩니다.

---

## 향후 개발 계획

### 결제 모듈 (Phase 2)
- `src/lib/payment/interface.ts`에 추상화 인터페이스 준비 완료
- Stripe 또는 토스페이먼츠 연동 예정
- 정기결제(구독) 지원

### 추가 예정 기능
- [ ] 모바일 앱 (React Native 또는 PWA)
- [ ] 문자(SMS) 알림 (Twilio 또는 알리고)
- [ ] Zoom API 직접 연동 (회의 자동 생성)
- [ ] 회원 셀프 포털 (출결 확인, 수강료 납부)
- [ ] 전자서명 외부 서비스 연동 (DocuSign 등)
- [ ] 대용량 회원 데이터 페이지네이션
- [ ] 다국어 지원 (영어)
- [ ] 다크모드

---

## 라이선스

Private — 무단 배포 및 상업적 사용 금지
