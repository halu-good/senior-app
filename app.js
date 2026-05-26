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
        <div style="margin-bottom: 24px;">
            <p style="color: var(--text-light); font-size: 1.05rem; font-weight: 700; margin-bottom: 4px;">안녕하세요, ${appData.userName}님!</p>
            <h1 style="margin: 0; font-size: 1.8rem; font-weight: 900; letter-spacing: -0.02em;">건강하고 활기찬 하루 ☀️</h1>
        </div>
        
        <!-- 프리미엄 대시보드 성실도 카드 -->
        <div class="card" style="background: linear-gradient(135deg, var(--accent) 0%, #115e59 100%); color: white; border: none; padding: 24px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="color: rgba(255,255,255,0.85); font-weight: 700; font-size: 1rem; margin-bottom: 4px;">최근 일주일 복약 성실도</p>
                    <h3 style="font-size: 2rem; font-weight: 900; margin: 0; color: white;">${appData.adherence}%</h3>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.25); border-radius: 4px; margin-top: 16px; overflow: hidden;">
                <div style="width: ${appData.adherence}%; height: 100%; background: #ffffff; border-radius: 4px; transition: width 0.6s ease-out;"></div>
            </div>
        </div>
        
        <div class="card">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <svg width="24" height="24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <h2 style="margin: 0; font-size: 1.3rem;">하루 복약 일정</h2>
            </div>
            <div id="med-list"></div>
        </div>

        <div class="card">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <svg width="24" height="24" fill="none" stroke="var(--btn-red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <h2 style="margin: 0; font-size: 1.3rem;">병원 일정</h2>
            </div>
            <div id="hosp-info"></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 24px;">
            <button class="btn-outline" style="border-color: var(--accent); color: var(--accent);" onclick="navigate('addEditMed')">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                복약 추가 및 수정
            </button>
            <button class="btn-primary" onclick="navigate('adherence')">
                복약 성실도 자세히 보기
            </button>
        </div>
    `,
    
    // 2. 복약 추가 및 수정 화면
    addEditMed: () => `
        <h1>복약 추가 및 수정</h1>
        <div class="card">
            <label>어떤 약인가요?</label>
            <input type="text" id="new-med-name" placeholder="예: 고혈압 약">
            <label>복용 시간</label>
            <input type="time" id="new-med-time">
            
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                <button class="btn-outline" style="border-color: var(--btn-green); color: var(--btn-green); width:100%;" onclick="openCamera()">
                    <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                    약 봉투 사진 촬영
                </button>
                <button class="btn-primary" onclick="addMed()">약 저장하기</button>
            </div>
        </div>
        
        <h2 style="margin-left: 8px; margin-top: 24px; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
            <svg width="22" height="22" fill="none" stroke="var(--accent)" stroke-width="2.5" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M12 3v18M3 12h18"/></svg>
            현재 복용 중인 약목록
        </h2>
        
        <div class="card" style="padding: 16px;">
            ${appData.medications.length > 0 ? appData.medications.map(med => `
                <div class="med-item">
                    <div class="med-info">
                        <span class="med-time">${med.time}</span>
                        <div class="med-name">${med.name}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-outline" style="font-size: 1rem; padding: 10px 14px; border-radius: 12px; border-color: rgba(15, 118, 110, 0.3); color: var(--accent); background-color: var(--accent-light);" onclick="editMed(${med.id})">수정</button>
                        <button class="btn-outline" style="font-size: 1rem; padding: 10px 14px; border-radius: 12px; border-color: rgba(244, 63, 94, 0.3); color: var(--btn-red); background-color: var(--btn-red-light);" onclick="deleteMed(${med.id})">삭제</button>
                    </div>
                </div>
            `).join('') : '<p style="text-align:center; padding: 24px; color: var(--text-light); font-weight: 700;">등록된 약이 없습니다.</p>'}
        </div>
        <button class="btn-outline" style="width:100%; margin-top: 16px;" onclick="navigate('home')">메인으로 돌아가기</button>
    `,

    // 3. 복약 성실도 화면
    adherence: () => `
        <h1>복약 성실도 분석</h1>
        <div class="card text-center" style="position: relative; overflow: hidden; padding: 32px 24px;">
            <p style="font-size: 1.15rem; color: var(--text-light); font-weight: 800; margin-bottom: 20px;">최근 일주일 복약 점수</p>
            <div style="position: relative; width: 160px; height: 160px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" stroke="#f1f5f9" stroke-width="12" fill="none"/>
                    <circle cx="80" cy="80" r="70" stroke="var(--btn-green)" stroke-width="12" fill="none"
                            stroke-dasharray="440" stroke-dashoffset="${440 - (440 * appData.adherence) / 100}"
                            stroke-linecap="round" transform="rotate(-90 80 80)" style="transition: stroke-dashoffset 1s ease-out;"/>
                </svg>
                <div style="position: absolute; font-size: 2.8rem; color: var(--text-main); font-weight: 900;">${appData.adherence}<span style="font-size: 1.5rem; font-weight: 800;">%</span></div>
            </div>
            <p style="font-size: 1.25rem; color: var(--accent); font-weight: 800; line-height: 1.5; word-break: keep-all;">
                훌륭합니다!<br>이대로 건강하게 꾸준히 지켜주세요. 😊
            </p>
        </div>
        
        <div class="card" style="border-left: 6px solid var(--btn-red);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <svg width="24" height="24" fill="none" stroke="var(--btn-red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <h2 style="color: var(--btn-red); margin: 0; font-size: 1.3rem;">빠뜨린 약 기록</h2>
            </div>
            ${appData.missedMeds.map(missed => `
                <p style="font-size: 1.2rem; margin-bottom: 12px; font-weight: 700; color: var(--text-main);">
                    <span style="color: var(--btn-red); background-color: var(--btn-red-light); padding: 4px 10px; border-radius: 20px; font-size: 1rem; margin-right: 8px;">${missed.time}</span> ${missed.name}
                </p>
            `).join('')}
            <div style="background: #f8fafc; padding: 18px; border-radius: 14px; margin-top: 20px; border: 1px solid var(--border-color);">
                <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-light); line-height: 1.5; margin: 0;">💡 <strong>점심 시간(13:00)</strong>에 약 복용을 잊으신 기록이 있습니다. 알림 소리를 더 크게 설정해 드릴까요?</p>
            </div>
        </div>
        <button class="btn-outline" style="width:100%; margin-top: 16px;" onclick="navigate('home')">돌아가기</button>
    `,

    // 4. 달력 (일정) 화면
    calendar: () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // 1-indexed (May = 5)
        
        // 오늘을 포함한 미래의 일정만 필터링하여 예약 정보 목록에 노출
        const todayStr = formatDateString(today);
        const activeAppointments = appData.hospitalAppointments.filter(h => h.date >= todayStr);
        
        return `
        <div class="flex-row" style="margin-bottom: 24px;">
            <h1 style="margin: 0;">달력 일정</h1>
            
            <!-- 세련된 알약 형태 세그먼트 컨트롤 -->
            <div style="background: #e2e8f0; padding: 4px; border-radius: 12px; display: inline-flex; gap: 4px;">
                <button style="font-size: 0.95rem; padding: 6px 14px; border-radius: 8px; font-weight: 800; box-shadow: ${appData.calendarView === 'week' ? 'var(--shadow-sm)' : 'none'}; background: ${appData.calendarView === 'week' ? '#ffffff' : 'transparent'}; color: ${appData.calendarView === 'week' ? 'var(--text-main)' : 'var(--text-light)'}; height: auto; border:none; transition: all 0.2s;" onclick="toggleCalendarView()">주간</button>
                <button style="font-size: 0.95rem; padding: 6px 14px; border-radius: 8px; font-weight: 800; box-shadow: ${appData.calendarView === 'month' ? 'var(--shadow-sm)' : 'none'}; background: ${appData.calendarView === 'month' ? '#ffffff' : 'transparent'}; color: ${appData.calendarView === 'month' ? 'var(--text-main)' : 'var(--text-light)'}; height: auto; border:none; transition: all 0.2s;" onclick="toggleCalendarView()">한달</button>
            </div>
        </div>
        
        <div class="card">
            <div class="calendar-header">
                <button class="btn-outline" style="border:none; font-size: 1.5rem; padding: 6px 12px; border-radius: 50%; background: #f1f5f9; display: flex; align-items:center; justify-content:center; width:38px; height:38px;">◀</button>
                <h2 style="margin:0; font-size: 1.4rem; color: var(--text-main); font-weight:900;">${appData.calendarView === 'week' ? `${month}월 ${getWeekNumber(today)}주차` : `${month}월 전체`}</h2>
                <button class="btn-outline" style="border:none; font-size: 1.5rem; padding: 6px 12px; border-radius: 50%; background: #f1f5f9; display: flex; align-items:center; justify-content:center; width:38px; height:38px;">▶</button>
            </div>
            <div class="calendar-grid">
                <div class="cal-day-header">월</div><div class="cal-day-header">화</div><div class="cal-day-header">수</div><div class="cal-day-header">목</div><div class="cal-day-header">금</div><div class="cal-day-header">토</div><div class="cal-day-header" style="color: var(--btn-red);">일</div>
                
                ${getCalendarHTML()}
            </div>
            
            ${activeAppointments.length > 0 ? activeAppointments.map(hosp => `
                <div class="mt-20" style="padding: 20px; background: linear-gradient(to right, #ffffff, #fff1f2); border-radius: 16px; border-left: 6px solid var(--btn-red); border: 1px solid var(--border-color); border-left-width: 6px; box-shadow: var(--shadow-sm);">
                    <p style="color: var(--text-light); font-weight: 800; font-size: 1.05rem; display:flex; align-items:center; gap:6px;">
                        <svg width="18" height="18" fill="none" stroke="var(--btn-red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${hosp.date} 예약 정보
                    </p>
                    <p style="font-size: 1.35rem; font-weight: 900; margin-top: 10px; color: var(--btn-red); line-height:1.4;">${hosp.clinic}<br><span style="font-size: 1.15rem; color: var(--text-main);">${hosp.time}</span></p>
                </div>
            `).join('') : `
                <div class="hosp-empty" style="margin-top: 20px;">📅 예정된 병원 예약이 없습니다.</div>
            `}
        </div>
        
        <button class="btn-green" style="width: 100%; margin-top: 16px;" onclick="navigate('addSchedule')">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            병원 일정 추가하기
        </button>
    `;
    },

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
            
            <button class="btn-primary" style="margin-top: 12px;" onclick="addHospSchedule()">일정 저장하기</button>
        </div>
        <button class="btn-outline" style="width: 100%; margin-top: 16px;" onclick="navigate('calendar')">돌아가기</button>
    `,

    // 6. 건강 정보 화면
    tips: () => `
        <h1 style="text-align: center; margin-bottom: 24px;">건강 상식 돋보기 🔍</h1>
        
        <div class="card" style="padding: 0; overflow: hidden; border-radius: 24px; margin-bottom: 24px;">
            <div style="width: 100%; height: 180px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); display: flex; justify-content: center; align-items: center; font-size: 1.8rem; color: #ffffff; font-weight: 900; letter-spacing: -0.02em;">
                관절 건강 🦵
            </div>
            <div style="padding: 24px 20px;">
                <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-bottom: 8px;">무릎 관절에 좋은 운동법</h2>
                <p style="color: var(--text-light); font-size: 1.1rem; line-height: 1.6;">가벼운 평지 걷기와 하루 10분 정도 대퇴사두근 스트레칭을 꾸준히 하시면 무릎 주변 근육을 튼튼하게 해주어 통증을 예방합니다.</p>
            </div>
        </div>
        
        <div class="card" style="padding: 0; overflow: hidden; border-radius: 24px; margin-bottom: 24px;">
            <div style="width: 100%; height: 180px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); display: flex; justify-content: center; align-items: center; font-size: 1.8rem; color: #ffffff; font-weight: 900; letter-spacing: -0.02em;">
                뼈 건강 ☀️
            </div>
            <div style="padding: 24px 20px;">
                <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-bottom: 8px;">비타민D 햇빛 충전</h2>
                <p style="color: var(--text-light); font-size: 1.1rem; line-height: 1.6;">자외선 차단제를 바르지 않고 낮에 15~20분간 햇볕을 쬐면 신체에 필요한 비타민D가 자연 생성되어 골다공증을 예방해 줍니다.</p>
            </div>
        </div>
    `
};

// 메인 컨텐츠 영역과 네비게이션 버튼들
const mainContent = document.getElementById('main-content');
const navButtons = document.querySelectorAll('.nav-btn');

// 화면 이동 함수 (일정 추가 화면 진입 시 날짜 매개변수 지원)
window.navigate = function(screenName, dateParam) {
    if (screenName === 'addSchedule') {
        window.selectedCalendarDate = dateParam || '';
    }
    
    // 템플릿 주입 (함수 실행)
    mainContent.innerHTML = screens[screenName]();
    
    // 홈 화면일 경우 동적 데이터(약 리스트, 병원 일정) 렌더링
    if(screenName === 'home') {
        renderHomeContent();
    }
    
    // 일정 추가 화면이고 전달받은 날짜가 있을 때 인풋창에 프리필 채우기
    if(screenName === 'addSchedule' && window.selectedCalendarDate) {
        setTimeout(() => {
            const dateInput = document.getElementById('new-hosp-date');
            if (dateInput) {
                dateInput.value = window.selectedCalendarDate;
            }
        }, 0);
    }
    
    // 맨 위로 스크롤
    mainContent.scrollTop = 0;
};

// 홈 화면 동적 렌더링 함수
function renderHomeContent() {
    const medList = document.getElementById('med-list');
    
    if (appData.medications.length === 0) {
        medList.innerHTML = '<p style="text-align:center; padding: 24px; color: var(--text-light); font-weight: 700;">등록된 약이 없습니다.</p>';
    } else {
        // 먹을 약 목록 렌더링
        medList.innerHTML = appData.medications.map(med => `
            <div class="med-item ${med.taken ? 'taken' : ''}" id="med-${med.id}">
                <div class="med-info">
                    <span class="med-time">${med.time}</span>
                    <div class="med-name">${med.name}</div>
                </div>
                ${med.taken ? `
                    <button class="btn-outline" style="padding: 10px 18px; border-radius: 12px; font-size: 1.05rem; min-width: 90px; color: var(--btn-green); border-color: rgba(16, 185, 129, 0.3); background-color: var(--btn-green-light); height: auto;" onclick="takeMed(${med.id})">
                        ✓ 완료
                    </button>
                ` : `
                    <button class="btn-green" style="padding: 10px 18px; border-radius: 12px; font-size: 1.05rem; min-width: 90px; height: auto;" onclick="takeMed(${med.id})">
                        먹었다
                    </button>
                `}
            </div>
        `).join('');
    }

    const hospInfo = document.getElementById('hosp-info');
    
    // 오늘 날짜 구하기 (YYYY-MM-DD)
    const todayStr = formatDateString(new Date());
    
    // 오늘을 포함한 미래의 일정만 필터링하여 홈 화면에 표시
    const activeAppointments = appData.hospitalAppointments.filter(h => h.date >= todayStr);
    
    // 병원 예약 정보 렌더링
    if (activeAppointments.length === 0) {
        hospInfo.innerHTML = '<div class="hosp-empty">📅 예정된 병원 일정이 없습니다.</div>';
    } else {
        const next = activeAppointments[0]; // 다음 일정 하나만 표시
        hospInfo.innerHTML = `
            <div class="hosp-next">
                <div class="date">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    ${next.date} ${next.time}
                </div>
                <div class="hosp-title">${next.clinic}</div>
            </div>
        `;
    }
}

// [NFR-01 성능 반영] 1초 이내(즉시) 반영
// "먹었다" 및 "완료" 버튼 클릭 (토글하여 취소 가능 및 성실도 연동)
window.takeMed = function(id) {
    const med = appData.medications.find(m => m.id === id);
    if(med) {
        med.taken = !med.taken;
        
        // 최근 일주일 복약 성실도(adherence)도 복약 상태에 따라 유동적으로 조절
        const total = appData.medications.length;
        if (total > 0) {
            const takenCount = appData.medications.filter(m => m.taken).length;
            appData.adherence = Math.round((takenCount / total) * 40) + 60; // 60% ~ 100% 범위로 사실감 있게 매칭
        }
        
        saveData(); // 변경사항 로컬 스토리지에 자동 백업
        
        // 홈 화면 전체를 실시간 다시 그리면서 성실도 게이지와 카드를 부드럽게 업데이트!
        navigate('home');
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

// ==========================================
// 📅 동적 달력 생성 및 일정 관리 연동 헬퍼 함수
// ==========================================

// 달력 날짜 생성 헬퍼 함수
function getCalendarHTML() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentDay = today.getDate();
    
    let html = '';
    
    if (appData.calendarView === 'week') {
        // 주간 보기: 오늘이 속한 주의 월요일부터 일요일까지 7일 계산
        let dayOfWeek = today.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7; // 일요일을 7로 변환 (월~일 순서)
        
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek - 1));
        
        for (let i = 0; i < 7; i++) {
            const tempDate = new Date(monday);
            tempDate.setDate(monday.getDate() + i);
            
            const dateStr = formatDateString(tempDate);
            const isToday = tempDate.getDate() === currentDay && tempDate.getMonth() === currentMonth;
            
            // 미래의 활성 병원 일정이 있는지 매칭
            const todayStr = formatDateString(today);
            const hasHosp = appData.hospitalAppointments.some(h => h.date === dateStr && h.date >= todayStr);
            
            html += `
                <div class="cal-day ${isToday ? 'active' : ''} ${hasHosp ? 'has-hosp' : ''}" 
                     onclick="clickCalendarDay('${dateStr}')">
                    ${tempDate.getDate()}
                </div>
            `;
        }
    } else {
        // 한달 보기: 이번 달의 전체 날짜 렌더링
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        let startDay = firstDayOfMonth.getDay();
        if (startDay === 0) startDay = 7;
        
        // 이전 달 날짜 채우기 (opacity 0.3)
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        const prevDaysCount = startDay - 1;
        for (let i = prevDaysCount - 1; i >= 0; i--) {
            const prevDay = prevMonthLastDay - i;
            const prevDateObj = new Date(currentYear, currentMonth - 1, prevDay);
            const dateStr = formatDateString(prevDateObj);
            html += `<div class="cal-day" style="opacity:0.3" onclick="clickCalendarDay('${dateStr}')">${prevDay}</div>`;
        }
        
        // 이번 달 날짜 채우기
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const todayStr = formatDateString(today);
        for (let day = 1; day <= lastDayOfMonth; day++) {
            const dateObj = new Date(currentYear, currentMonth, day);
            const dateStr = formatDateString(dateObj);
            const isToday = day === currentDay;
            const hasHosp = appData.hospitalAppointments.some(h => h.date === dateStr && h.date >= todayStr);
            
            html += `
                <div class="cal-day ${isToday ? 'active' : ''} ${hasHosp ? 'has-hosp' : ''}" 
                     onclick="clickCalendarDay('${dateStr}')">
                    ${day}
                </div>
            `;
        }
        
        // 다음 달 날짜 채우기 (총 42칸 기준)
        const totalRendered = prevDaysCount + lastDayOfMonth;
        const nextDaysCount = 42 - totalRendered;
        for (let day = 1; day <= nextDaysCount; day++) {
            const nextDateObj = new Date(currentYear, currentMonth + 1, day);
            const dateStr = formatDateString(nextDateObj);
            html += `<div class="cal-day" style="opacity:0.3" onclick="clickCalendarDay('${dateStr}')">${day}</div>`;
        }
    }
    
    return html;
}

// YYYY-MM-DD 날짜 포맷 변환 헬퍼
function formatDateString(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// 주차 번호 구하기 헬퍼
function getWeekNumber(date) {
    const currentDate = date.getDate();
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    let startDay = startOfMonth.getDay();
    if (startDay === 0) startDay = 7;
    return Math.ceil((currentDate + startDay - 1) / 7);
}

// 달력 날짜 클릭 시 이벤트 핸들러
window.clickCalendarDay = function(dateStr) {
    const todayStr = formatDateString(new Date());
    
    // 이미 지난 과거 날짜 클릭 제한 또는 경고
    if (dateStr < todayStr) {
        showModal({
            title: '확인 불가',
            message: '지난 날짜의 예약 일정은 등록하거나 조회할 수 없습니다. 미래의 일정을 선택해 주세요.',
            type: 'alert'
        });
        return;
    }
    
    // 미래 일정 추가 또는 조회
    const appointments = appData.hospitalAppointments.filter(h => h.date === dateStr);
    const formattedDate = dateStr.replace(/-/g, '. '); // 예: 2026. 05. 26
    
    if (appointments.length > 0) {
        const scheduleNames = appointments.map(h => `• ${h.clinic} (${h.time})`).join('\n');
        showModal({
            title: '예약 일정 확인',
            message: `${formattedDate}에 다음 예약이 이미 있습니다:\n\n${scheduleNames}\n\n이 날짜에 새로운 병원 일정을 더 추가하시겠습니까?`,
            type: 'confirm',
            onConfirm: () => {
                navigate('addSchedule', dateStr);
            }
        });
    } else {
        showModal({
            title: '병원 일정 등록',
            message: `${formattedDate}에 새로운 예약을 등록하시겠습니까?`,
            type: 'confirm',
            onConfirm: () => {
                navigate('addSchedule', dateStr);
            }
        });
    }
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

// =====================================================
// ⚙️ 설정 기능 (Settings Panel)
// =====================================================

// 설정 로컬스토리지 초기값
const defaultSettings = {
    volume: 70,
    soundIndex: 0,
    fontSize: 'medium',
    themeColor: 'teal',
    widgets: {
        adherence: true,
        hospital: true,
        tips: false
    }
};

let appSettings = JSON.parse(localStorage.getItem('seniorAppSettings')) || defaultSettings;

function saveSettings() {
    localStorage.setItem('seniorAppSettings', JSON.stringify(appSettings));
}

// 설정 패널 열기
window.openSettings = function() {
    const overlay = document.getElementById('settings-overlay');
    overlay.style.display = 'flex';

    // 현재 저장된 설정값 UI에 반영
    syncSettingsUI();

    // 설정 버튼 active 표시
    document.getElementById('settings-nav-btn').classList.add('active');
};

// 설정 패널 닫기
window.closeSettings = function() {
    const panel = document.getElementById('settings-panel');
    panel.style.animation = 'slideDownPanel 0.28s cubic-bezier(0.4, 0, 1, 1) forwards';

    // 애니메이션 후 숨기기
    setTimeout(() => {
        const overlay = document.getElementById('settings-overlay');
        overlay.style.display = 'none';
        panel.style.animation = '';
        document.getElementById('settings-nav-btn').classList.remove('active');
    }, 260);
};

// CSS에 닫기 애니메이션 동적 추가
(function() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDownPanel {
            from { transform: translateY(0);    opacity: 1; }
            to   { transform: translateY(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
})();

// 설정 UI 동기화 (저장된 값 → 화면 반영)
function syncSettingsUI() {
    // 볼륨
    const volSlider = document.getElementById('volume-slider');
    const volDisplay = document.getElementById('volume-display');
    if (volSlider && volDisplay) {
        volSlider.value = appSettings.volume;
        volDisplay.textContent = appSettings.volume + '%';
        updateSliderBackground(volSlider);
    }

    // 알람 소리
    [0, 1, 2].forEach(i => {
        const btn = document.getElementById('sound-' + i);
        if (btn) btn.classList.toggle('active', appSettings.soundIndex === i);
    });

    // 글씨 크기
    ['small', 'medium', 'large', 'xlarge'].forEach(size => {
        const btn = document.getElementById('fs-' + size);
        if (btn) btn.classList.toggle('active', appSettings.fontSize === size);
    });
    const fsSizes = { small: '작게', medium: '보통', large: '크게', xlarge: '매우 크게' };
    const fsDisplay = document.getElementById('fontsize-display');
    if (fsDisplay) fsDisplay.textContent = fsSizes[appSettings.fontSize];

    // 테마 색상
    ['teal', 'blue', 'purple'].forEach(color => {
        const btn = document.getElementById('theme-' + color);
        if (btn) btn.classList.toggle('active', appSettings.themeColor === color);
    });

    // 위젯 토글
    Object.entries(appSettings.widgets).forEach(([key, val]) => {
        const el = document.getElementById('widget-' + key);
        if (el) el.checked = val;
    });
}

// 슬라이더 배경 그라데이션 동적 업데이트
function updateSliderBackground(slider) {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, var(--accent) ${pct}%, #e2e8f0 ${pct}%)`;
}

// ── 볼륨 조절 ──
window.updateVolume = function(val) {
    appSettings.volume = parseInt(val);
    const display = document.getElementById('volume-display');
    if (display) display.textContent = val + '%';
    updateSliderBackground(document.getElementById('volume-slider'));
    saveSettings();

    // 볼륨 레벨 시각 피드백 (간단한 "삐" 소리 대신 AudioContext로 미리보기)
    playPreviewSound(appSettings.soundIndex, appSettings.volume);
};

// ── 알람 소리 선택 ──
window.selectSound = function(index) {
    appSettings.soundIndex = index;
    [0, 1, 2].forEach(i => {
        const btn = document.getElementById('sound-' + i);
        if (btn) btn.classList.toggle('active', i === index);
    });
    saveSettings();

    // 선택한 소리 미리듣기
    playPreviewSound(index, appSettings.volume);
};

// 알람 소리 미리듣기 (Web Audio API로 간단 구현)
function playPreviewSound(soundIndex, volume) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume / 100;
        gainNode.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.connect(gainNode);

        // 소리 종류에 따라 다른 패턴
        if (soundIndex === 0) {
            // 기본 벨: 단순 싸인파
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } else if (soundIndex === 1) {
            // 잔잔한 멜로디: 부드러운 삼각파
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523, ctx.currentTime);
            osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
            osc.frequency.setValueAtTime(784, ctx.currentTime + 0.30);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.55);
        } else {
            // 경쾌한 알람: 짧고 반복적인 구형파
            osc.type = 'square';
            gainNode.gain.setValueAtTime(volume / 200, ctx.currentTime);
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.setValueAtTime(550, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        }
    } catch(e) {
        // AudioContext 미지원 시 무시
    }
}

// ── 글씨 크기 설정 ──
window.setFontSize = function(size) {
    appSettings.fontSize = size;

    // 버튼 active 처리
    ['small', 'medium', 'large', 'xlarge'].forEach(s => {
        const btn = document.getElementById('fs-' + s);
        if (btn) btn.classList.toggle('active', s === size);
    });

    const fsSizes = { small: '작게', medium: '보통', large: '크게', xlarge: '매우 크게' };
    const display = document.getElementById('fontsize-display');
    if (display) display.textContent = fsSizes[size];

    // 실제 폰트 크기를 body에 적용
    const fontMap = { small: '15px', medium: '18px', large: '21px', xlarge: '24px' };
    document.body.style.fontSize = fontMap[size];

    saveSettings();
};

// ── 테마 색상 변경 ──
window.setThemeColor = function(color) {
    appSettings.themeColor = color;

    // 버튼 active 처리
    ['teal', 'blue', 'purple'].forEach(c => {
        const btn = document.getElementById('theme-' + c);
        if (btn) btn.classList.toggle('active', c === color);
    });

    // CSS 변수 실시간 교체
    const root = document.documentElement;
    const themes = {
        teal: {
            '--accent': '#0f766e',
            '--accent-light': '#f0fdfa',
            '--accent-hover': '#115e59',
            '--btn-green': '#10b981',
            '--btn-green-light': '#ecfdf5'
        },
        blue: {
            '--accent': '#1d4ed8',
            '--accent-light': '#eff6ff',
            '--accent-hover': '#1e40af',
            '--btn-green': '#3b82f6',
            '--btn-green-light': '#dbeafe'
        },
        purple: {
            '--accent': '#7c3aed',
            '--accent-light': '#f5f3ff',
            '--accent-hover': '#6d28d9',
            '--btn-green': '#a78bfa',
            '--btn-green-light': '#ede9fe'
        }
    };

    const theme = themes[color];
    Object.entries(theme).forEach(([prop, val]) => {
        root.style.setProperty(prop, val);
    });

    // 슬라이더 배경도 업데이트
    const slider = document.getElementById('volume-slider');
    if (slider) updateSliderBackground(slider);

    saveSettings();
};

// ── 위젯 토글 ──
window.toggleWidget = function(widgetKey, isOn) {
    appSettings.widgets[widgetKey] = isOn;
    saveSettings();
    // 홈이 현재 화면이라면 즉시 반영
    // (다음에 홈 진입할 때 반영되므로 별도 처리 불필요)
};

// ── 복용 약 기록 모아보기 ──
window.openMedHistory = function() {
    const modal = document.getElementById('med-history-modal');
    const content = document.getElementById('med-history-content');
    modal.style.display = 'flex';

    const meds = appData.medications;
    if (meds.length === 0) {
        content.innerHTML = `<div class="history-empty">💊 등록된 복용 약이 없습니다.</div>`;
        return;
    }

    content.innerHTML = meds.map(med => `
        <div class="history-med-card">
            <div class="history-med-img">${getMedEmoji(med.name)}</div>
            <div class="history-med-info">
                <strong>${med.name}</strong>
                <span>복용 시간: ${med.time}</span>
                <div style="margin-top:6px;">
                    ${med.taken
                        ? `<span style="background:#ecfdf5; color:#10b981; padding:3px 10px; border-radius:99px; font-size:0.85rem; font-weight:800;">✓ 오늘 복용 완료</span>`
                        : `<span style="background:#fff1f2; color:#f43f5e; padding:3px 10px; border-radius:99px; font-size:0.85rem; font-weight:800;">○ 미복용</span>`
                    }
                </div>
            </div>
        </div>
    `).join('');
};

// 약 이름으로 이모지 추정
function getMedEmoji(name) {
    if (name.includes('혈압') || name.includes('심장')) return '❤️';
    if (name.includes('당뇨') || name.includes('인슐린')) return '💉';
    if (name.includes('관절') || name.includes('뼈') || name.includes('칼슘')) return '🦴';
    if (name.includes('치매') || name.includes('뇌')) return '🧠';
    if (name.includes('비타민') || name.includes('영양')) return '🌿';
    if (name.includes('수면') || name.includes('안정')) return '😴';
    if (name.includes('위') || name.includes('장') || name.includes('소화')) return '🟡';
    return '💊';
}

// ── 병원 예약 기록 모아보기 (최근 1년) ──
window.openHospHistory = function() {
    const modal = document.getElementById('hosp-history-modal');
    const content = document.getElementById('hosp-history-content');
    modal.style.display = 'flex';

    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const oneYearAgoStr = formatDateString(oneYearAgo);

    // 최근 1년 내 예약 전체 (날짜 내림차순)
    const recentHosp = [...appData.hospitalAppointments]
        .filter(h => h.date >= oneYearAgoStr)
        .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    if (recentHosp.length === 0) {
        content.innerHTML = `<div class="history-empty">🏥 최근 1년간 예약 기록이 없습니다.</div>`;
        return;
    }

    // 오늘 날짜 기준으로 과거/미래 구분
    const todayStr = formatDateString(today);

    content.innerHTML = recentHosp.map(h => {
        const isPast = h.date < todayStr;
        return `
            <div class="history-hosp-card">
                <div class="hosp-date">
                    ${isPast ? '✅' : '📅'} ${h.date.replace(/-/g, '. ')}
                    ${isPast
                        ? `<span style="margin-left:8px; font-size:0.8rem; background:#f1f5f9; color:var(--text-light); padding:2px 8px; border-radius:99px;">진료 완료</span>`
                        : `<span style="margin-left:8px; font-size:0.8rem; background:#fff1f2; color:var(--btn-red); padding:2px 8px; border-radius:99px;">예정</span>`
                    }
                </div>
                <div class="hosp-name">${h.clinic}</div>
                <div class="hosp-time">🕐 ${h.time}</div>
            </div>
        `;
    }).join('');
};

// ── 앱 시작 시 저장된 설정 복원 ──
(function applyStoredSettings() {
    // 폰트 크기
    const fontMap = { small: '15px', medium: '18px', large: '21px', xlarge: '24px' };
    document.body.style.fontSize = fontMap[appSettings.fontSize] || '18px';

    // 테마 색상
    if (appSettings.themeColor && appSettings.themeColor !== 'teal') {
        const root = document.documentElement;
        const themes = {
            blue: {
                '--accent': '#1d4ed8',
                '--accent-light': '#eff6ff',
                '--accent-hover': '#1e40af',
                '--btn-green': '#3b82f6',
                '--btn-green-light': '#dbeafe'
            },
            purple: {
                '--accent': '#7c3aed',
                '--accent-light': '#f5f3ff',
                '--accent-hover': '#6d28d9',
                '--btn-green': '#a78bfa',
                '--btn-green-light': '#ede9fe'
            }
        };
        const theme = themes[appSettings.themeColor];
        if (theme) {
            Object.entries(theme).forEach(([prop, val]) => {
                root.style.setProperty(prop, val);
            });
        }
    }
})();

