document.addEventListener('DOMContentLoaded', () => {
  // ================= 1. 화면 전환 (홈 / QR코드 / URL단축) =================
  const navHomeBtn = document.getElementById('nav-home-btn');
  const navQrBtn = document.getElementById('nav-qr-btn');
  const navUrlBtn = document.getElementById('nav-url-btn');
  const logoHomeBtn = document.getElementById('logo-home-btn');

  const homeSection = document.getElementById('home-section');
  const qrSection = document.getElementById('qr-section');
  const urlSection = document.getElementById('url-section');

  const goQrBtn = document.getElementById('go-qr-btn');
  const goUrlBtn = document.getElementById('go-url-btn');
  const backHomeBtns = document.querySelectorAll('.back-home-btn');

  // 화면 전환 함수
  const switchScreen = (screen) => {
    // 1) 모든 네비게이션 버튼 비활성화
    navHomeBtn.classList.remove('active');
    navQrBtn.classList.remove('active');
    navUrlBtn.classList.remove('active');

    // 2) 모든 섹션 숨김
    homeSection.classList.remove('active');
    qrSection.classList.remove('active');
    urlSection.classList.remove('active');

    // 3) 선택된 화면 활성화
    if (screen === 'qr') {
      navQrBtn.classList.add('active');
      qrSection.classList.add('active');
    } else if (screen === 'url') {
      navUrlBtn.classList.add('active');
      urlSection.classList.add('active');
    } else {
      // 기본값: 홈
      navHomeBtn.classList.add('active');
      homeSection.classList.add('active');
    }

    // 부드럽게 상단으로 스크롤 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 상단 네비게이션 및 로고 이벤트
  navHomeBtn.addEventListener('click', () => switchScreen('home'));
  navQrBtn.addEventListener('click', () => switchScreen('qr'));
  navUrlBtn.addEventListener('click', () => switchScreen('url'));
  logoHomeBtn.addEventListener('click', () => switchScreen('home'));

  // 홈 화면 카드 바로가기 버튼 이벤트
  if (goQrBtn) goQrBtn.addEventListener('click', () => switchScreen('qr'));
  if (goUrlBtn) goUrlBtn.addEventListener('click', () => switchScreen('url'));

  // 각 화면 내부의 '홈으로 이동' 버튼 이벤트
  backHomeBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchScreen('home'));
  });

  // ================= 2. QR 코드 생성기 로직 =================
  const qrUrlInput = document.getElementById('qr-url-input');
  const qrGenerateBtn = document.getElementById('qr-generate-btn');
  const qrContainer = document.getElementById('qr-container');
  const qrcodeDiv = document.getElementById('qrcode');

  const generateQR = () => {
    const url = qrUrlInput.value.trim();
    if (!url) {
      alert('URL을 입력해주세요.');
      qrUrlInput.focus();
      return;
    }

    try {
      qrcodeDiv.innerHTML = '';
      new QRCode(qrcodeDiv, {
        text: url,
        width: 260,
        height: 260,
        colorDark: '#1e293b',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      qrContainer.classList.remove('qr-hidden');
    } catch (err) {
      console.error(err);
      alert('QR코드 생성 중 오류가 발생했습니다.');
    }
  };

  qrGenerateBtn.addEventListener('click', generateQR);
  qrUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generateQR();
  });

  // QR코드 클릭 시 JPG 다운로드
  qrcodeDiv.addEventListener('click', () => {
    const canvas = qrcodeDiv.querySelector('canvas');
    if (!canvas) {
      alert('QR 코드를 찾을 수 없습니다.');
      return;
    }
    const image = canvas.toDataURL('image/jpeg', 1.0);
    const link = document.createElement('a');
    link.href = image;
    link.download = 'qrcode.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // ================= 3. URL 단축기 로직 =================
  const shortUrlInput = document.getElementById('short-url-input');
  const shortenBtn = document.getElementById('shorten-btn');
  const btnText = shortenBtn.querySelector('.btn-text');
  const loader = shortenBtn.querySelector('.loader');
  const shortResultSection = document.getElementById('short-result-section');
  const shortenedResultUrl = document.getElementById('shortened-result-url');
  const copyBtn = document.getElementById('copy-btn');
  const openLinkBtn = document.getElementById('open-link-btn');
  const shortErrorMsg = document.getElementById('short-error-msg');

  // 3-2. 입력 필드에 따른 버튼 활성화/비활성화
  const updateShortenBtnState = () => {
    const value = shortUrlInput.value.trim();
    shortenBtn.disabled = value.length === 0;
  };

  updateShortenBtnState();
  shortUrlInput.addEventListener('input', () => {
    updateShortenBtnState();
    shortErrorMsg.classList.add('hidden');
  });

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

  // 3-3. OpenAPI 기반 URL 단축 요청 (da.gd 1순위, is.gd 2순위)
  const shortenUrlApi = async (longUrl) => {
    // 1차 시도: da.gd (CORS 완전 지원)
    try {
      const response = await fetch(`https://da.gd/s?url=${encodeURIComponent(longUrl)}`);
      if (response.ok) {
        const text = (await response.text()).trim();
        if (text.startsWith('http://') || text.startsWith('https://')) {
          return text;
        }
      }
    } catch (err) {
      console.warn('da.gd API 시도 실패:', err);
    }

    // 2차 시도: is.gd (안전한 JSON 파싱)
    try {
      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`);
      if (response.ok) {
        const rawText = await response.text();
        try {
          const data = JSON.parse(rawText);
          if (data && data.shorturl) return data.shorturl;
        } catch (jsonErr) {}
      }
    } catch (err) {
      console.warn('is.gd API 시도 실패:', err);
    }

    throw new Error('URL 단축 API 호출에 실패했습니다. 올바른 URL인지 확인해주세요.');
  };

  const handleShorten = async () => {
    shortErrorMsg.classList.add('hidden');
    const rawInput = shortUrlInput.value.trim();
    if (!rawInput) return;

    const validatedUrl = normalizeUrl(rawInput);
    if (!validatedUrl) {
      shortErrorMsg.textContent = '유효한 웹사이트 주소(URL) 형식을 입력해주세요.';
      shortErrorMsg.classList.remove('hidden');
      return;
    }

    shortenBtn.disabled = true;
    btnText.textContent = '단축 중...';
    loader.classList.remove('hidden');

    try {
      const shortUrl = await shortenUrlApi(validatedUrl);
      shortenedResultUrl.value = shortUrl;
      openLinkBtn.href = shortUrl;
      shortResultSection.classList.remove('hidden');
    } catch (err) {
      shortErrorMsg.textContent = err.message || 'URL 단축 중 오류가 발생했습니다.';
      shortErrorMsg.classList.remove('hidden');
    } finally {
      updateShortenBtnState();
      btnText.textContent = '단축하기';
      loader.classList.add('hidden');
    }
  };

  shortenBtn.addEventListener('click', handleShorten);
  shortUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !shortenBtn.disabled) handleShorten();
  });

  // 3-4. 복사 버튼 클릭 시 복사 및 alert
  copyBtn.addEventListener('click', async () => {
    const textToCopy = shortenedResultUrl.value.trim();
    if (!textToCopy) return;

    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      } catch (e) {}
    }

    if (!success) {
      shortenedResultUrl.select();
      try {
        document.execCommand('copy');
      } catch (e) {}
    }

    alert('복사하였습니다');
  });

  // 마우스 이동 인터랙티브 배경
  document.addEventListener('mousemove', (e) => {
    const x = Math.round((e.clientX / window.innerWidth) * 100);
    const y = Math.round((e.clientY / window.innerHeight) * 100);
    document.body.style.setProperty('--mouse-x', `${x}%`);
    document.body.style.setProperty('--mouse-y', `${y}%`);
  });
});
