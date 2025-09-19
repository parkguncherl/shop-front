# aws서버
# 15.164.66.87 프론트
# 13.209.18.102 백엔드 (내부ip : 172.31.10.108)
# id:binblurdev
# pw:binblur1

#  배포 기본설정

# 캐쉬 지우기
rm -rf .next/cache/*
sudo journalctl --vacuum-time=3d  # 3일 이전 로그 삭제
npm cache clean --force


### 1. 메인 브런치를 dev르 push (git action 자동배포 → 빌드 → 재시작 (깃 액션관리)
```sh
git push --force origin dev:main

문제 발생 시 aws 서버에서 dev 브랜치로 pull, main 브랜치와 merge, 이후 이하 동작 수행(본 동작이 권장됨)
```

### etc (서버내부사용) 
로컬 브랜치를 원격 브랜치와 동일하게 설정

## github action에서 deploy 한다. Create main.yml

git fetch origin
git reset --hard origin
git pull

타입 생성 (Open Api Generator)
```sh
npm run openapi:prod
```
빌드
```sh
npm run build:prod
```
실행
```sh
npm run start:prod
```
배경실행
```sh
nohup npm run start:prod &
```
출력확인

```sh
tail -f nohup.out
```