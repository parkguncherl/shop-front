# shop-frontend
빈블러 주문관리 시스템(프론트)

- version
    - node : 20.8.0
    - react : 18.3.1
    - react-query : 4.36.1
    - zustand : 4.3.2

## eslint 설정
- 소스코드 포맷 표준화를 위해 아래와 같이 설정

### VSCode
- Extensions (Ctrl + Shift + X) -> eslint, prettier 설치<br>
  ![image](https://user-images.githubusercontent.com/44829661/193712256-31f51c01-ce97-4921-bd66-f04380f05667.png)
- File - Preferences - Settings (Ctrl + ,) -> 오른쪽 상단의 Open Settings (JSON) 클릭 -> 하단의 내용 입력 후 Save (Ctrl + S)<br><br>
  ![image](https://user-images.githubusercontent.com/44829661/193712490-dd1e09a6-2183-45e5-b127-15accc65b5fb.png)
  ```javascript
    {
      "editor.formatOnSave": true,
      "editor.formatOnType": true,
      "editor.codeActionsOnSave": {
          "source.fixAll": true
      }
    }
  ```

### Intellij, Webstorm
- Settings - ESLint
  - Manual ESLint configuration
    - ESLint package 경로 : ${프로젝트 root}\node_modules\eslint
    - Working directories 경로 : ${프로젝트 root}
  - Run eslint --fix on save 체크

## 프로젝트 설정

### 패키지 설치 
```sh
npm install
```

### 타입 생성 (Open Api Generator)
```sh
npm run openapi:local
```

### 실행

```sh
npm run dev
```

### 모듈 클린 (.next폴더 , 노드모듈 , 제네레이터)

```sh
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force generated

```

