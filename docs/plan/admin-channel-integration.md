# AI OTT Admin — Channel Management Integration Guide

> ai-ott-admin 프론트엔드에서 Channel 관리 기능을 연동하기 위한 가이드
> API Base URL: http://localhost:8080 (local)
> 관련 API 문서: ../api-spec.md (Section 30)

---

## Part 1: 채널 관리 페이지

### 1.1 채널 목록 및 관리

#### 라우트

```
/admin/channels      → 채널 목록
```

#### API 호출

```typescript
// 채널 목록
GET /api/admin/channels?limit=50
Authorization: Bearer <admin-jwt>

// Response 200
[
  {
    "id": "uuid",
    "handle": "official",
    "name": "AI OTT Official",
    "profileImageUrl": null,
    "isOfficial": true,
    "subscriberCount": 0,
    "status": "ACTIVE"         // ACTIVE | SUSPENDED
  }
]

// 채널 정지/활성화
PATCH /api/admin/channels/{id}/status?status=SUSPENDED
Authorization: Bearer <admin-jwt>

// Response 200
{ "message": "updated" }
```

#### UI 구성

```
┌──────────────────────────────────────────────────┐
│ 채널 관리                                         │
├──────────────────────────────────────────────────┤
│ Handle      | 이름              | 구독자 | 상태   | 액션     │
│ @official   | AI OTT Official   | 0     | ACTIVE | [정지]   │
│ @user-abc   | 크리에이터 채널    | 42    | ACTIVE | [정지]   │
│ @user-def   | 나쁜 채널         | 5     | SUSPENDED | [활성화] │
└──────────────────────────────────────────────────┘
```

#### 구현 체크리스트

- [x] 채널 관리 라우트 추가
- [x] 채널 목록 테이블 (handle, 이름, 구독자수, 상태)
- [x] `isOfficial === true` 뱃지 표시
- [x] 채널 정지/활성화 토글 버튼
- [x] 정지 시 확인 다이얼로그
- [x] 사이드바 네비게이션에 "채널 관리" 메뉴 추가

---

### 1.2 기존 콘텐츠 관리에 채널 정보 표시

기존 Admin 콘텐츠 목록/상세에 채널 정보를 추가로 표시.

> **TODO (서버):** AdminContentSummary, AdminContentDetail에 channelName, channelHandle 필드 추가 필요.

#### 구현 체크리스트

- [ ] (서버 수정 후) 콘텐츠 목록에 채널명 컬럼 추가
- [ ] (서버 수정 후) 콘텐츠 상세에 채널 정보 표시
- [ ] 채널명 클릭 → 채널 관리 상세로 이동

---

## Part 2: 공통 참고사항

### 2.1 인증 (Admin JWT)

모든 Admin API는 JWT 필수:

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

JWT는 기존 로그인 API(`POST /auth/login`)에서 받은 `accessToken` 사용.

### 2.2 에러 응답 형식

```typescript
// 400 Bad Request
{ "error": "IllegalArgumentException", "message": "Channel not found: unknown-handle" }

// 403 Forbidden (소유권 검증 실패)
{ "error": "SecurityException", "message": "Not the owner of this content" }

// 401 Unauthorized (JWT 없거나 만료)
{ "error": "SecurityException", "message": "Not authenticated" }
```

### 2.3 Content Status 값

| Status | 의미 | 시청자 노출 |
|--------|------|------------|
| `DRAFT` | 작성 중 | X |
| `PUBLISHED` | 공개됨 | O |
| `UNLISTED` | 비공개 (URL 직접 접근만 가능) | 제한적 |
| `ARCHIVED` | 삭제됨 (소프트 삭제) | X |

### 2.4 Video Asset Status 값

| Status | 의미 | UI 표시 |
|--------|------|---------|
| `null` | 비디오 미첨부 | "비디오 업로드 필요" |
| `UPLOADED` | 업로드 완료, 트랜스코딩 대기 | 스피너 |
| `TRANSCODING` | 트랜스코딩 진행 중 | 프로그레스 바 |
| `READY` | 재생 가능 | 재생 아이콘 |
| `FAILED` | 트랜스코딩 실패 | 에러 아이콘 + 재시도 버튼 |

### 2.5 Channel Status 값

| Status | 의미 |
|--------|------|
| `ACTIVE` | 활성 상태 |
| `SUSPENDED` | 관리자에 의해 정지됨 |

---

## Part 3: 서버 추가 작업 필요 목록 (어드민 관련 TODO)

프론트엔드 완전 통합을 위해 서버에서 추가로 필요한 작업:

| # | 내용 | 우선순위 |
|---|------|---------|
| 1 | AdminContentSummary에 channelName 추가 | 중간 |
| 2 | 기존 Admin 업로드(UnifiedUploadService)에 channel_id 통합 (Task 8) | 중간 |
