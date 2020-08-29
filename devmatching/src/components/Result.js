import { setStyleDisplay } from '../util/setStyleDisplay.js';
import { getQueryParams } from '../util/getQueryParams.js';
import { setItem } from '../util/sessionStorage.js';
import Error from './Error.js';

// Result 컴포넌트에서 사용되는 상태값 모음
let $searchResults;
let $inputKeyword;
let $onSearch;
let $isError;
let $data;
let $errorData;

export default async function Result(searchResults, inputKeyword, onSearch) {
  $searchResults = searchResults;
  $inputKeyword = inputKeyword;
  $onSearch = onSearch;

  // url 주소에 query parameter가 있는 경우 해당 검색어의 결과 바로 표시
  if (!window.location.search.includes('?q=')) {
    setItem('beforeKeyword', '');
    return
  }
  const result = await getQuery();
  saveResult(result);
  
  render();
}

// query parameter 가져오기
async function getQuery() {
  const query = getQueryParams();
  $inputKeyword.value = query;
  setItem('beforeKeyword', $inputKeyword.value);
  return await $onSearch(query);
}

// Result 컴포넌트에 API 요청해서 받아온 결과 값 저장하기
function saveResult(result) {
  $isError = result.isError;
  if (!$isError) {
    $data = result.data.data;
  } else {
    $errorData = result.data;
  }
}

function render() {
  // 결과 영역 초기화
  $searchResults.innerHTML = '';

  // 에러 발생시
  if ($isError) {
    setStyleDisplay($searchResults, 'block');
    Error($searchResults, $errorData);
    return
  }

  // 검색 결과가 없을 때
  if (!$data.length) {
    setStyleDisplay($searchResults, 'block');
    $searchResults.innerHTML = `<p class="error-alert no-result-alert">검색 결과가 없습니다.</p>`;
    return
  }

  // 검색 결과 보여주기
  setStyleDisplay($searchResults, 'grid');
  $searchResults.innerHTML = $data
    .map(cat => `<article><img src="${cat.url}" /></article>`)
    .join('');
}