export const TOPICS = [
  { id: 'privacy', label: '개인정보 · 프라이버시', hint: '개인정보 유출, 위치 공유, 얼굴 사진 무단 게시' },
  { id: 'bullying', label: '사이버불링 · 언어폭력', hint: '악플, 단톡방 따돌림, 게임 속 욕설' },
  { id: 'copyright', label: '저작권 · 창작 윤리', hint: '무단 다운로드, 그림·영상 도용, 출처 밝히지 않기' },
  { id: 'misinfo', label: '허위정보 · 가짜뉴스', hint: '잘못된 정보 퍼뜨리기, 확인 없이 공유하기' },
  { id: 'deepfake', label: 'AI · 딥페이크', hint: 'AI로 가짜 이미지 만들기, AI로 숙제 대신하기' },
  { id: 'addiction', label: '디지털 중독 · 과몰입', hint: '게임·영상 시간 관리, 현실과 온라인의 균형' },
  { id: 'manners', label: '온라인 예절', hint: '채팅 매너, 익명성 남용, 존중 없는 소통' },
  { id: 'footprint', label: '디지털 발자국', hint: '한번 올린 글이나 사진이 남는다는 것, 미래에 미치는 영향' },
];

export const STAGES = [
  { n: 1, part: '발단', label: '옛날 옛적에', question: '주인공은 누구이고, 어디에 살고 있나요?' },
  { n: 2, part: '발단', label: '평범한 하루', question: '주인공의 평범한 하루는 어떤 모습인가요?' },
  { n: 3, part: '전개', label: '그러던 어느 날', question: '그러던 어느 날, 어떤 일이 생겼나요?' },
  { n: 4, part: '전개', label: '처음의 선택', question: '주인공은 처음에 어떻게 행동했나요?' },
  { n: 5, part: '위기', label: '문제가 생기다', question: '그것 때문에 어떤 문제가 생겼나요?' },
  { n: 6, part: '위기', label: '점점 커지는 문제', question: '문제가 점점 커졌어요. 무슨 일이 벌어졌나요?' },
  { n: 7, part: '절정', label: '결정적인 순간', question: '가장 결정적인 순간, 주인공은 어떤 선택을 했나요?' },
  { n: 8, part: '결말', label: '선택의 결과', question: '그 선택으로 어떤 일이 벌어졌나요?' },
  { n: 9, part: '결말', label: '그 후로는', question: '그 후로 주인공(또는 주변)은 어떻게 달라졌나요?' },
];

export const PART_COLORS = {
  발단: '#6fb98f',
  전개: '#ffc93c',
  위기: '#ff9ec4',
  절정: '#ff6b4a',
  결말: '#6fb98f',
};
