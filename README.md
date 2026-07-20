# 디지털 윤리 이야기 만들기

픽사식 이야기 구조(발단·전개·위기·절정·결말, 9단계)로 학생들이 디지털 윤리 주제의
짧은 이야기를 글+그림으로 만드는 앱입니다. 관리자(교사)는 학생 계정을 만들고,
학생들이 저장한 이야기를 실시간으로 확인할 수 있습니다.

## 폴더 구조

```
/api/index.js       ← 모든 API 라우트가 들어있는 Express 앱 (Vercel 서버리스 함수 1개로 통합)
/client              ← React + Vite 프론트엔드 (학생 화면 + 관리자 화면)
/vercel.json          ← /api/* 요청을 api/index.js 로 라우팅
```

studentconference와 같은 패턴(React/Vite + Express + Vercel KV, 함수 1개로 통합)입니다.

## 1. 준비물

- GitHub 저장소
- Vercel 계정 + Vercel KV(스토리지) 연결
- 관리자 비밀번호 하나 정하기

## 2. 배포 단계

1. 이 폴더를 GitHub 저장소에 업로드 (studentconference 때처럼 GitHub 웹 UI로 업로드해도 OK)
2. Vercel에서 이 저장소를 Import
3. Vercel 프로젝트 → Storage 탭 → **KV** 생성 후 프로젝트에 Connect
   (연결하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 등 환경변수가 자동으로 추가됨)
4. Vercel 프로젝트 → Settings → Environment Variables 에 추가:
   - `ADMIN_PASSWORD` = 원하는 관리자 비밀번호
5. **Build & Development Settings**
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - (api 폴더는 루트에 있어야 하므로 Root Directory를 `client`로 바꾸면 Vercel이 자동으로
     리포지토리 루트의 `/api`도 함께 인식합니다. 만약 인식하지 않으면 Root Directory를
     비워두고 `vercel.json`에 `"buildCommand": "cd client && npm install && npm run build",
     "outputDirectory": "client/dist"` 를 추가해주세요.)
6. Deploy

배포 후:
- 학생 화면: `https://your-app.vercel.app/`
- 관리자 화면: `https://your-app.vercel.app/admin`

## 3. 사용 흐름

**교사(관리자)**
1. `/admin` 접속 → 관리자 비밀번호로 로그인
2. "학생 계정 추가"로 한 명씩, 또는 "엑셀로 일괄 추가"로 여러 명 한번에 생성
   - 엑셀 첫 줄(제목행)은 `이름 / 모둠 / 아이디 / 비밀번호` 로 해주세요 (제공된 템플릿 참고)
   - 아이디·비밀번호 칸을 비워두면 자동으로 만들어져요
   - 업로드하면 만들기 전에 미리보기에서 내용을 고칠 수 있어요
3. 학생에게 아이디/비밀번호 전달
4. 대시보드에서 학생별 진행률(9칸 중 몇 칸) 실시간 확인
5. 학생 이름 클릭 → 9단계 글+그림 전체 보기, 장면별 통과 처리, 코멘트 남기기

**학생**
1. `/` 접속 → 아이디/비밀번호 로그인
2. 디지털 윤리 주제 8개 중 하나 선택 (한 번 정하면 고정)
3. 주인공 이름/특징 입력 (선택)
4. 9단계 스토리보드 작성 — 각 단계마다 간단한 그림(캔버스) + 글
5. "저장하고 다음"으로 진행, 언제든 다시 로그인해 이어서 작성 가능 (제출 개념 없음)

## 4. 로컬 개발

```bash
npm install               # 루트 (api 의존성)
cd client && npm install  # 클라이언트 의존성

# Vercel KV를 로컬에서 쓰려면 Vercel CLI 로 환경변수를 받아오는 게 가장 쉬움
npm i -g vercel
vercel link
vercel env pull .env.development.local
vercel dev
```

`vercel dev`가 `/api`와 `/client`를 함께 띄워줍니다 (포트는 CLI 안내를 따르세요).

## 5. 커스터마이징 포인트

- 주제 카테고리 8개, 9단계 안내 질문: `client/src/constants.js`
- 색상/폰트 등 디자인 토큰: `client/src/styles/global.css`
- 관리자 비밀번호: Vercel 환경변수 `ADMIN_PASSWORD`
