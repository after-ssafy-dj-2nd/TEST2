import { setStyleDisplay } from '../util/setStyleDisplay.js';
import { toggleActiveKeyword } from '../util/toggleActiveKeyword.js';
import { Debounce } from '../util/Debounce.js';
import { getItem, setItem } from '../util/sessionStorage.js';
import { movePage } from '../util/movePage.js';
import Error from './Error.js';

// SearchBar 컴포넌트에서 사용되는 상태값 모음
let $inputKeyword;
let $keywords;
let $onSearch;
let $isError;
let $data;
let $key;
let $arrowKeyIndex;
let $errorData;

// 방향키 key 이름
const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

export default function SearchBar(inputKeyword, keywords, onSearch) {
  $inputKeyword = inputKeyword;
  $keywords = keywords;
  $onSearch = onSearch;

  // 마우스로 다른 곳을 클릭하여 input이 focus를 잃어버리는 경우 추천 검색어 창 닫기
  $inputKeyword.addEventListener('blur', () => {
    // setTimeout으로 지연 시간을 100ms 설정해서 추천 검색어를 클릭했는지 우선 판별 후
    // 다른 부분을 클릭해서 focus가 잃었다고 판단되면 그 때 추천 검색어 창 닫기
    setTimeout(() => setStyleDisplay($keywords, 'none'), 100);
  });

  // 추천 검색어 키워드 클릭 시 검색 결과 페이지로 이동(Event Delegation)
  $keywords.addEventListener('click', e => {
    const path = e.path;
    const recommendKeyword = path.find(elem => elem.tagName === 'LI');

    if (recommendKeyword) {
      movePage(`?q=${recommendKeyword.innerText}`);
      return
    }
  })
  
  // 검색창에 키보드의 입력이 들어갔을 때
  $inputKeyword.addEventListener('keyup', Debounce(async e => {
    const { value } = e.target;
    const { key } = e;
    $key = key;
    $arrowKeyIndex = arrowKeys.indexOf($key);

    // 왼쪽(2), 오른쪽(3) 화살표를 누른 경우 무시
    if ($arrowKeyIndex >= 2) {
      return
    }

    // Enter 키를 누른 경우 검색 결과 보여주기
    if ($key === 'Enter') {
      movePage(`?q=${value}`);
    }

    // Esc 키를 누른 경우 추천 검색어 창 안 보이게 닫기
    if ($key === 'Escape') {
      setStyleDisplay($keywords, 'none');
      return
    };

    // 위(0) 또는 아래(1) 화살표 누른 경우 추천 검색어 하이라이트 표시
    // 추천 검색어 리스트가 보여야 하고 추천 검색어 결과가 있을 때만 동작
    if ($arrowKeyIndex === 0 || $arrowKeyIndex === 1) {
      $keywords.style.display === 'block' && $data.length ? moveFocusKeywords() : null;
      return
    }

    // 키보드의 입력 이벤트가 들어올 때
    // 이전의 keyword 값(getItem('beforeKeyword'))과 현재 keyword 값($inputKeyword.value)을 비교해서
    // 다른 경우에만 추천 검색어 결과 값 가져오기
    if(getItem('beforeKeyword') === $inputKeyword.value) return;
    setItem('beforeKeyword', $inputKeyword.value);

    // 추천 검색어 결과 값 가져오기
    const result = await $onSearch(value);
    $isError = result.isError;
    if ($isError) {
      $errorData = result.data;
    } else {
      $data = result.data;
    }
    
    render();
  }, 100))
}

// 추천 검색어 리스트 보여주기
function showRecommendKeywords() {
  $keywords.innerHTML = '';

  // 에러 발생시
  if ($isError) {
    Error($keywords, $errorData);
    return
  }

  // 추천 검색어가 없을 때
  if (!$data.length) {
    $keywords.innerHTML = `<p class="error-alert no-result-alert">추천 검색어가 없습니다.</p>`;
    return
  }

  // 추천 검색어 보여주기
  const keywordList = document.createElement('ul');
  keywordList.innerHTML = $data.map(data => `<li>${data}</li>`).join('');

  $keywords.appendChild(keywordList);
}

// 화살표로 이동시 추천 검색어 focus 이동
function moveFocusKeywords() {
  const recommendKeywords = $keywords.querySelectorAll('li');
  const activeKeywordIndex = Array.from(recommendKeywords)
    .findIndex(keyword => Array.from(keyword.classList).includes('active'));
  
  // 맨 처음 아무것도 하이라이트가 되어 있지 않을 때 첫 번째 항목에 하이라이트 표시
  if (activeKeywordIndex === -1) {
    toggleActiveKeyword(recommendKeywords, 0);
    $inputKeyword.value = recommendKeywords[0].innerText;
    return
  }

  // 아래 화살표 눌렀을 때
  if ($arrowKeyIndex === 1) {
    if (activeKeywordIndex === $data.length - 1) return; // 마지막 검색어에 하이라이트인 경우 무시
    toggleActiveKeyword(recommendKeywords, activeKeywordIndex, 1);
    $inputKeyword.value = recommendKeywords[activeKeywordIndex + 1].innerText;
    return
  }

  // 위 화살표 눌렀을 때
  if ($arrowKeyIndex === 0) {
    if (activeKeywordIndex === 0) return; // 첫 번째 검색어에 하이라이트인 경우 무시
    toggleActiveKeyword(recommendKeywords, activeKeywordIndex, -1);
    $inputKeyword.value = recommendKeywords[activeKeywordIndex - 1].innerText;
    return
  }
}

function render() {
  setStyleDisplay($keywords, 'block');
  showRecommendKeywords();
}