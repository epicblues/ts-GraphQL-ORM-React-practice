// 인위적인 delay를 거는 함수(async 함수 내부에서 await을 통해서 실행)

const sleep = (ms: number) =>
  new Promise((res) => {
    setTimeout(res, ms);
  });
