# 코드베이스 분석 - 선물 추첨 앱

## 프로젝트 개요

이 프로젝트는 공정한 랜덤 추첨을 위한 웹 애플리케이션입니다. 사용자가 참가자 명단을 입력하고 랜덤하게 당첨자를 선정할 수 있는 기능을 제공합니다.

## 기술 스택

### 프론트엔드

- **React 18** + **TypeScript** - 메인 UI 프레임워크
- **Vite** - 빌드 도구 및 개발 서버
- **Wouter** - 경량 라우팅 라이브러리
- **TanStack Query** - 서버 상태 관리
- **Framer Motion** - 애니메이션 라이브러리
- **Tailwind CSS** - 스타일링
- **Radix UI** - 접근성 좋은 UI 컴포넌트
- **Shadcn/ui** - 사전 구성된 UI 컴포넌트

### 백엔드

- **Express.js** - 웹 서버 프레임워크
- **TypeScript** - 타입 안전성
- **Express Session** - 세션 관리
- **Drizzle ORM** - 데이터베이스 ORM
- **PostgreSQL** - 데이터베이스 (설정됨, 현재는 메모리 스토리지 사용)
- **Zod** - 스키마 검증

## 프로젝트 구조

```
├── client/                 # 프론트엔드 코드
│   ├── src/
│   │   ├── components/ui/  # Shadcn/ui 컴포넌트
│   │   ├── hooks/         # 커스텀 React 훅
│   │   ├── lib/           # 유틸리티 및 설정
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── App.tsx        # 메인 앱 컴포넌트
│   │   └── main.tsx       # 앱 진입점
├── server/                # 백엔드 코드
│   ├── index.ts          # 서버 진입점
│   ├── routes.ts         # API 라우트
│   ├── storage.ts        # 데이터 스토리지 인터페이스
│   └── vite.ts           # Vite 개발 서버 설정
├── shared/               # 공유 코드
│   └── schema.ts         # 데이터베이스 스키마 및 타입
└── 설정 파일들...
```

## 주요 기능

### 1. 참가자 관리

- 텍스트 영역에 참가자 이름을 한 줄씩 입력
- 실시간 참가자 수 표시
- 참가자 명단 섞기 기능
- 참가자 목록 초기화

### 2. 추첨 시스템

- 공정한 랜덤 추첨 (JavaScript Math.random() 사용)
- 애니메이션이 포함된 추첨 휠
- 중복 당첨 방지 옵션
- 추첨 과정 시각화 (로딩 애니메이션)

### 3. 결과 표시

- 당첨자 발표 애니메이션
- 축하 메시지 및 컨페티 효과
- 다시 추첨 / 새 추첨 옵션

### 4. 추첨 기록

- 세션별 추첨 기록 저장
- 당첨자, 참가자 수, 시간 기록
- 기록 삭제 기능

## 데이터 모델

### DrawRecord

```typescript
{
  id: string;              // 고유 ID
  sessionId: string;       // 세션 ID
  winner: string;          // 당첨자 이름
  totalParticipants: number; // 총 참가자 수
  participants: string[];   // 참가자 목록
  timestamp: Date;         // 추첨 시간
}
```

## API 엔드포인트

- `GET /api/draw-history` - 현재 세션의 추첨 기록 조회
- `POST /api/draw-record` - 새 추첨 기록 저장
- `DELETE /api/draw-history` - 현재 세션의 추첨 기록 삭제

## 현재 상태

### 구현된 기능

✅ 기본 추첨 기능
✅ 참가자 관리
✅ 추첨 기록 저장/조회
✅ 세션 관리
✅ 반응형 UI
✅ 애니메이션 효과
✅ 중복 당첨 방지

### 기술적 특징

- **메모리 스토리지**: 현재 PostgreSQL 대신 메모리 기반 스토리지 사용
- **세션 기반**: 각 브라우저 세션별로 독립적인 추첨 기록
- **타입 안전성**: TypeScript로 전체 코드베이스 타입 보장
- **모던 React**: 함수형 컴포넌트, 훅, 컨텍스트 API 활용
- **접근성**: Radix UI 기반으로 접근성 고려

## 개발 환경

- **개발 서버**: Vite 개발 서버 (HMR 지원)
- **빌드**: Vite + esbuild
- **타입 체크**: TypeScript 컴파일러
- **스타일링**: Tailwind CSS + PostCSS
- **패키지 관리**: npm

## 배포 설정

- **포트**: 환경변수 PORT 또는 기본값 5000
- **정적 파일**: 프로덕션에서 Express가 정적 파일 서빙
- **세션**: Express Session (메모리 스토어)

## 잠재적 개선 사항

1. PostgreSQL 데이터베이스 연결 활성화
2. 사용자 인증 시스템
3. 추첨 결과 내보내기 기능
4. 다중 추첨 모드 (여러 명 동시 선정)
5. 추첨 설정 저장/불러오기
6. 실시간 협업 기능
