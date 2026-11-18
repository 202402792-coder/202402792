// 프로젝트관리론 바이브 코딩 MVP: 고정된 메뉴 목록을 이용한 간단한 추천 웹앱
// 외부 API, 회원가입, 서버는 사용하지 않습니다.
'use strict';

const MENU_DATA = Object.freeze({
  '한식': ['비빔밥', '김치찌개', '된장찌개', '제육볶음', '불고기', '순두부찌개'],
  '중식': ['짜장면', '짬뽕', '탕수육', '볶음밥', '마파두부', '고추잡채'],
  '일식': ['돈카츠', '우동', '라멘', '규동', '초밥', '일본식 카레'],
  '양식': ['파스타', '리조또', '피자', '햄버거', '샌드위치', '스테이크'],
  '분식': ['떡볶이', '김밥', '순대', '라볶이', '쫄면', '라면']
});
const EMOJI = Object.freeze({'한식':'🍚','중식':'🥡','일식':'🍜','양식':'🍝','분식':'🍢'});
const STORAGE_KEY = 'today-menu-favorites-v1';

const $ = (id) => document.getElementById(id);
const categorySelect = $('categorySelect');
const recommendBtn = $('recommendBtn');
const retryBtn = $('retryBtn');
const favoriteBtn = $('favoriteBtn');
let currentMenu = null;
let favorites = [];
let storageAvailable = true;

function getMenuPool(category) {
  const result = [];
  for (const [group, names] of Object.entries(MENU_DATA)) {
    if (category !== '전체' && group !== category) continue;
    for (const name of names) result.push({category: group, name});
  }
  return result;
}
function menuKey(menu) {return `${menu.category}::${menu.name}`;}
function isFavorite(menu) {return favorites.some(item => menuKey(item) === menuKey(menu));}
function pickRandom(pool, lastMenu) {
  // 같은 종류의 메뉴가 2개 이상이라면 직전 메뉴가 연속으로 나오지 않도록 함.
  const eligible = (lastMenu && pool.length > 1)
    ? pool.filter(item => menuKey(item) !== menuKey(lastMenu))
    : pool;
  return eligible[Math.floor(Math.random() * eligible.length)] ?? null;
}
function setStatus(message) {$('statusText').textContent = message;}
function renderCurrent() {
  $('emptyResult').hidden = Boolean(currentMenu);
  $('resultContent').hidden = !currentMenu;
  if (!currentMenu) return;
  $('menuEmoji').textContent = EMOJI[currentMenu.category];
  $('menuCategory').textContent = currentMenu.category;
  $('menuName').textContent = currentMenu.name;
  const alreadySaved = isFavorite(currentMenu);
  favoriteBtn.disabled = alreadySaved;
  favoriteBtn.textContent = alreadySaved ? '✓ 저장한 메뉴' : '☆ 마음에 들어요';
}
function loadFavorites() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 저장 형식이 변조되거나 오래된 경우에도 메뉴 목록에 존재하는 값만 가져옵니다.
    const allowed = new Set(getMenuPool('전체').map(menuKey));
    const seen = new Set();
    return parsed.filter(item => {
      if (!item || typeof item.category !== 'string' || typeof item.name !== 'string') return false;
      const key = menuKey(item);
      if (!allowed.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    storageAvailable = false;
    return [];
  }
}
function saveFavorites() {
  if (!storageAvailable) return;
  try {window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));}
  catch (error) {storageAvailable = false;}
  $('storageNotice').hidden = storageAvailable;
}
function renderFavorites() {
  $('favoritesCount').textContent = `${favorites.length}개`;
  $('favoritesEmpty').hidden = favorites.length > 0;
  const list = $('favoritesList');
  list.hidden = favorites.length === 0;
  list.replaceChildren();
  for (const item of favorites) {
    const li = document.createElement('li'); li.className = 'favorite-item';
    const symbol = document.createElement('span'); symbol.className = 'favorite-symbol';
    symbol.setAttribute('aria-hidden', 'true'); symbol.textContent = EMOJI[item.category];
    const detail = document.createElement('div'); detail.className = 'favorite-detail';
    const name = document.createElement('div'); name.className = 'favorite-name'; name.textContent = item.name;
    const category = document.createElement('div'); category.className = 'favorite-category'; category.textContent = item.category;
    detail.append(name, category);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-btn';
    remove.textContent = '삭제'; remove.setAttribute('aria-label', `${item.name} 저장 목록에서 삭제`);
    remove.addEventListener('click', () => {
      favorites = favorites.filter(saved => menuKey(saved) !== menuKey(item));
      saveFavorites(); renderFavorites(); renderCurrent(); setStatus(`${item.name} 메뉴를 저장 목록에서 삭제했어.`);
    });
    li.append(symbol, detail, remove); list.appendChild(li);
  }
}
function recommend() {
  const selected = categorySelect.value;
  const pool = getMenuPool(selected);
  if (pool.length === 0) {currentMenu = null;renderCurrent();setStatus('추천 가능한 메뉴가 없어. 다른 종류를 선택해 줘.');return;}
  currentMenu = pickRandom(pool, currentMenu);
  renderCurrent();setStatus('');
}
categorySelect.addEventListener('change', () => {
  currentMenu = null;renderCurrent();setStatus('');
});
recommendBtn.addEventListener('click', recommend);
retryBtn.addEventListener('click', recommend);
favoriteBtn.addEventListener('click', () => {
  if (!currentMenu || isFavorite(currentMenu)) return;
  favorites.push({...currentMenu});
  saveFavorites();renderFavorites();renderCurrent();setStatus(`${currentMenu.name} 메뉴를 저장했어.`);
});
favorites = loadFavorites();
$('storageNotice').hidden = storageAvailable;
renderFavorites();renderCurrent();