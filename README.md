# 머스트정보기술 홈페이지 · GitHub Pages

현재 회사 홈페이지의 메인과 서브페이지 18개를 정적 HTML로 변환한 배포용 프로젝트입니다.
디자인, 스크롤 애니메이션, 사업분야 탭, 모바일 메뉴와 이메일 문의 링크를 포함합니다.

## GitHub에 배포

1. 이 폴더의 내용(`.github` 포함)을 GitHub 저장소의 `main` 브랜치에 올립니다.
2. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택합니다.
3. **Actions → Publish company website → Run workflow**를 실행합니다. 이후 `main`에 올린 변경은 자동 배포됩니다.
4. 작업이 성공하면 **Settings → Pages** 또는 Actions의 `github-pages` 환경에 표시되는 공개 주소로 확인합니다.

공개 파일은 `site/` 안의 HTML·CSS·JS·이미지입니다. Java, JSP, Tomcat, 회사소개서 원본과 제작 자료는 포함하지 않습니다.
모든 내부 경로는 상대 경로이므로 계정 사이트와 `/저장소명/` 형태의 프로젝트 사이트 모두 사용할 수 있습니다.
별도 도메인은 공개 주소를 확인한 뒤 Pages 설정에서 연결할 수 있습니다.

## 로컬 확인

Node.js 18 이상에서 다음을 실행합니다.

```text
node scripts/verify-static.mjs
node scripts/preview.mjs
```

미리보기 주소는 `http://127.0.0.1:4173/pages-preview/`입니다.
이 서버는 개발 중 확인 용도이며 GitHub에서의 실제 배포와 별개입니다.

## JSP 원본 수정 후 갱신

기존 `C:\MUST\workspace\company-homepage` 프로젝트를 수정하고 Eclipse Tomcat 8082에 반영한 뒤 실행합니다.

```text
node C:\MUST\scripts\Export-GitHubPages.mjs
```

변환된 `site/`와 `site-manifest.json`을 검토하고 저장소에 올립니다.
현재 화면을 내보내는 방식이라 GitHub Actions 실행 중에는 JSP 서버가 필요하지 않습니다.

GitHub Pages에서는 Java·전자정부프레임워크·Tomcat과 서버 API를 실행하지 않습니다.
현재 이메일 링크는 사용자의 메일 앱을 열며 홈페이지가 메일을 직접 전송하거나 저장하지 않습니다.

참고: [GitHub Pages 소개](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages),
[GitHub Actions 배포](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
