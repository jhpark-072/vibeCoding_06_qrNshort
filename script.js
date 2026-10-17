document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('url-input');
  const shortenBtn = document.getElementById('shorten-btn');
  const btnText = shortenBtn.querySelector('.btn-text');
  const loader = shortenBtn.querySelector('.loader');
  const resultSection = document.getElementById('result-section');
  const shortenedUrlInput = document.getElementById('shortened-url');
  const copyBtn = document.getElementById('copy-btn');
  const openLinkBtn = document.getElementById('open-link-btn');
  const errorMessage = document.getElementById('error-message');

  // 1. 입력 필드 상태에 따른 단축 버튼 활성화/비활성화 (요구사항 3-2)
  const updateButtonState = () => {
    const value = urlInput.value.trim();
    if (value.length === 0) {
      shortenBtn.disabled = true;
    } else {
      shortenBtn.disabled = false;
    }
  };

  // 초기 상태: 비활성화
  updateButtonState();

  // 입력 감지 (typing, paste, cut 등)
  urlInput.addEventListener('input', () => {
    updateButtonState();
    hideError();
  });

  // 에러 메시지 표시/숨김 헬퍼
  const showError = (msg) => {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  };

  const hideError = () => {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
  };

  // URL 유효성 검사 및 정규화
  const normalizeUrl = (input) => {
    let url = input.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    try {
      new URL(url);
      return url;
    } catch (e) {
      return null;
    }
  };

  // 2. OpenAPI 호출을 통한 URL 단축 (요구사항 3-3)
  const shortenUrlWithApi = async (longUrl) => {
    // 1차 시도: da.gd OpenAPI (CORS 완벽 지원, 높은 가용성 및 빠른 응답 속도)
    try {
      const response = await fetch(`https://da.gd/s?url=${encodeURIComponent(longUrl)}`);
      if (response.ok) {
        const text = (await response.text()).trim();
        if (text.startsWith('http://') || text.startsWith('https://')) {
          return text;
        }
      }
    } catch (err) {
      console.warn('da.gd API 시도 실패, 보조 API로 재시도합니다:', err);
    }

    // 2차 시도: is.gd OpenAPI (안전한 텍스트 및 JSON 파싱)
    try {
      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`);
      if (response.ok) {
        const rawText = await response.text();
        try {
          const data = JSON.parse(rawText);
          if (data && data.shorturl) {
            return data.shorturl;
          }
        } catch (jsonErr) {
          // is.gd 서버 일시 DB 오류 등의 텍스트 반환 처리
          console.warn('is.gd 응답 파싱 실패:', rawText);
        }
      }
    } catch (err) {
      console.warn('is.gd API 시도 실패:', err);
    }

    // 3차 시도: v.gd OpenAPI (보조 API)
    try {
      const response = await fetch(`https://v.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`);
      if (response.ok) {
        const rawText = await response.text();
        try {
          const data = JSON.parse(rawText);
          if (data && data.shorturl) {
            return data.shorturl;
          }
        } catch (jsonErr) {
          console.warn('v.gd 응답 파싱 실패:', rawText);
        }
      }
    } catch (err) {
      console.warn('v.gd API 시도 실패:', err);
    }

    throw new Error('URL 단축 API 호출에 실패했습니다. 올바른 URL인지 확인해주세요.');
  };

  // 단축 실행 함수
  const handleShorten = async () => {
    hideError();
    const rawInput = urlInput.value.trim();
    if (!rawInput) {
      showError('단축할 URL을 입력해주세요.');
      return;
    }

    const validatedUrl = normalizeUrl(rawInput);
    if (!validatedUrl) {
      showError('유효한 웹사이트 주소(URL) 형식을 입력해주세요.');
      return;
    }

    // 로딩 UI 설정
    shortenBtn.disabled = true;
    btnText.textContent = '단축 중...';
    loader.classList.remove('hidden');

    try {
      const shortUrl = await shortenUrlWithApi(validatedUrl);
      
      // 결과 출력창에 표시 (요구사항 3-3)
      shortenedUrlInput.value = shortUrl;
      openLinkBtn.href = shortUrl;
      resultSection.classList.remove('hidden');

      // 단축 완료 후 결과로 부드럽게 스크롤
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
      showError(error.message || 'URL 단축 중 오류가 발생했습니다.');
    } finally {
      // 로딩 UI 복구
      updateButtonState();
      btnText.textContent = '단축하기';
      loader.classList.add('hidden');
    }
  };

  // '단축하기' 버튼 클릭 이벤트
  shortenBtn.addEventListener('click', handleShorten);

  // 엔터 키 입력 시 단축 실행
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !shortenBtn.disabled) {
      handleShorten();
    }
  });

  // 3. '복사' 버튼 클릭 시 클립보드 복사 및 알림 (요구사항 3-4)
  copyBtn.addEventListener('click', async () => {
    const textToCopy = shortenedUrlInput.value.trim();
    if (!textToCopy) return;

    let copySuccess = false;

    // Clipboard API 시도
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        copySuccess = true;
      } catch (err) {
        console.warn('Clipboard API 실패, 대체 복사 방식 사용:', err);
      }
    }

    // fallback 복사 방식
    if (!copySuccess) {
      shortenedUrlInput.select();
      shortenedUrlInput.setSelectionRange(0, 99999);
      try {
        copySuccess = document.execCommand('copy');
      } catch (err) {
        console.error('복사 실패:', err);
      }
    }

    // 요구사항 3-4: '복사하였습니다' 알림창 표시
    alert('복사하였습니다');
  });

  // 마우스 이동 시 배경 애니메이션 효과 (시각적 일체감)
  document.addEventListener('mousemove', (e) => {
    const x = Math.round((e.clientX / window.innerWidth) * 100);
    const y = Math.round((e.clientY / window.innerHeight) * 100);
    document.body.style.setProperty('--mouse-x', `${x}%`);
    document.body.style.setProperty('--mouse-y', `${y}%`);
  });
});
