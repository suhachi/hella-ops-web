# HELLA OPS 업무관리사이트 (Hella-Ops-Web)

## 🇰🇷 프로젝트 개요
본 프로젝트는 **HELLA Company**의 현장 업무를 효율적으로 관리하기 위한 통합 운영 시스템입니다. "Zero Trust" 보안 원칙과 서버 중심의 상태 관리를 통해 데이터 무결성을 보장합니다.

## 🚨 핵심 원칙 (SSOT)
- **AGENTS.md**: 에이전트 행동 지침 및 하드 제어 규칙
- **firestore.rules**: 초정밀 필드 단위 보안 규칙
- **docs/**: 프로젝트 기획, UI/UX 매핑, 백엔드 상태 정의서 등 상세 설계 정보

## 🛠 기술 스택
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Zustand
- **Backend**: Firebase (Auth, Firestore, Functions, Hosting)

## 🎨 브랜드 자산 (Brand Assets)
- **공식 로고**: `hella.png`
- **참조 위치**: `public/hella.png` (Vite/React 정적 참조 대응)
- **적용 예정 영역**:
    - 로그인 화면 (`/login`)
    - 관리자 대시보드 (`/admin/*`)
    - 사원 모바일 웹 홈 (`/m/*`)
    - 생성된 업무 기록 PDF 문서

## 📂 저장소 구조
- `/docs`: 설계 및 명세 문서 (PDF 및 Markdown)
- `firestore.rules`: 최적화된 보안 규칙 Helper 레이어
- `AGENTS.md`: 프로젝트 헌법
