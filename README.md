# QR코드 & URL 단축 웹 서비스 프로젝트 명세서

본 프로젝트는 사용자가 긴 웹 주소를 손쉽게 관리하고 공유할 수 있도록 지원하는 **통합 웹 유틸리티 애플리케이션**입니다.  
스마트폰 카메라로 바로 스캔 가능한 **QR 코드 생성기**와 메신저나 SNS에 깔끔하게 공유할 수 있는 **단축 URL 변환기**를 제공합니다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
| :--- | :--- |
| **프로젝트명** | QR코드 및 URL 단축 웹 애플리케이션 (Link Utilities Hub) |
| **개발 언어 및 환경** | HTML5, CSS3, Modern JavaScript (Vanilla ES6+) |
| **사용 라이브러리** | QRCode.js (1.0.0) |
| **외부 OpenAPI 연동** | is.gd / v.gd RESTful Shorten API (CORS 허용) |
| **디자인 시스템** | 글래스모피즘(Glassmorphism), 반응형 웹, Pretendard 폰트 |
| **주요 디렉토리 구조** | `index.html` (메인 포털)<br>├── `url2qr/` (QR 코드 생성기)<br>└── `urlShort/` (URL 단축기) |

---

## 2. 프로젝트 디렉토리 구조

```plaintext
프로젝트06_20261012/
├── index.html            # [통합 허브] 메인 랜딩 포털 및 서비스 선택 화면
├── style.css             # 메인 포털 글래스모피즘 스타일시트
├── README.md             # 프로젝트 개요 및 기능 명세서 (본 문서)
├── url2qr/               # [모듈 1] QR코드 생성 서비스
│   ├── index.html        # QR코드 생성기 화면 (상단 네비게이션 포함)
│   ├── style.css         # QR코드 생성기 스타일
│   ├── script.js         # QR코드 생성 및 JPG 다운로드 로직
│   └── img/
│       └── logo.png      # 공통 서비스 로고
└── urlShort/             # [모듈 2] URL 단축 서비스
    ├── index.html        # URL 단축기 화면 (입력창, 출력상자, 복사 버튼)
    ├── style.css         # URL 단축기 전용 스타일시트
    └── script.js         # OpenAPI 연동, 유효성 검사 및 클립보드 복사 로직
```

---

## 3. 화면 구성 및 상호작용 흐름 (Navigation Flow)

```
[메인 허브 (index.html)]
   ├── [QR코드 버튼]  ───▶ [url2qr/index.html] (QR코드 생성 및 JPG 다운로드)
   │                           │
   │                           └── [URL단축 버튼] ───┐
   │                                                 ▼
   └── [URL단축 버튼] ───▶ [urlShort/index.html] (URL 단축 및 클립보드 복사)
                               │
                               └── [QR코드 버튼] ───▶ [url2qr/index.html]
```

- 모든 페이지 상단에 **헤더 네비게이션**('QR코드', 'URL단축', 로고)이 배치되어 있어 원클릭으로 서비스 간 이동이 가능합니다.
- 로고 클릭 시 메인 허브 화면(`../index.html` 또는 `index.html`)으로 이동합니다.

---

## 4. 상세 기능 명세서 (Functional Specification)

### 4.1 메인 포털 (`/index.html`)
1. **공통 네비게이션**: 상단 헤더에 'QR코드'와 'URL단축' 바로가기 버튼 제공
2. **서비스 선택 카드**: 
   - 'QR코드 생성기' 카드와 'URL 단축기' 카드를 시각적으로 구분하여 배치
   - 각 카드의 액션 버튼 클릭 시 해당 하위 폴더의 `index.html`로 라우팅
3. **인터랙티브 배경**: 마우스 커서 위치에 따른 동적 백그라운드 그라디언트 렌더링

### 4.2 QR 코드 생성기 모듈 (`/url2qr/index.html`)
1. **URL 입력**: 웹사이트 주소 입력창 제공 (`#url-input`)
2. **QR코드 렌더링**:
   - `QRCode.js` 라이브러리를 사용하여 최고 오류 복원 레벨(`CorrectLevel.H`, 300x300)로 캔버스 렌더링
   - 엔터 키 또는 '생성하기' 버튼 클릭 시 즉각적인 인터랙션 애니메이션과 함께 QR 카드 표시
3. **이미지 다운로드**:
   - 생성된 QR코드 클릭 시 캔버스 데이터를 JPEG로 인코딩(`image/jpeg`)
   - `qrcode.jpg` 파일명으로 자동 다운로드 트리거
4. **상호 연결 네비게이션**:
   - 상단 헤더의 'URL단축' 버튼 클릭 시 `../urlShort/index.html`로 전환

### 4.3 URL 단축기 모듈 (`/urlShort/index.html`)
1. **URL 입력창 (`#url-input`)**:
   - 단축할 원본 주소 입력 지원
   - 자동완성 끄기 및 철자 검사 비활성화로 URL 입력 최적화
2. **단축 버튼 상태 제어 (`#shorten-btn`)**:
   - **입력 필드가 비어 있으면 비활성화 (`disabled = true`)**
   - 텍스트 입력 시 실시간 감지하여 즉시 활성화
   - `disabled` 상태 시 커서 모양(`not-allowed`) 및 불투명도 조절로 시각적 피드백 제공
3. **OpenAPI 기반 URL 단축 요청**:
   - 프로토콜(`http://`, `https://`) 누락 시 자동 보정 및 유효성 검사
   - 브라우저 클라이언트에서 CORS 제한 없이 호출 가능한 `is.gd` OpenAPI 연동
   - 단축 진행 중 로딩 스피너 및 "단축 중..." 텍스트 전환
   - 1차 API 장애 시 보조 API(`v.gd`)로 자동 폴백(Fallback) 처리하여 높은 안정성 확보
4. **결과 출력 상자 (`#shortened-url`)**:
   - **읽기 전용(`readonly`)** 필드로 구성되어 사용자의 실수에 의한 값 훼손 방지
   - 성공적인 단축 결과 수신 시 자동으로 결과 섹션이 표시되며 부드러운 스크롤 이동
5. **클립보드 복사 (`#copy-btn`)**:
   - 버튼 클릭 시 최신 `navigator.clipboard.writeText()` 및 대체 방식(`document.execCommand`)을 활용하여 확실하게 클립보드 복사
   - **요구사항 준수**: 복사 완료 시 **`'복사하였습니다'` 알림창(`alert`)** 호출
6. **새 탭 바로가기 (`#open-link-btn`)**:
   - 생성된 단축 URL을 즉시 열어볼 수 있는 새 탭 링크 아이콘 버튼 함께 제공

---

## 5. OpenAPI 연동 규격

### 5.1 기본 API (da.gd) - 1순위
- **Method**: `GET`
- **Endpoint**: `https://da.gd/s`
- **Query Parameters**:
  - `url`: 단축 대상 긴 URL (URL-Encoding 필수)
- **특징**: `Access-Control-Allow-Origin: *`를 지원하여 브라우저에서 직접 호출 가능하며, 매우 빠른 응답 속도와 높은 신뢰성을 보장합니다.
- **성공 응답 예시 (HTTP 200)**:
  ```text
  https://da.gd/kTg5jm
  ```

### 5.2 장애 대응 보조 API (is.gd / v.gd) - 2순위 & 3순위
- **Method**: `GET`
- **Endpoint**: `https://is.gd/create.php`, `https://v.gd/create.php`
- **Query Parameters**: `format=json&url={encoded_url}`
- **안전성 강화**: 서버 일시 장애(DB lock, 비JSON 텍스트 반환 등) 발생 시 안전하게 텍스트를 감지하고 다음 백업 API로 자동 전환되도록 처리되었습니다.

---

## 6. 테스트 및 검증 체크리스트

- [x] 메인 포털에서 'QR코드' 클릭 시 `url2qr/index.html`로 정상 이동
- [x] 메인 포털에서 'URL단축' 클릭 시 `urlShort/index.html`로 정상 이동
- [x] `url2qr` 헤더에서 'URL단축' 클릭 시 `urlShort/index.html`로 정상 이동
- [x] `urlShort` 헤더에서 'QR코드' 클릭 시 `url2qr/index.html`로 정상 이동
- [x] `urlShort` 진입 시 '단축하기' 버튼이 비활성화(disabled) 상태인지 확인
- [x] 입력 필드에 공백/텍스트 입력 및 삭제 시 버튼 활성화/비활성화 실시간 전환 확인
- [x] URL 입력 후 '단축하기' 클릭 시 OpenAPI 호출 및 단축된 링크가 읽기 전용 상자에 출력되는지 확인
- [x] '복사' 버튼 클릭 시 클립보드에 복사되고 `'복사하였습니다'` 알림창이 뜨는지 확인
