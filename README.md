# Hackathon_5
피로그래밍 25기 해커톤 5조입니다.

# 효도클릭

디지털 기기 사용이 어려운 어르신과 정보 취약 계층이 온라인 예약 같은
일상적인 디지털 서비스를 이용하다 막히는 순간 실시간으로 도움을 받을 수
있도록 도우미와 연결해주는 서비스입니다.

## 문제의식

병원 예약, 관공서 서류 발급처럼 이제는 온라인으로만 처리해야 하는 일들이
늘고 있지만 디지털 기기에 익숙하지 않은 분들에게는 이 과정 자체가 큰
장벽입니다. 옆에서 봐줄 사람이 없으면 포기하거나, 매번 주변 사람에게
부탁해야 하는 상황이 반복됩니다.

## 핵심 아이디어

이용자는 예약 화면에서 막히는 순간 SOS 버튼 하나만 누르면 됩니다. 그러면
대기 중인 도우미에게 실시간으로 요청이 전달되고, 도우미는 이용자의 현재
화면(스크린샷)을 보면서 캔버스에 동그라미·화살표·메모 등을 그려 직접
안내합니다. 전화도 앱 설치도 필요 없이, 브라우저 화면 공유만으로 도움을
주고받는 구조입니다. 도움을 완료한 도우미에게는 효자뱃지가 자동으로
지급되고 이달의 기여도에 따라 랭킹이 매겨져 지속적인 참여를 유도합니다.

## 핵심 기능

- 예약 6단계 진행 (날짜·시간·유형·결제·확인) 중 언제든 SOS 요청
- 도우미 실시간 매칭 (대기 중인 도우미에게 브로드캐스트, 먼저 수락하는
  사람과 연결)
- 화면 캡처 + 캔버스 주석(그리기 도구)으로 실시간 안내
- 완료 시 효자뱃지 자동 지급, 이달의 효자 랭킹
- 도우미 회원가입/로그인 (아이디·비밀번호, 카카오 소셜 로그인)

## 팀 구성

| 이름 | 담당 | 폴더 | 역할 |
|---|---|---|---|
| 강보민 | 1. 이용자(User) 프론트 | `apps/reservation/` | 예약 6단계 화면, SOS 버튼, 대기/안내 수신 |
| 이환희 | 2. 도우미(Helper) 프론트 | `apps/helper/` | 로그인·회원가입 화면, 대기 목록, 캔버스 도구, 마이페이지 |
| 정지민 | 3. 백엔드 | `apps/matching/` | 웹소켓 Consumer, 동시 수락 처리, 타임아웃 |
| 정승현 | 4. 백엔드/배포 | `apps/accounts/` | 인증/뱃지/랭킹 API, 배포 |

## 실행 방법

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # 선택, 관리자 페이지용
python manage.py runserver
```

- 이용자 화면: http://localhost:8000/
- 도우미 로그인: http://localhost:8000/helper/login/
- 관리자: http://localhost:8000/admin/

Docker로 실행 (Postgres + Redis 포함):
```bash
cp .env.example .env
docker compose up --build
```

## 개발 시 공통 계약

아래 두 가지는 4명이 공유하는 데이터 구조라 이름을 바꾸지 않습니다.

- `HelpRequest` 모델 (`apps/matching/models.py`): `id`, `user_session_key`,
  `reservation_step`, `screenshot`, `canvas_data`, `helper`, `status`,
  `created_at`, `matched_at`, `completed_at`
- `Badge` 모델 (`apps/accounts/models.py`): `helper`, `help_request`, `awarded_at`
- 웹소켓 URL: `ws/helpers/`, `ws/session/<id>/` (`apps/matching/routing.py`)