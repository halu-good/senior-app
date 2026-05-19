// 시니어 복약 도우미 전역 상태 데이터 기본값
const defaultAppData = {
    userName: '사용자', // 이름을 받아올 수 있음
    medications: [
        { id: 1, name: '고혈압 약', time: '08:00', taken: false },
        { id: 2, name: '관절염 약', time: '13:00', taken: false },
        { id: 3, name: '치매 예방약', time: '20:00', taken: false }
    ],
    hospitalAppointments: [
        { id: 1, date: '2026-05-18', time: '14:30', clinic: '김내과의원 정기검진' }
    ],
    adherence: 85, // 복약 성실도 퍼센트
    missedMeds: [
        { time: '어제 점심', name: '관절염 약' }
    ],
    calendarView: 'week' // 'week' 또는 'month'
};

// [NFR-03 저장] 브라우저 로컬 스토리지에서 자동 백업된 데이터 불러오기
let appData = JSON.parse(localStorage.getItem('seniorAppData')) || defaultAppData;

// [NFR-03 저장] 데이터 변경 시 자동으로 로컬에 백업하는 함수
function saveData() {
    localStorage.setItem('seniorAppData', JSON.stringify(appData));
}

// 화면별 HTML 템플릿을 문자열로 반환하는 함수들
const screens = {
    // 1. 홈 화면
    home: () => `
        <h1>${appData.userName}님의 복약 일정</h1>
        
        <div class="card">
            <h2 style="color: var(--text-main);">하루 복약 일정</h2>
            <div id="med-list"></div>
        </div>

        <div class="card">
            <h2 style="color: var(--text-main);">병원 일정</h2>
            <div id="hosp-info"></div>
        </div>

        <button class="btn-outline" style="border-color: var(--accent); color: var(--accent); width: 100%; margin-bottom: 15px;" onclick="navigate('addEditMed')">
            복약 추가 및 수정
        </button>
        <button class="btn-primary" style="background-color: var(--accent);" onclick="navigate('adherence')">
            복약 성실도 확인
        </button>
    `,
    
    // 2. 복약 추가 및 수정 화면
    addEditMed: () => `
        <h1>복약 추가 및 수정</h1>
        <div class="card">
            <label>어떤 약인가요?</label>
            <input type="text" id="new-med-name" placeholder="예: 고혈압 약">
            <label>복용 시간</label>
            <input type="time" id="new-med-time">
            <button class="btn-green" style="width:100%; margin-bottom:20px;" onclick="openCamera()">약 봉투 사진 촬영</button>
            <button class="btn-primary" onclick="addMed()">약 저장하기</button>
        </div>
        
        <h2 style="margin-left: 5px; color: var(--text-main);">현재 복용 중인 약</h2>
        <div class="card">
            ${appData.medications.length > 0 ? appData.medications.map(med => `
                <div class="med-item" style="border-bottom: 1px solid #eee;">
                    <div class="med-info">
                        <div class="med-name">${med.name}</div>
                        <div class="med-time">${med.time}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-green" style="font-size: 1.1rem; padding: 10px 15px;" onclick="editMed(${med.id})">수정</button>
                        <button class="btn-red" style="font-size: 1.1rem; padding: 10px 15px;" onclick="deleteMed(${med.id})">삭제</button>
                    </div>
                </div>
            `).join('') : '<p style="text-align:center; padding: 15px; color: var(--text-light);">등록된 약이 없습니다.</p>'}
        </div>
        <button class="btn-outline" style="width:100%; background: #fff;" onclick="navigate('home')">돌아가기</button>
    `,

    // 3. 복약 성실도 화면
    adherence: () => `
        <h1>복약 성실도</h1>
        <div class="card text-center">
            <h2 style="color: var(--text-main);">나의 복약 점수</h2>
            <div style="font-size: 4.5rem; color: var(--btn-green); font-weight: bold; margin: 25px 0;">${appData.adherence}%</div>
            <p style="font-size: 1.4rem; color: var(--accent); font-weight: bold;">
                훌륭합니다.<br>이대로 꾸준히 복약 규칙을 지켜주세요.
            </p>
        </div>
        
        <div class="card">
            <h2 style="color: var(--btn-red);">빠뜨린 약 확인</h2>
            ${appData.missedMeds.map(missed => `
                <p style="font-size: 1.4rem; margin-bottom: 10px;">
                    <span style="color: var(--btn-red); font-weight:bold;">${missed.time}</span> : ${missed.name}
                </p>
            `).join('')}
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #e2e8f0;">
                <p style="font-size: 1.2rem;"><strong>점심 시간(13:00)</strong>에 약 복용을 잊으신 기록이 있습니다. 알림 소리를 더 크게 설정해 드릴까요?</p>
            </div>
        </div>
        <button class="btn-outline" style="width:100%; background: #fff;" onclick="navigate('home')">돌아가기</button>
    `,

    // 4. 달력 (일정) 화면
    calendar: () => `
        <div class="flex-row" style="margin-bottom: 20px;">
            <h1 style="margin: 0;">달력</h1>
            <button class="btn-outline" style="padding: 10px 15px; font-size: 1.1rem;" onclick="toggleCalendarView()">
                ${appData.calendarView === 'week' ? '한달 보기' : '주간 보기'}
            </button>
        </div>
        <div class="card">
            <div class="calendar-header">
                <button class="btn-outline" style="border:none; font-size: 1.8rem; padding:5px;">◀</button>
                <h2 style="margin:0; font-size: 1.6rem; color: var(--text-main);">${appData.calendarView === 'week' ? '5월 3주차' : '5월 전체'}</h2>
                <button class="btn-outline" style="border:none; font-size: 1.8rem; padding:5px;">▶</button>
            </div>
            <div class="calendar-grid">
                <div class="cal-day-header">월</div><div class="cal-day-header">화</div><div class="cal-day-header">수</div><div class="cal-day-header">목</div><div class="cal-day-header">금</div><div class="cal-day-header">토</div><div class="cal-day-header" style="color: var(--btn-red);">일</div>
                
                ${appData.calendarView === 'week' ? `
                    <div class="cal-day">16</div><div class="cal-day">17</div><div class="cal-day has-hosp">18</div><div class="cal-day">19</div><div class="cal-day">20</div><div class="cal-day">21</div><div class="cal-day active">22</div>
                ` : `
                    <div class="cal-day" style="opacity:0.3">26</div><div class="cal-day" style="opacity:0.3">27</div><div class="cal-day" style="opacity:0.3">28</div><div class="cal-day" style="opacity:0.3">29</div><div class="cal-day" style="opacity:0.3">30</div><div class="cal-day">1</div><div class="cal-day">2</div>
                    <div class="cal-day">3</div><div class="cal-day">4</div><div class="cal-day">5</div><div class="cal-day">6</div><div class="cal-day">7</div><div class="cal-day">8</div><div class="cal-day">9</div>
                    <div class="cal-day">10</div><div class="cal-day">11</div><div class="cal-day">12</div><div class="cal-day">13</div><div class="cal-day">14</div><div class="cal-day">15</div><div class="cal-day">16</div>
                    <div class="cal-day">17</div><div class="cal-day has-hosp">18</div><div class="cal-day">19</div><div class="cal-day">20</div><div class="cal-day">21</div><div class="cal-day active">22</div><div class="cal-day">23</div>
                    <div class="cal-day">24</div><div class="cal-day">25</div><div class="cal-day">26</div><div class="cal-day">27</div><div class="cal-day">28</div><div class="cal-day">29</div><div class="cal-day">30</div>
                    <div class="cal-day">31</div><div class="cal-day" style="opacity:0.3">1</div><div class="cal-day" style="opacity:0.3">2</div><div class="cal-day" style="opacity:0.3">3</div><div class="cal-day" style="opacity:0.3">4</div><div class="cal-day" style="opacity:0.3">5</div><div class="cal-day" style="opacity:0.3">6</div>
                `}
            </div>
            
            ${appData.hospitalAppointments.map(hosp => `
                <div class="mt-20" style="padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 5px solid var(--accent); border: 1px solid #c8d1c8;">
                    <p style="color: var(--text-main); font-weight: bold; font-size: 1.3rem;">${hosp.date} 예약 정보</p>
                    <p style="font-size: 1.5rem; font-weight: bold; margin-top: 10px; color: var(--accent);">${hosp.clinic}<br>${hosp.time}</p>
                </div>
            `).join('')}
            
        </div>
        <!-- 왼쪽 하단에 버튼 배치 -->
        <div style="display: flex; justify-content: flex-start;">
            <button class="btn-green" style="padding: 15px 25px;" onclick="navigate('addSchedule')">일정 추가</button>
        </div>
    `,

    // 5. 일정 추가 화면
    addSchedule: () => `
        <h1>병원 일정 추가</h1>
        <div class="card">
            <label>예약 날짜</label>
            <input type="date" id="new-hosp-date">
            
            <label>예약 시간</label>
            <input type="time" id="new-hosp-time">
            
            <label>병원 및 내용 입력</label>
            <input type="text" id="new-hosp-name" placeholder="예: 서울내과 진료">
            
            <button class="btn-primary" style="margin-top: 10px;" onclick="addHospSchedule()">저장하기</button>
        </div>
        
        <div style="display: flex; justify-content: flex-end;">
            <button class="btn-outline" style="padding: 15px 25px; background: #fff;" onclick="navigate('calendar')">돌아가기</button>
        </div>
    `,

    // 6. 건강 정보 화면
    tips: () => `
        <h1 style="text-align: center;">건강 정보 더 보기</h1>
        <div class="card">
            <div style="width: 100%; height: 180px; background-color: #e1e8e1; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 2rem; margin-bottom: 20px; color: #4a634a; font-weight: bold;">
                관절 건강
            </div>
            <h2>무릎 관절에 좋은 운동법</h2>
            <p style="color: var(--text-light); font-size: 1.1rem; margin-bottom: 10px;">가벼운 걷기와 스트레칭이 관절 통증을 줄여줍니다.</p>
        </div>
        <div class="card">
            <div style="width: 100%; height: 180px; background-color: #c6d1c6; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 2rem; margin-bottom: 20px; color: #3a4d3a; font-weight: bold;">
                영양 관리
            </div>
            <h2>비타민D 충전하기</h2>
            <p style="color: var(--text-light); font-size: 1.1rem; margin-bottom: 10px;">하루 15분 햇빛을 쬐어 뼈 건강을 튼튼하게 하세요.</p>
        </div>
        
        <!-- 하단 중앙 터치바 위쪽 -->
        <div style="text-align: center; margin-bottom: 20px;">
            <button class="btn-primary" style="width: 80%; margin: 0 auto; border-radius: 6px;" onclick="openTips()">건강 정보 더 보기</button>
        </div>
    `
};

// 메인 컨텐츠 영역과 네비게이션 버튼들
const mainContent = document.getElementById('main-content');
const navButtons = document.querySelectorAll('.nav-btn');

// 화면 이동 함수
window.navigate = function(screenName) {
    // 템플릿 주입 (함수 실행)
    mainContent.innerHTML = screens[screenName]();
    
    // 홈 화면일 경우 동적 데이터(약 리스트, 병원 일정) 렌더링
    if(screenName === 'home') {
        renderHomeContent();
    }
    
    // 맨 위로 스크롤
    mainContent.scrollTop = 0;
}

// 홈 화면 동적 렌더링 함수
function renderHomeContent() {
    const medList = document.getElementById('med-list');
    
    if (appData.medications.length === 0) {
        medList.innerHTML = '<p style="text-align:center; padding: 15px; color: var(--text-light);">등록된 약이 없습니다.</p>';
    } else {
        // 먹을 약 목록 렌더링
        medList.innerHTML = appData.medications.map(med => `
            <div class="med-item ${med.taken ? 'taken' : ''}" id="med-${med.id}">
                <div class="med-info">
                    <div class="med-time">${med.time}</div>
                    <div class="med-name">${med.name}</div>
                </div>
                <button class="btn-green" style="padding: 12px 25px; border-radius: 6px;" onclick="takeMed(${med.id})">
                    ${med.taken ? '완료' : '먹었다'}
                </button>
            </div>
        `).join('');
    }

    const hospInfo = document.getElementById('hosp-info');
    
    // 병원 예약 정보 렌더링
    if (appData.hospitalAppointments.length === 0) {
        hospInfo.innerHTML = '<div class="hosp-empty">오늘 및 예정된 일정 없음</div>';
    } else {
        const next = appData.hospitalAppointments[0]; // 다음 일정 하나만 표시
        hospInfo.innerHTML = `
            <div class="hosp-empty" style="padding-bottom: 5px;">오늘 일정 없음</div>
            <div class="hosp-next">
                <p style="color: var(--text-light); font-weight: bold; margin-bottom: 5px;">다음 병원 예약</p>
                <div class="date">${next.date} ${next.time}</div>
                <div class="hosp-title">${next.clinic}</div>
            </div>
        `;
    }
}

// [NFR-01 성능 반영] 1초 이내(즉시) 반영
// "먹었다" 버튼 클릭
window.takeMed = function(id) {
    const med = appData.medications.find(m => m.id === id);
    if(med && !med.taken) {
        med.taken = true;
        saveData(); // 변경사항 로컬 스토리지에 자동 백업
        renderHomeContent(); // 클릭 즉시 (0.01초 이내) UI 반영
    }
};

// 약 삭제 기능
window.deleteMed = function(id) {
    showModal({
        title: '약 삭제',
        message: '정말로 이 약을 삭제하시겠습니까?',
        type: 'confirm',
        onConfirm: () => {
            appData.medications = appData.medications.filter(m => m.id !== id);
            saveData(); // 백업
            navigate('addEditMed'); // 화면 다시 그리기
            showModal({ title: '알림', message: '삭제되었습니다.', type: 'alert' });
        }
    });
};

// 약 수정 기능
window.editMed = function(id) {
    const med = appData.medications.find(m => m.id === id);
    showModal({
        title: '약 수정',
        message: '수정할 약 이름을 입력하세요:',
        type: 'prompt',
        defaultValue: med.name,
        onConfirm: (newName) => {
            if (newName && newName.trim() !== '') {
                med.name = newName;
                saveData(); // 백업
                navigate('addEditMed'); // 화면 다시 그리기
                showModal({ title: '알림', message: '수정되었습니다.', type: 'alert' });
            }
        }
    });
};

// 약 추가 기능
window.addMed = function() {
    const nameInput = document.getElementById('new-med-name');
    const timeInput = document.getElementById('new-med-time');
    
    if(!nameInput.value || !timeInput.value) {
        showModal({ title: '입력 오류', message: '약 이름과 복용 시간을 모두 입력해주세요!', type: 'alert' });
        return;
    }
    
    const newId = appData.medications.length > 0 ? Math.max(...appData.medications.map(m => m.id)) + 1 : 1;
    appData.medications.push({
        id: newId,
        name: nameInput.value,
        time: timeInput.value,
        taken: false
    });
    
    // 복약 시간 순으로 정렬
    appData.medications.sort((a, b) => a.time.localeCompare(b.time));
    saveData(); // 백업
    
    navigate('addEditMed'); // 화면 다시 그리기
    showModal({ title: '등록 완료', message: '새로운 약이 등록되었습니다!', type: 'alert' });
};

// 달력 한달/주간 보기 전환 기능
window.toggleCalendarView = function() {
    appData.calendarView = appData.calendarView === 'week' ? 'month' : 'week';
    saveData(); // 백업
    navigate('calendar');
};

// 병원 일정 추가 기능
window.addHospSchedule = function() {
    const dateInput = document.getElementById('new-hosp-date');
    const timeInput = document.getElementById('new-hosp-time');
    const nameInput = document.getElementById('new-hosp-name');
    
    if(!dateInput.value || !timeInput.value || !nameInput.value) {
        showModal({ title: '입력 오류', message: '날짜, 시간, 병원 내용을 모두 입력해주세요!', type: 'alert' });
        return;
    }
    
    const newId = appData.hospitalAppointments.length > 0 ? Math.max(...appData.hospitalAppointments.map(h => h.id)) + 1 : 1;
    appData.hospitalAppointments.push({
        id: newId,
        date: dateInput.value,
        time: timeInput.value,
        clinic: nameInput.value
    });
    
    // 날짜 및 시간 순으로 정렬
    appData.hospitalAppointments.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    saveData(); // 백업
    
    navigate('calendar');
    showModal({ title: '등록 완료', message: '병원 일정이 등록되었습니다!', type: 'alert' });
};

window.openCamera = () => showModal({title: '카메라', message: '카메라가 실행되어 약 봉투를 촬영합니다.', type: 'alert'});
window.openTips = () => showModal({title: '페이지 이동', message: '더 많은 건강 정보 페이지로 이동합니다.', type: 'alert'});

// 커스텀 모달 기능 로직
window.showModal = function(options) {
    const overlay = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const inputEl = document.getElementById('modal-input');
    const btnCancel = document.getElementById('modal-btn-cancel');
    const btnConfirm = document.getElementById('modal-btn-confirm');
    
    titleEl.innerText = options.title || '알림';
    messageEl.innerText = options.message || '';
    
    if (options.type === 'prompt') {
        inputEl.style.display = 'block';
        inputEl.value = options.defaultValue || '';
    } else {
        inputEl.style.display = 'none';
        inputEl.value = '';
    }
    
    if (options.type === 'confirm' || options.type === 'prompt') {
        btnCancel.style.display = 'block';
    } else {
        btnCancel.style.display = 'none';
    }
    
    overlay.style.display = 'flex';
    
    // 이벤트 리스너 제거 및 재등록 (기존 이벤트 중복 실행 방지)
    const newBtnConfirm = btnConfirm.cloneNode(true);
    const newBtnCancel = btnCancel.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    
    newBtnConfirm.onclick = () => {
        overlay.style.display = 'none';
        if (options.onConfirm) {
            options.onConfirm(options.type === 'prompt' ? inputEl.value : true);
        }
    };
    
    newBtnCancel.onclick = () => {
        overlay.style.display = 'none';
        if (options.onCancel) {
            options.onCancel();
        }
    };
};

// 하단 네비게이션 탭 이벤트 설정
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.getAttribute('data-target');
        navigate(target);
    });
});

// 앱 시작 시 초기 화면 설정
navigate('home');
