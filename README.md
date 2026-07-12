# 효도클릭 (HyoClick) — 기본 틀

디지털 취약계층을 위한 실시간 화면공유 예약 도우미 서비스. Django + Django
Channels(웹소켓) + Docker 구성의 4인 팀용 스캐폴드입니다.

**이 저장소는 "완성품"이 아니라 뼈대입니다.** 프로젝트 구조, 설정, 공유
데이터 모델, URL 라우팅만 잡혀있고, 실제 화면/로직/실시간 통신은 전부
`TODO(담당자 N)` 주석으로 표시되어 있어 각자 직접 구현해야 합니다.

## 담당 파트 ↔ 코드 위치

| 담당 | 폴더 | 이미 있는 것 | 직접 구현할 것 |
|---|---|---|---|
| 1. 이용자(User) 프론트 | `apps/reservation/` | URL 라우팅, 템플릿/뷰 껍데기 | 예약 6단계 화면, SOS 버튼, 대기/안내 수신 로직 |
| 2. 도우미(Helper) 프론트 | `apps/helper/` | URL 라우팅, 템플릿/뷰 껍데기 | 로그인·회원가입 화면, 대기 목록, 캔버스 도구, 마이페이지 |
| 3. 매칭 로직 + 실시간 통신 | `apps/matching/` | `HelpRequest` 모델(필드), 웹소켓 라우팅 껍데기 | Consumer 로직, 동시 수락 처리, 타임아웃 |
| 4. 백엔드/인프라 | `apps/accounts/` | `HelperProfile`/`Badge` 모델(필드), API URL 라우팅 | 인증/뱃지/랭킹 API 실제 구현, 본인인증, CSRF |

## 공통 계약 (반드시 지켜야 하는 부분)

다른 사람 코드가 안 깨지려면 아래 두 가지는 이름을 바꾸지 말고 그대로
쓰세요. 그 외 모든 구현(로직, 화면, 이벤트 프로토콜 세부사항)은 자유입니다.

- `HelpRequest` 모델 (`apps/matching/models.py`): `id`, `user_session_key`,
  `reservation_step`, `screenshot`, `canvas_data`, `helper`, `status`,
  `created_at`, `matched_at`, `completed_at`
- `Badge` 모델 (`apps/accounts/models.py`): `helper`, `help_request`, `awarded_at`
- 웹소켓 URL: `ws/helpers/`, `ws/session/<id>/` (`apps/matching/routing.py`)

이벤트 이름(`new_request`, `matched` 등)이나 API 요청/응답 형식은 정해진 게
없으니, 작업 시작 전에 담당자끼리 짧게 맞춰보는 걸 추천합니다.

## 로컬에서 실행하기

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # 선택, 관리자 페이지용
python manage.py runserver
```

- 이용자 화면: http://localhost:8000/ (지금은 빈 화면)
- 도우미 로그인: http://localhost:8000/helper/login/ (지금은 빈 화면)
- 관리자: http://localhost:8000/admin/

REDIS_URL 환경변수가 없으면 자동으로 `InMemoryChannelLayer`를 쓰므로 Redis
없이도 웹소켓 서버 자체는 뜹니다 (로컬 개발용, 단일 프로세스에서만 유효).

## Docker로 실행 (Postgres + Redis 포함)

```bash
cp .env.example .env
docker compose up --build
```

## Railway로 배포하기

`RAILWAY.md`에 Postgres/Redis 플러그인 연결부터 환경변수 설정까지 정리해
뒀습니다. `DATABASE_URL`/`REDIS_URL`이 있으면 자동으로 그걸 쓰도록 이미
되어 있어서(`config/settings.py`), 실제 기능을 다 구현한 뒤 배포할 때
참고하면 됩니다.

## 시작하기 전에

1. `apps/matching/models.py`의 `HelpRequest` 필드를 다 같이 한 번 읽어보기
2. 각자 담당 앱의 `urls.py`를 보고 어떤 화면/API가 필요한지 확인
3. 웹소켓 이벤트 이름, API 요청/응답 형식을 팀끼리 간단히 합의
4. 이후 각자 파트를 독립적으로 개발 (자세한 병렬 개발 팁은 이전 대화 참고)
