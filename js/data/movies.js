// 이모티콘으로 표현하는 영화 퀴즈 - 영화 데이터
// 중학생(2026년 기준)이 널리 아는 영화만 담았어요. 청소년 관람불가 영화는 제외했어요.

export const MOVIE_CATEGORIES = ['애니메이션', '한국 영화', '히어로·액션', '판타지·모험', '명작·가족'];

export const MOVIES = [
  // ===== 애니메이션 =====
  { title: '겨울왕국', emoji: '❄️👸👸⛄', hint: '얼음 마법을 쓰는 언니와 동생 이야기예요', category: '애니메이션', year: 2013 },
  { title: '인사이드 아웃', emoji: '🧠😊😢😡😱', hint: '소녀의 머릿속 감정들이 주인공이에요', category: '애니메이션', year: 2015 },
  { title: '니모를 찾아서', emoji: '🐠🔍🌊🐟', hint: '아빠 물고기가 잃어버린 아들을 찾아 떠나요', category: '애니메이션', year: 2003 },
  { title: '토이 스토리', emoji: '🤠🚀🧸👦', hint: '주인이 없을 때 장난감들이 살아 움직여요', category: '애니메이션', year: 1995 },
  { title: '라이온 킹', emoji: '🦁👑🌅🐗', hint: '아기 사자가 자라서 왕이 되는 이야기예요', category: '애니메이션', year: 1994 },
  { title: '센과 치히로의 행방불명', emoji: '👧🏮🐉🛁', hint: '신들의 온천장에서 일하게 된 소녀 이야기예요', category: '애니메이션', year: 2001 },
  { title: '이웃집 토토로', emoji: '🌳🐱🚌☔', hint: '숲의 정령과 고양이 버스가 나와요', category: '애니메이션', year: 1988 },
  { title: '슈렉', emoji: '👹🐴👸🏰', hint: '초록색 괴물과 수다쟁이 당나귀가 나와요', category: '애니메이션', year: 2001 },
  { title: '업', emoji: '🎈🏠👴👦', hint: '풍선을 매단 집을 타고 모험을 떠나요', category: '애니메이션', year: 2009 },
  { title: '코코', emoji: '💀🎸🌼👦', hint: '죽은 자들의 세상에서 가족을 만나요', category: '애니메이션', year: 2017 },
  { title: '주토피아', emoji: '🐰👮🦊🏙️', hint: '토끼 경찰과 여우가 함께 사건을 해결해요', category: '애니메이션', year: 2016 },
  { title: '쿵푸팬더', emoji: '🐼🥋🥟🐉', hint: '국수 가게 판다가 무술 고수가 돼요', category: '애니메이션', year: 2008 },
  { title: '하울의 움직이는 성', emoji: '🏰🚶🔥👵', hint: '걸어 다니는 성과 할머니가 된 소녀가 나와요', category: '애니메이션', year: 2004 },
  { title: '엘리멘탈', emoji: '🔥💧🏙️💕', hint: '불과 물이 만나 사랑에 빠지는 이야기예요', category: '애니메이션', year: 2023 },
  { title: '모아나', emoji: '🌊🛶🏝️🐓', hint: '바다의 선택을 받은 소녀가 항해를 떠나요', category: '애니메이션', year: 2016 },

  // ===== 한국 영화 =====
  { title: '부산행', emoji: '🚄🧟👨‍👧😱', hint: '달리는 기차 안에서 좀비와 맞서 싸워요', category: '한국 영화', year: 2016 },
  { title: '극한직업', emoji: '👮🍗🔥💰', hint: '잠복 수사하던 형사들이 치킨집을 차려요', category: '한국 영화', year: 2019 },
  { title: '명량', emoji: '⚔️🚢🌊🐢', hint: '열두 척의 배로 큰 승리를 거둔 해전이에요', category: '한국 영화', year: 2014 },
  { title: '신과함께-죄와 벌', emoji: '👼⚖️🔥🚒', hint: '죽은 뒤 저승에서 일곱 번의 재판을 받아요', category: '한국 영화', year: 2017 },
  { title: '기생충', emoji: '🏠🪜🍑🌧️', hint: '반지하 가족이 부잣집에 들어가 일해요', category: '한국 영화', year: 2019 },
  { title: '엑시트', emoji: '🧗🏢💨🆘', hint: '유독가스를 피해 건물을 타고 탈출해요', category: '한국 영화', year: 2019 },
  { title: '범죄도시', emoji: '👊👮💪🏙️', hint: '주먹 하나로 범죄자를 잡는 괴물 형사가 나와요', category: '한국 영화', year: 2017 },
  { title: '해운대', emoji: '🌊🏖️😱🏙️', hint: '부산 바닷가에 거대한 쓰나미가 덮쳐요', category: '한국 영화', year: 2009 },
  { title: '국제시장', emoji: '👨‍👩‍👧‍👦🚢🏪👴', hint: '가족을 위해 평생을 살아온 아버지 이야기예요', category: '한국 영화', year: 2014 },
  { title: '괴물', emoji: '🐟👾🌉👧', hint: '한강에 나타난 괴생명체에게 딸을 빼앗겨요', category: '한국 영화', year: 2006 },
  { title: '서울의 봄', emoji: '🪖🌃⏳🚧', hint: '하룻밤 사이에 벌어진 군사 반란 이야기예요', category: '한국 영화', year: 2023 },
  { title: '파묘', emoji: '⚰️⛏️🌲👻', hint: '무덤을 옮기다가 기이한 일이 벌어져요', category: '한국 영화', year: 2024 },
  { title: '택시운전사', emoji: '🚕📷🧔🛣️', hint: '외국 기자를 태우고 광주로 간 택시 기사 이야기예요', category: '한국 영화', year: 2017 },
  { title: '7번방의 선물', emoji: '👨‍👧🔒🎈🎁', hint: '교도소 방 동료들이 아빠와 딸을 도와요', category: '한국 영화', year: 2013 },

  // ===== 히어로·액션 =====
  { title: '어벤져스: 엔드게임', emoji: '🦸💎🧤⏳', hint: '사라진 동료들을 되찾으려 시간 여행을 해요', category: '히어로·액션', year: 2019 },
  { title: '아이언맨', emoji: '🦾🔴🟡🚀', hint: '천재 사업가가 강철 슈트를 만들어 입어요', category: '히어로·액션', year: 2008 },
  { title: '스파이더맨: 노 웨이 홈', emoji: '🕷️🕸️🧙🌀', hint: '멀티버스가 열리며 여러 영웅이 만나요', category: '히어로·액션', year: 2021 },
  { title: '블랙 팬서', emoji: '🐆👑💎🌍', hint: '비밀 왕국 와칸다의 왕이 주인공이에요', category: '히어로·액션', year: 2018 },
  { title: '캡틴 아메리카: 퍼스트 어벤져', emoji: '🛡️⭐💪🧊', hint: '약했던 청년이 슈퍼 솔저가 돼요', category: '히어로·액션', year: 2011 },
  { title: '토르: 천둥의 신', emoji: '🔨⚡👑🌈', hint: '망치를 든 천둥의 신이 지구로 쫓겨나요', category: '히어로·액션', year: 2011 },
  { title: '다크 나이트', emoji: '🦇🃏🌃🚓', hint: '박쥐 영웅이 웃는 얼굴의 악당과 대결해요', category: '히어로·액션', year: 2008 },
  { title: '원더 우먼', emoji: '👸🛡️⚔️🏝️', hint: '여성 전사들의 섬에서 온 공주 영웅이에요', category: '히어로·액션', year: 2017 },
  { title: '가디언즈 오브 갤럭시', emoji: '🚀🦝🌳🎧', hint: '너구리와 나무가 함께 우주를 지켜요', category: '히어로·액션', year: 2014 },
  { title: '닥터 스트레인지', emoji: '🧙🌀🔮🩺', hint: '사고를 당한 외과 의사가 마법사가 돼요', category: '히어로·액션', year: 2016 },
  { title: '앤트맨', emoji: '🐜👨🔬📏', hint: '몸을 개미만큼 작게 줄이는 영웅이에요', category: '히어로·액션', year: 2015 },
  { title: '미션 임파서블', emoji: '🕵️💣📼🧗', hint: '불가능한 임무를 해내는 첩보 요원 이야기예요', category: '히어로·액션', year: 1996 },
  { title: '탑건: 매버릭', emoji: '✈️🕶️🏔️👨‍✈️', hint: '전설의 조종사가 후배 조종사들을 가르쳐요', category: '히어로·액션', year: 2022 },
  { title: '아쿠아맨', emoji: '🔱🌊🐙👑', hint: '바다 왕국의 왕이 될 운명의 영웅이에요', category: '히어로·액션', year: 2018 },

  // ===== 판타지·모험 =====
  { title: '해리 포터와 마법사의 돌', emoji: '⚡👓🧙🦉', hint: '열한 살 소년이 마법 학교에 입학해요', category: '판타지·모험', year: 2001 },
  { title: '해리 포터와 비밀의 방', emoji: '🐍📖🚗⚡', hint: '학교에 숨겨진 방과 거대한 뱀이 나와요', category: '판타지·모험', year: 2002 },
  { title: '해리 포터와 아즈카반의 죄수', emoji: '🐺🦅⏳🌕', hint: '시간을 돌리는 목걸이와 늑대인간이 나와요', category: '판타지·모험', year: 2004 },
  { title: '반지의 제왕: 반지 원정대', emoji: '💍🌋🧙🧝', hint: '절대 반지를 없애러 먼 길을 떠나요', category: '판타지·모험', year: 2001 },
  { title: '나니아 연대기: 사자, 마녀 그리고 옷장', emoji: '🦁🚪❄️👑', hint: '옷장 문을 열면 눈 덮인 마법 나라가 나와요', category: '판타지·모험', year: 2005 },
  { title: '캐리비안의 해적: 블랙펄의 저주', emoji: '🏴‍☠️⚓💀🦜', hint: '저주받은 해적선과 괴짜 선장이 나와요', category: '판타지·모험', year: 2003 },
  { title: '아바타', emoji: '🌳💙🐉🪐', hint: '파란 피부의 종족이 사는 행성 이야기예요', category: '판타지·모험', year: 2009 },
  { title: '찰리와 초콜릿 공장', emoji: '🍫🏭🎫👦', hint: '황금 티켓을 찾은 소년이 공장을 구경해요', category: '판타지·모험', year: 2005 },
  { title: '쥬만지: 새로운 세계', emoji: '🎮🌴🦏🎲', hint: '비디오 게임 속 정글로 빨려 들어가요', category: '판타지·모험', year: 2017 },
  { title: '박물관이 살아있다', emoji: '🏛️🦖🌙🗿', hint: '밤이 되면 전시물들이 살아 움직여요', category: '판타지·모험', year: 2006 },
  { title: '신비한 동물사전', emoji: '🧳🦄🧙🗽', hint: '가방 속 마법 동물들이 뉴욕에 풀려나요', category: '판타지·모험', year: 2016 },
  { title: '위키드', emoji: '🧙‍♀️💚🫧🎤', hint: '초록 피부의 마녀와 착한 마녀의 우정 이야기예요', category: '판타지·모험', year: 2024 },

  // ===== 명작·가족 =====
  { title: '나 홀로 집에', emoji: '🏠👦🎄🪤', hint: '혼자 집에 남은 소년이 도둑들을 막아요', category: '명작·가족', year: 1990 },
  { title: '쥬라기 공원', emoji: '🦖🏝️🧬🚙', hint: '공룡을 되살린 섬의 테마파크 이야기예요', category: '명작·가족', year: 1993 },
  { title: '타이타닉', emoji: '🚢🧊💑🌊', hint: '빙산에 부딪힌 배에서 피어난 사랑이에요', category: '명작·가족', year: 1997 },
  { title: '백 투 더 퓨처', emoji: '🚗⚡⏰👦', hint: '타임머신 자동차로 부모님의 과거로 가요', category: '명작·가족', year: 1985 },
  { title: 'E.T.', emoji: '👽🚲🌕👆', hint: '지구에 남겨진 외계인과 소년의 우정이에요', category: '명작·가족', year: 1982 },
  { title: '오즈의 마법사', emoji: '🌪️👠🦁🤖', hint: '회오리바람에 날아간 소녀가 마법사를 찾아가요', category: '명작·가족', year: 1939 },
  { title: '인터스텔라', emoji: '🚀🌌⏳👨‍👧', hint: '우주로 떠난 아빠와 딸의 시간을 넘는 이야기예요', category: '명작·가족', year: 2014 },
  { title: '사운드 오브 뮤직', emoji: '⛰️🎶👨‍👩‍👧‍👦🎸', hint: '일곱 남매와 가정교사가 함께 노래를 불러요', category: '명작·가족', year: 1965 },
  { title: '패딩턴', emoji: '🐻🧥🍊🎩', hint: '마멀레이드를 좋아하는 곰이 런던에 와요', category: '명작·가족', year: 2014 },
  { title: '원더', emoji: '👦🧑‍🚀🏫❤️', hint: '얼굴이 남다른 소년이 처음 학교에 가요', category: '명작·가족', year: 2017 },
  { title: '포레스트 검프', emoji: '🏃🍫🪶🏓', hint: '초콜릿 상자 같은 인생을 달려온 남자예요', category: '명작·가족', year: 1994 },
  { title: '보헤미안 랩소디', emoji: '🎤👑🎸🎹', hint: '전설의 록 밴드 보컬의 삶을 다뤄요', category: '명작·가족', year: 2018 },
  { title: '메리 포핀스', emoji: '☂️👩🎩🪁', hint: '우산을 타고 날아온 보모가 아이들을 돌봐요', category: '명작·가족', year: 1964 },
  { title: '위대한 쇼맨', emoji: '🎪🎩🐘🎤', hint: '서커스를 만든 쇼맨의 이야기를 노래로 담았어요', category: '명작·가족', year: 2017 },
];

// API 없이 미리 만들어 둔 퀴즈 (항상 같은 5문제)
export const FIXED_QUIZ = [
  {
    title: '겨울왕국', emoji: '❄️👸👸⛄', hint: '얼음 마법을 쓰는 언니와 동생 이야기예요', category: '애니메이션', year: 2013,
    choices: ['모아나', '겨울왕국', '라푼젤', '주토피아'],
  },
  {
    title: '부산행', emoji: '🚄🧟👨‍👧😱', hint: '달리는 기차 안에서 좀비와 맞서 싸워요', category: '한국 영화', year: 2016,
    choices: ['해운대', '엑시트', '괴물', '부산행'],
  },
  {
    title: '해리 포터와 마법사의 돌', emoji: '⚡👓🧙🦉', hint: '열한 살 소년이 마법 학교에 입학해요', category: '판타지·모험', year: 2001,
    choices: ['해리 포터와 마법사의 돌', '반지의 제왕: 반지 원정대', '신비한 동물사전', '나니아 연대기: 사자, 마녀 그리고 옷장'],
  },
  {
    title: '아이언맨', emoji: '🦾🔴🟡🚀', hint: '천재 사업가가 강철 슈트를 만들어 입어요', category: '히어로·액션', year: 2008,
    choices: ['토르: 천둥의 신', '앤트맨', '아이언맨', '블랙 팬서'],
  },
  {
    title: '나 홀로 집에', emoji: '🏠👦🎄🪤', hint: '혼자 집에 남은 소년이 도둑들을 막아요', category: '명작·가족', year: 1990,
    choices: ['백 투 더 퓨처', '나 홀로 집에', '쥬라기 공원', 'E.T.'],
  },
];
